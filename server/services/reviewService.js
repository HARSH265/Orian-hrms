const Review = require('../model/review.model');
const User = require('../model/user');
const logger = require('../utils/logger');

const initiateReviewCycle = async (cycleName, employeeIds) => {
    const employees = await User.find({ '_id': { $in: employeeIds }, isActive: true });

    // Check for existing cycles with same name for these employees
    const existingReviews = await Review.find({
        employee: { $in: employeeIds },
        cycleName: cycleName
    });
    if (existingReviews.length > 0) {
        throw new Error(`A review cycle named "${cycleName}" already exists for some employees.`);
    }

    const reviewsToCreate = [];
    for (const employee of employees) {
        if (employee.manager) {
            reviewsToCreate.push({
                employee: employee._id,
                manager: employee.manager,
                cycleName: cycleName,
            });
        }
    }

    await Review.insertMany(reviewsToCreate);
    return reviewsToCreate;
};

const getMyReviews = async (userId) => {
    const reviews = await Review.find({ employee: userId })
        .populate('manager', 'name')
        .sort({ createdAt: -1 })
        .lean();
    return reviews;
};

const getTeamReviews = async (userId) => {
    const reviews = await Review.find({ manager: userId })
        .populate('employee', 'name')
        .sort({ createdAt: -1 })
        .lean();
    return reviews;
};

const submitSelfAssessment = async (reviewId, userId, selfAssessment) => {
    const review = await Review.findById(reviewId);
    if (!review) return { error: 'not_found' };
    if (review.employee.toString() !== userId.toString()) return { error: 'unauthorized' };
    if (review.status !== 'Pending Self-Assessment') return { error: 'invalid_status' };

    // Validate required fields
    if (!selfAssessment.strengths || !selfAssessment.areasForImprovement || !selfAssessment.feedback) {
        throw new Error('All fields are required: strengths, areasForImprovement, feedback');
    }

    review.selfAssessment = selfAssessment;
    review.employeeSubmitDate = new Date();
    review.status = 'Pending Manager Review';
    await review.save();
    return { review };
};

const submitManagerReview = async (reviewId, userId, managerReview) => {
    const review = await Review.findById(reviewId);
    if (!review) return { error: 'not_found' };
    if (review.manager.toString() !== userId.toString()) return { error: 'unauthorized' };
    if (review.status !== 'Pending Manager Review') return { error: 'invalid_status' };

    // Validate required fields
    if (!managerReview.overallPerformance || !managerReview.goalsForNextCycle || !managerReview.managerFeedback) {
        throw new Error('All fields are required: overallPerformance, goalsForNextCycle, managerFeedback');
    }

    review.managerReview = managerReview;
    review.managerSubmitDate = new Date();
    review.status = 'Complete';
    await review.save();
    return { review };
};

module.exports = {
    initiateReviewCycle,
    getMyReviews,
    getTeamReviews,
    submitSelfAssessment,
    submitManagerReview,
};
