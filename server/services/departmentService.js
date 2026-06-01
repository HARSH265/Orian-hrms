const Department = require('../model/department.model');
const logger = require('../utils/logger');
const { parsePagination, buildPagination } = require('../utils/pagination');

const createDepartment = async (name, description) => {
    const department = await Department.create({ name, description });
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

const updateDepartment = async (id, body) => {
    const department = await Department.findByIdAndUpdate(id, body, {
        new: true,
        runValidators: true,
    });
    return department;
};

const deleteDepartment = async (id) => {
    const department = await Department.findByIdAndDelete(id);
    return department;
};

module.exports = {
    createDepartment,
    getAllDepartments,
    updateDepartment,
    deleteDepartment,
};
