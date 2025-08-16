const Job = require('../model/job.model');

exports.getAllJobs = async (req, res, next) => {
    try {
        // Employees can see Open jobs. Admins can see all.
        const query = (req.user.role === 'hr' || req.user.role === 'super-admin') ? {} : { status: 'Open' };
        const jobs = await Job.find(query)
            .populate('department', 'name')
            .populate('postedBy', 'name')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: jobs.length, data: jobs });
    } catch (error) { next(error); }
};

exports.createJob = async (req, res, next) => {
    try {
        req.body.postedBy = req.user.id;
        const job = await Job.create(req.body);
        res.status(201).json({ success: true, data: job });
    } catch (error) { next(error); }
};

exports.updateJob = async (req, res, next) => {
    try {
        let job = await Job.findById(req.params.id);
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }
        job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        res.status(200).json({ success: true, data: job });
    } catch (error) { next(error); }
};

exports.deleteJob = async (req, res, next) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }
        await job.remove();
        res.status(200).json({ success: true, message: 'Job deleted' });
    } catch (error) { next(error); }
};