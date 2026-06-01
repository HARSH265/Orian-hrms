const Job = require('../model/job.model');
const logger = require('../utils/logger');

const getAllJobs = async (userRole) => {
    const query = (userRole === 'hr' || userRole === 'super-admin') ? {} : { status: 'Open' };
    const jobs = await Job.find(query)
        .populate('department', 'name')
        .populate('postedBy', 'name')
        .sort({ createdAt: -1 });
    return jobs;
};

const createJob = async (data) => {
    const job = await Job.create(data);
    return job;
};

const updateJob = async (id, body) => {
    let job = await Job.findById(id);
    if (!job) {
        return null;
    }
    job = await Job.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    return job;
};

const deleteJob = async (id) => {
    const job = await Job.findById(id);
    if (!job) {
        return null;
    }
    await job.remove();
    return true;
};

module.exports = {
    getAllJobs,
    createJob,
    updateJob,
    deleteJob,
};
