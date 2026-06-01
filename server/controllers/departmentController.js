const { createDepartment, getAllDepartments, updateDepartment, deleteDepartment } = require('../services/departmentService');

exports.createDepartment = async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const department = await createDepartment(name, description);
        res.status(201).json({ success: true, data: department });
    } catch (error) {
        next(error);
    }
};

exports.getAllDepartments = async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const result = await getAllDepartments({ page, limit });
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

exports.updateDepartment = async (req, res, next) => {
    try {
        const department = await updateDepartment(req.params.id, req.body);
        if (!department) {
            return res.status(404).json({ success: false, message: 'Department not found' });
        }
        res.status(200).json({ success: true, data: department });
    } catch (error) {
        next(error);
    }
};

exports.deleteDepartment = async (req, res, next) => {
    try {
        const department = await deleteDepartment(req.params.id);
        if (!department) {
            return res.status(404).json({ success: false, message: 'Department not found' });
        }
        res.status(200).json({ success: true, message: 'Department deleted' });
    } catch (error) {
        next(error);
    }
};
