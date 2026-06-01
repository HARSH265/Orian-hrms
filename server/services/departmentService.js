const Department = require('../model/department.model');
const logger = require('../utils/logger');

const createDepartment = async (name, description) => {
    const department = await Department.create({ name, description });
    return department;
};

const getAllDepartments = async () => {
    const departments = await Department.find({})
        .populate('manager', 'name')
        .sort({ name: 1 });
    return departments;
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
