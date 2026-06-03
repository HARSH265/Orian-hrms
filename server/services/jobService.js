const Job = require('../model/job.model');
const { createAuditLog } = require('./auditLogService');
const logger = require('../utils/logger');
const { parsePagination, buildPagination } = require('../utils/pagination');

const getAllJobs = async (userSystemRole, { page, limit, status } = {}) => {
    const { page: p, limit: l, skip } = parsePagination({ page, limit });
    const query = (userSystemRole === 'hr' || userSystemRole === 'super-admin') ? {} : { status: 'Open' };
    if (status && (userSystemRole === 'hr' || userSystemRole === 'super-admin')) query.status = status;
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

const getJobById = async (id) => {
    const job = await Job.findById(id)
        .populate('department', 'name')
        .populate('postedBy', 'name');
    return job;
};

const createJob = async (data) => {
    const job = await Job.create(data);
    return job;
};

const updateJob = async (id, body) => {
    const job = await Job.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    return job;
};

const deleteJob = async (id, userId, ip) => {
    const job = await Job.findById(id);
    if (!job) return null;
    await Job.findByIdAndDelete(id);
    await createAuditLog({
        actor: userId, action: 'JOB_DELETED',
        target: { id, type: 'Job' },
        details: { title: job.title },
        ipAddress: ip,
    });
    return true;
};

const exportJobsCSV = async (filter = {}) => {
    const jobs = await Job.find(filter)
        .populate('department', 'name')
        .populate('postedBy', 'name')
        .sort({ createdAt: -1 })
        .lean();

    const header = 'Title,Department,Location,Status,Posted By,Created At\n';
    const rows = jobs.map(j =>
        `"${j.title || ''}","${j.department?.name || ''}",${j.location || ''},${j.status},"${j.postedBy?.name || ''}",${new Date(j.createdAt).toISOString().split('T')[0]}`
    ).join('\n');
    return header + rows;
};

module.exports = { getAllJobs, getJobById, createJob, updateJob, deleteJob, exportJobsCSV };
