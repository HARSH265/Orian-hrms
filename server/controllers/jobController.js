const asyncHandler = require('../utils/asyncHandler');
const jobService = require('../services/jobService');

exports.getAllJobs = asyncHandler(async (req, res) => {
    const { page, limit, status } = req.query;
    const result = await jobService.getAllJobs(req.user.systemRole, { page, limit, status });
    res.json({ success: true, ...result });
});

exports.getJobById = asyncHandler(async (req, res) => {
    const job = await jobService.getJobById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
    res.json({ success: true, data: job });
});

exports.createJob = asyncHandler(async (req, res) => {
    req.body.postedBy = req.user.id;
    const job = await jobService.createJob(req.body);
    res.status(201).json({ success: true, data: job });
});

exports.updateJob = asyncHandler(async (req, res) => {
    const job = await jobService.updateJob(req.params.id, req.body);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
    res.json({ success: true, data: job });
});

exports.deleteJob = asyncHandler(async (req, res) => {
    const result = await jobService.deleteJob(req.params.id, req.user.id, req.ip);
    if (!result) return res.status(404).json({ success: false, message: 'Job not found.' });
    res.json({ success: true, message: 'Job deleted.' });
});

exports.exportJobs = asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const csv = await jobService.exportJobsCSV(filter);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="jobs-export.csv"');
    res.send(csv);
});
