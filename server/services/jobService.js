const Job = require('../model/job.model');
const logger = require('../utils/logger');
const { parsePagination, buildPagination } = require('../utils/pagination');

const getAllJobs = async (userRole, { page, limit } = {}) => {
    const { page: p, limit: l, skip } = parsePagination({ page, limit });
    const query = (userRole === 'hr' || userRole === 'super-admin') ? {} : { status: 'Open' };
    const [jobs, total] = await Promise.all([
        Job.find(query)
            .populate('department', 'name')
            .populate('postedBy', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(l),
        Job.countDocuments(query)
    ]);
    return { data: jobs, pagination: buildPagination(total, p, l) };
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
