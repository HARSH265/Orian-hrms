const { notificationService } = require('../services');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../model/user');
const {
    initiateReviewCycle,
    getMyReviews,
    getTeamReviews,
    submitSelfAssessment,
    submitManagerReview,
} = require('../services/reviewService');

exports.initiateReviewCycle = asyncHandler(async (req, res, next) => {
    try {
        const { cycleName, employeeIds } = req.body;

        const reviewsToCreate = await initiateReviewCycle(cycleName, employeeIds);

        for (const review of reviewsToCreate) {
            await notificationService.createNotification({
                recipient: review.employee,
                message: `Your performance review cycle '${cycleName}' has begun. Please complete your self-assessment.`,
                link: '/performance/my-reviews',
                type: 'General'
            }, req);
            const employee = await User.findById(review.employee).select('name');
            await notificationService.createNotification({
                recipient: review.manager,
                message: `The performance review cycle for ${employee.name} has begun.`,
                link: '/performance/team-reviews',
                type: 'General'
            }, req);
        }

        res.status(201).json({ success: true, message: `${reviewsToCreate.length} reviews created successfully.` });
    } catch (error) {
        next(error);
    }
});

exports.getMyReviews = asyncHandler(async (req, res, next) => {
    try {
        const reviews = await getMyReviews(req.user.id);
        res.status(200).json({ success: true, data: reviews });
    } catch (error) { next(error); }
});

exports.getTeamReviews = asyncHandler(async (req, res, next) => {
    try {
        const reviews = await getTeamReviews(req.user.id);
        res.status(200).json({ success: true, data: reviews });
    } catch (error) { next(error); }
});

exports.submitSelfAssessment = asyncHandler(async (req, res, next) => {
    try {
        const result = await submitSelfAssessment(req.params.id, req.user.id, req.body.selfAssessment);
        if (result.error === 'not_found') {
            return res.status(404).json({ success: false, message: 'Review not found.' });
        }
        if (result.error === 'unauthorized') {
            return res.status(403).json({ success: false, message: 'Not authorized.' });
        }
        if (result.error === 'invalid_status') {
            return res.status(400).json({ success: false, message: 'Self-assessment already submitted.' });
        }

        await notificationService.createNotification({
            recipient: result.review.manager,
            sender: req.user.id,
            message: `${req.user.name} has submitted their self-assessment.`,
            link: `/performance/team-reviews/${result.review._id}`,
            type: 'General'
        }, req);

        res.status(200).json({ success: true, data: result.review });
    } catch (error) { next(error); }
});

exports.submitManagerReview = asyncHandler(async (req, res, next) => {
    try {
        const result = await submitManagerReview(req.params.id, req.user.id, req.body.managerReview);
        if (result.error === 'not_found') {
            return res.status(404).json({ success: false, message: 'Review not found.' });
        }
        if (result.error === 'unauthorized') {
            return res.status(403).json({ success: false, message: 'Not authorized.' });
        }
        if (result.error === 'invalid_status') {
            return res.status(400).json({ success: false, message: 'Cannot submit this review.' });
        }

        await notificationService.createNotification({
            recipient: result.review.employee,
            sender: req.user.id,
            message: `Your manager has completed your performance review for '${result.review.cycleName}'.`,
            link: `/performance/my-reviews/${result.review._id}`,
            type: 'General'
        }, req);

        res.status(200).json({ success: true, data: result.review });
    } catch (error) { next(error); }
});
