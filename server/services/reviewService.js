const Review = require('../model/review.model');
const User = require('../model/user');
const Task = require('../model/task.model');
const { createAuditLog } = require('./auditLogService');
const { parsePagination, buildPagination } = require('../utils/pagination');
const { getDescendantIds } = require('../utils/teamTree');

const err = (msg, s) => { const e = new Error(msg); e.status = s; return e; };

const initiateReviewCycle = async (cycleName, employeeIds, templateId, userId, ip) => {
    const employees = await User.find({ _id: { $in: employeeIds }, isActive: true });
    const existing = await Review.find({ employee: { $in: employeeIds }, cycleName });
    if (existing.length > 0) throw err(`Cycle "${cycleName}" already exists for some employees.`, 400);

    const reviewsData = [];
    const skipped = [];
    for (const emp of employees) {
        if (emp.manager) {
            const r = { employee: emp._id, manager: emp.manager, cycleName };
            if (templateId) r.template = templateId;
            reviewsData.push(r);
        } else {
            skipped.push(emp.name);
        }
    }

    const created = await Review.insertMany(reviewsData);

    if (templateId) {
        const Template = require('../model/reviewTemplate.model');
        const template = await Template.findById(templateId);
        if (template && template.criteria) {
            for (const review of created) {
                review.criteria = template.criteria.map(c => ({ name: c.name, weight: c.weight }));
                await review.save();
            }
        }
    }

    await createAuditLog({
        actor: userId, action: 'REVIEW_CYCLE_INITIATED',
        target: { id: cycleName, type: 'ReviewCycle' },
        details: { cycleName, count: created.length, skipped: skipped.length },
        ipAddress: ip,
    });

    const populated = await Review.find({ _id: { $in: created.map(r => r._id) } })
        .populate('employee', 'name')
        .populate('manager', 'name');
    return { reviews: populated, skipped };
};

const getReviewById = async (reviewId) => {
    return Review.findById(reviewId)
        .populate('employee', 'name email profilePictureUrl manager')
        .populate('manager', 'name email profilePictureUrl')
        .populate('approvedBy', 'name')
        .populate('template', 'name');
};

const getMyReviews = async (userId, { page, limit } = {}) => {
    const { page: p, limit: l, skip } = parsePagination({ page, limit });
    const [reviews, total] = await Promise.all([
        Review.find({ employee: userId })
            .populate('manager', 'name')
            .sort({ createdAt: -1 })
            .skip(skip).limit(l).lean(),
        Review.countDocuments({ employee: userId }),
    ]);
    return { data: reviews, pagination: buildPagination(total, p, l) };
};

const getTeamReviews = async (userId, { page, limit } = {}) => {
    const { page: p, limit: l, skip } = parsePagination({ page, limit });
    const teamMemberIds = await getDescendantIds(userId);
    const employeeIds = [...teamMemberIds, userId];
    const [reviews, total] = await Promise.all([
        Review.find({ employee: { $in: employeeIds } })
            .populate('employee', 'name')
            .sort({ createdAt: -1 })
            .skip(skip).limit(l).lean(),
        Review.countDocuments({ employee: { $in: employeeIds } }),
    ]);
    return { data: reviews, pagination: buildPagination(total, p, l) };
};

const submitSelfAssessment = async (reviewId, userId, selfAssessment) => {
    const review = await Review.findById(reviewId);
    if (!review) throw err('Review not found.', 404);
    if (review.employee.toString() !== userId.toString()) throw err('Not authorized.', 403);
    if (review.status !== 'Pending Self-Assessment') throw err('Self-assessment already submitted.', 400);
    if (!selfAssessment.strengths || !selfAssessment.areasForImprovement || !selfAssessment.feedback) {
        throw err('All fields are required: strengths, areasForImprovement, feedback.', 400);
    }

    review.selfAssessment = selfAssessment;
    review.employeeSubmitDate = new Date();
    review.status = 'Pending Manager Review';
    await review.save();
    return review;
};

const submitManagerReview = async (reviewId, userId, managerReview) => {
    const review = await Review.findById(reviewId);
    if (!review) throw err('Review not found.', 404);
    if (review.manager.toString() !== userId.toString()) throw err('Not authorized.', 403);
    if (review.status !== 'Pending Manager Review') throw err('Cannot submit at this stage.', 400);
    if (!managerReview.overallPerformance || !managerReview.goalsForNextCycle || !managerReview.managerFeedback) {
        throw err('All fields are required: overallPerformance, goalsForNextCycle, managerFeedback.', 400);
    }

    review.managerReview = managerReview;
    if (managerReview.rating) review.rating = managerReview.rating;

    // Weighted score calculation (Phase 10)
    if (managerReview.criteria && Array.isArray(managerReview.criteria)) {
        review.criteria = managerReview.criteria;
        const totalWeight = review.criteria.reduce((s, c) => s + (c.weight || 0), 0);
        if (totalWeight > 0) {
            review.weightedScore = Math.round(
                review.criteria.reduce((s, c) => s + ((c.score || 0) * (c.weight || 0)), 0) / totalWeight * 10
            ) / 10;
        }
    }

    review.managerSubmitDate = new Date();
    review.status = 'Pending Approval';
    await review.save();
    return review;
};

