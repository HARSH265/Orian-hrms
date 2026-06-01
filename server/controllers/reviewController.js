const Review = require('../model/review.model');
const User = require('../model/user');
const { createNotification } = require('../services/notificationService');
const asyncHandler = require('../utils/asyncHandler');
const { createTask } = require('./taskController'); // We might need to refactor this

// NOTE: Creating tasks from another controller is complex. A better approach is
// to have a reusable `taskService` just like we have a `notificationService`.
// For now, we will create notifications and assume the user will see them.

// @desc    Admin initiates a new review cycle
// @route   POST /api/reviews/initiate-cycle
exports.initiateReviewCycle = asyncHandler(async (req, res, next) => {
    try {
        const { cycleName, employeeIds } = req.body; // Expects a name and a list of employee IDs

        const employees = await User.find({ '_id': { $in: employeeIds }, isActive: true });
        
        const reviewsToCreate = [];
        for (const employee of employees) {
            if (employee.manager) { // Only create reviews for employees with a manager
                reviewsToCreate.push({
                    employee: employee._id,
                    manager: employee.manager,
                    cycleName: cycleName,
                });
            }
        }

        await Review.insertMany(reviewsToCreate);

        // Notify all involved employees and managers
        for (const review of reviewsToCreate) {
            await createNotification({
                recipient: review.employee,
                message: `Your performance review cycle '${cycleName}' has begun. Please complete your self-assessment.`,
                link: '/performance/my-reviews',
                type: 'General'
            },req);
            await createNotification({
                recipient: review.manager,
                message: `The performance review cycle for ${await User.findById(review.employee).select('name').then(u => u.name)} has begun.`,
                link: '/performance/team-reviews',
                type: 'General'
            },req);
        }

        res.status(201).json({ success: true, message: `${reviewsToCreate.length} reviews created successfully.` });
    } catch (error) {
        next(error);
    }
    });


// @desc    Get reviews assigned TO me (as employee)
exports.getMyReviews = asyncHandler(async (req, res, next) => {
    try {
        const reviews = await Review.find({ employee: req.user.id })
            .populate('manager', 'name')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: reviews });
    } catch (error) { next(error); }
    });

// @desc    Get reviews I need to conduct (as manager)
exports.getTeamReviews = asyncHandler(async (req, res, next) => {
    try {
        const reviews = await Review.find({ manager: req.user.id })
            .populate('employee', 'name')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: reviews });
    } catch (error) { next(error); }
    });


// @desc    Employee submits their self-assessment
exports.submitSelfAssessment = asyncHandler(async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.id);
        // Security checks: ensure user is the correct employee and status is correct
        if (!review || review.employee.toString() !== req.user.id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized.' });
        }
        if (review.status !== 'Pending Self-Assessment') {
            return res.status(400).json({ success: false, message: 'Self-assessment already submitted.' });
        }

        review.selfAssessment = req.body.selfAssessment;
        review.employeeSubmitDate = new Date();
        review.status = 'Pending Manager Review';
        await review.save();

        // Notify manager
        await createNotification({
            recipient: review.manager,
            sender: req.user.id,
            message: `${req.user.name} has submitted their self-assessment.`,
            link: `/performance/team-reviews/${review._id}`,
            type: 'General'
        },req);

        res.status(200).json({ success: true, data: review });
    } catch (error) { next(error); }
    });

// @desc    Manager submits their final review
exports.submitManagerReview = asyncHandler(async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.id);
        // Security checks
        if (!review || review.manager.toString() !== req.user.id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized.' });
        }
        if (review.status !== 'Pending Manager Review') {
            return res.status(400).json({ success: false, message: 'Cannot submit this review.' });
        }

        review.managerReview = req.body.managerReview;
        review.managerSubmitDate = new Date();
        review.status = 'Complete';
        await review.save();
        
        // Notify employee
        await createNotification({
            recipient: review.employee,
            sender: req.user.id,
            message: `Your manager has completed your performance review for '${review.cycleName}'.`,
            link: `/performance/my-reviews/${review._id}`,
            type: 'General'
        },req);

        res.status(200).json({ success: true, data: review });
    } catch (error) { next(error); }
};