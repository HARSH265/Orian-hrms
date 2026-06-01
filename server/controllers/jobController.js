const { getAllJobs, createJob, updateJob, deleteJob } = require('../services/jobService');

exports.getAllJobs = async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const result = await getAllJobs(req.user.role, { page, limit });
        res.status(200).json({ success: true, ...result });
    } catch (error) { next(error); }
};

exports.createJob = async (req, res, next) => {
    try {
        req.body.postedBy = req.user.id;
        const job = await createJob(req.body);
        res.status(201).json({ success: true, data: job });
    } catch (error) { next(error); }
};

exports.updateJob = async (req, res, next) => {
    try {
        const job = await updateJob(req.params.id, req.body);
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }
        res.status(200).json({ success: true, data: job });
    } catch (error) { next(error); }
};

exports.deleteJob = async (req, res, next) => {
    try {
        const result = await deleteJob(req.params.id);
        if (result === null) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }
        res.status(200).json({ success: true, message: 'Job deleted' });
    } catch (error) { next(error); }
};