const approveReview = async (reviewId, userId, ip) => {
    const review = await Review.findById(reviewId);
    if (!review) throw err('Review not found.', 404);
    if (review.status !== 'Pending Approval') throw err('Review is not pending approval.', 400);

    review.approvedBy = userId;
    review.approvedAt = new Date();
    review.status = 'Complete';
    await review.save();

    await createAuditLog({
        actor: userId, action: 'REVIEW_APPROVED',
        target: { id: review._id, type: 'Review' },
        details: { cycleName: review.cycleName },
        ipAddress: ip,
    });
    return review;
};

const archiveReview = async (reviewId, userId, ip) => {
    const review = await Review.findById(reviewId);
    if (!review) throw err('Review not found.', 404);
    if (review.status === 'Archived') throw err('Review is already archived.', 400);
    review.status = 'Archived';
    await review.save();
    await createAuditLog({
        actor: userId, action: 'REVIEW_ARCHIVED',
        target: { id: review._id, type: 'Review' },
        details: { cycleName: review.cycleName },
        ipAddress: ip,
    });
    return review;
};

// Phase 2: Goals
const addGoal = async (reviewId, userId, goal) => {
    const review = await Review.findById(reviewId);
    if (!review) throw err('Review not found.', 404);
    if (review.employee.toString() !== userId.toString() && review.manager.toString() !== userId.toString()) {
        throw err('Not authorized.', 403);
    }
    review.goals.push(goal);
    await review.save();
    return review.goals;
};

const updateGoal = async (reviewId, goalId, updates) => {
    const review = await Review.findById(reviewId);
    if (!review) throw err('Review not found.', 404);
    const goal = review.goals.id(goalId);
    if (!goal) throw err('Goal not found.', 404);
    Object.assign(goal, updates);
    await review.save();

    // Phase 7: Create task when goal is set
    if (goal.taskId === null && goal.goal && review.employee) {
        const task = await Task.create({
            title: `[Review Goal] ${goal.goal}`,
            assignees: [review.employee],
            creator: review.manager,
            dueDate: goal.targetDate,
            description: `Goal from ${review.cycleName} performance review.`,
        });
        goal.taskId = task._id;
        await review.save();
    }
    return review.goals;
};

// Phase 6: Review History Dashboard
const getReviewHistory = async (employeeId) => {
    const reviews = await Review.find({ employee: employeeId, status: { $ne: 'Archived' } })
        .populate('manager', 'name')
        .select('cycleName rating weightedScore status createdAt manager')
        .sort({ createdAt: -1 })
        .lean();

    const ratings = reviews.filter(r => r.rating).map(r => r.rating);
    const avgRating = ratings.length > 0 ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : 0;
    return { reviews, totalReviews: reviews.length, averageRating: avgRating, ratingTrend: ratings };
};

// Phase 8: CSV Export
const exportReviewsCSV = async (filter = {}) => {
    const reviews = await Review.find(filter)
        .populate('employee', 'name email')
        .populate('manager', 'name')
        .populate('approvedBy', 'name')
        .sort({ createdAt: -1 })
        .lean();

    const header = 'Employee,Manager,Cycle Name,Status,Rating,Weighted Score,Self-Assessment Submitted,Manager Submitted,Approved By,Created At\n';
    const rows = reviews.map(r =>
        `"${r.employee?.name || ''}","${r.manager?.name || ''}","${r.cycleName}",${r.status},${r.rating || ''},${r.weightedScore || ''},${r.employeeSubmitDate ? new Date(r.employeeSubmitDate).toISOString().split('T')[0] : ''},${r.managerSubmitDate ? new Date(r.managerSubmitDate).toISOString().split('T')[0] : ''},"${r.approvedBy?.name || ''}",${new Date(r.createdAt).toISOString().split('T')[0]}`
    ).join('\n');
    return header + rows;
};

module.exports = {
    initiateReviewCycle,
    getReviewById,
    getMyReviews,
    getTeamReviews,
    submitSelfAssessment,
    submitManagerReview,
    approveReview,
    archiveReview,
    addGoal,
    updateGoal,
    getReviewHistory,
    exportReviewsCSV,
};
