const reviewService = require('../services/reviewService');
const { createAuditLog } = require('../services/auditLogService');
const { createNotification } = require('../services/notificationService');
const asyncHandler = require('../utils/asyncHandler');

exports.initiateReviewCycle = asyncHandler(async (req, res) => {
    const { cycleName, employeeIds, templateId } = req.body;
    const result = await reviewService.initiateReviewCycle(cycleName, employeeIds, templateId, req.user.id, req.ip);

    for (const review of result.reviews) {
        await createNotification({
            recipient: review.employee._id, sender: req.user.id,
            message: `Your performance review cycle '${cycleName}' has begun. Please complete your self-assessment.`,
            link: '/performance/my-reviews', type: 'General',
        }, req);
        await createNotification({
            recipient: review.manager._id, sender: req.user.id,
            message: `The performance review cycle for ${review.employee.name} has begun.`,
            link: '/performance/team-reviews', type: 'General',
        }, req);
    }

    res.status(201).json({
        success: true, message: `${result.reviews.length} reviews created.`,
        skipped: result.skipped,
    });
});

exports.getReviewById = asyncHandler(async (req, res) => {
    const review = await reviewService.getReviewById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });
    res.status(200).json({ success: true, data: review });
});

exports.getMyReviews = asyncHandler(async (req, res) => {
    const result = await reviewService.getMyReviews(req.user.id, req.query);
    res.status(200).json({ success: true, ...result });
});

exports.getTeamReviews = asyncHandler(async (req, res) => {
    const result = await reviewService.getTeamReviews(req.user.id, req.query);
    res.status(200).json({ success: true, ...result });
});

exports.submitSelfAssessment = asyncHandler(async (req, res) => {
    const review = await reviewService.submitSelfAssessment(req.params.id, req.user.id, req.body.selfAssessment);

    await createAuditLog({
        actor: req.user.id, action: 'REVIEW_SELF_ASSESSMENT_SUBMITTED',
        target: { id: review._id, type: 'Review' },
        details: { cycleName: review.cycleName },
        ipAddress: req.ip,
    });
    await createNotification({
        recipient: review.manager, sender: req.user.id,
        message: `${req.user.name} has submitted their self-assessment.`,
        link: `/performance/team-reviews/${review._id}`, type: 'General',
    }, req);

    res.status(200).json({ success: true, data: review });
});

exports.submitManagerReview = asyncHandler(async (req, res) => {
    const review = await reviewService.submitManagerReview(req.params.id, req.user.id, req.body.managerReview);

    await createAuditLog({
        actor: req.user.id, action: 'REVIEW_MANAGER_SUBMITTED',
        target: { id: review._id, type: 'Review' },
        details: { cycleName: review.cycleName, rating: review.rating },
        ipAddress: req.ip,
    });
    await createNotification({
        recipient: review.employee, sender: req.user.id,
        message: `Your manager has completed your performance review for '${review.cycleName}'.`,
        link: `/performance/my-reviews/${review._id}`, type: 'General',
    }, req);

    res.status(200).json({ success: true, data: review });
});

exports.approveReview = asyncHandler(async (req, res) => {
    const review = await reviewService.approveReview(req.params.id, req.user.id, req.ip);
    res.status(200).json({ success: true, message: 'Review approved.', data: review });
});

exports.archiveReview = asyncHandler(async (req, res) => {
    const review = await reviewService.archiveReview(req.params.id, req.user.id, req.ip);
    res.status(200).json({ success: true, message: 'Review archived.', data: review });
});

exports.addGoal = asyncHandler(async (req, res) => {
    const goals = await reviewService.addGoal(req.params.id, req.user.id, req.body);
    res.status(201).json({ success: true, data: goals });
});

exports.updateGoal = asyncHandler(async (req, res) => {
    const goals = await reviewService.updateGoal(req.params.id, req.params.goalId, req.body);
    res.json({ success: true, data: goals });
});

exports.getReviewHistory = asyncHandler(async (req, res) => {
    const result = await reviewService.getReviewHistory(req.params.employeeId);
    res.json({ success: true, ...result });
});

exports.exportReviews = asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.cycleName) filter.cycleName = req.query.cycleName;
    const csv = await reviewService.exportReviewsCSV(filter);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="reviews-export.csv"');
    res.send(csv);
});
