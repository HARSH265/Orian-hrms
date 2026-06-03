const Department = require('../model/department.model');
const { createAuditLog } = require('./auditLogService');
const { parsePagination, buildPagination } = require('../utils/pagination');

const createDepartment = async (data, userId, ip) => {
    const existing = await Department.findOne({ name: data.name });
    if (existing) {
        const err = new Error('A department with this name already exists.');
        err.status = 409;
        throw err;
    }
    const department = await Department.create(data);
    await createAuditLog({
        actor: userId, action: 'DEPARTMENT_CREATED',
        target: { id: department._id, type: 'Department' },
        details: { name: department.name },
        ipAddress: ip,
    });
    return department;
};

const getAllDepartments = async ({ page, limit } = {}) => {
    const { page: p, limit: l, skip } = parsePagination({ page, limit });
    const [departments, total] = await Promise.all([
        Department.find({})
            .populate('manager', 'name')
            .sort({ name: 1 })
            .skip(skip)
            .limit(l),
        Department.countDocuments()
    ]);
    return { data: departments, pagination: buildPagination(total, p, l) };
};

const getDepartmentById = async (id) => {
    const department = await Department.findById(id).populate('manager', 'name');
    if (!department) {
        const err = new Error('Department not found.');
        err.status = 404;
        throw err;
    }
    return department;
};

const updateDepartment = async (id, body, userId, ip) => {
    const department = await Department.findByIdAndUpdate(id, body, {
        new: true, runValidators: true,
    });
    if (!department) {
        const err = new Error('Department not found.');
        err.status = 404;
        throw err;
    }
    await createAuditLog({
        actor: userId, action: 'DEPARTMENT_UPDATED',
        target: { id, type: 'Department' },
        details: { updates: body },
        ipAddress: ip,
    });
    return department;
};

const deleteDepartment = async (id, userId, ip) => {
    const department = await Department.findByIdAndDelete(id);
    if (!department) {
        const err = new Error('Department not found.');
        err.status = 404;
        throw err;
    }
    await createAuditLog({
        actor: userId, action: 'DEPARTMENT_DELETED',
        target: { id, type: 'Department' },
        details: { name: department.name },
        ipAddress: ip,
    });
    return department;
};

const exportDepartmentsCSV = async () => {
    const departments = await Department.find({})
        .populate('manager', 'name')
        .sort({ name: 1 })
        .lean();

    const header = 'Name,Description,Manager,Created At\n';
    const rows = departments.map(d =>
        `"${d.name || ''}","${(d.description || '').replace(/"/g, '""')}","${d.manager?.name || ''}",${new Date(d.createdAt).toISOString().split('T')[0]}`
    ).join('\n');
    return header + rows;
};

module.exports = {
    createDepartment, getAllDepartments, getDepartmentById,
    updateDepartment, deleteDepartment, exportDepartmentsCSV,
};
