const asyncHandler = require('../utils/asyncHandler');
const reviewScheduleService = require('../services/reviewScheduleService');

exports.create = asyncHandler(async (req, res) => {
    const result = await reviewScheduleService.createSchedule(req.body, req.user._id);
    res.status(201).json({ success: true, data: result });
});

exports.getAll = asyncHandler(async (req, res) => {
    const result = await reviewScheduleService.getAllSchedules();
    res.json({ success: true, data: result });
});

exports.update = asyncHandler(async (req, res) => {
    const result = await reviewScheduleService.updateSchedule(req.params.id, req.body);
    res.json({ success: true, data: result });
});

exports.remove = asyncHandler(async (req, res) => {
    const result = await reviewScheduleService.deleteSchedule(req.params.id);
    res.json({ success: true, ...result });
});
