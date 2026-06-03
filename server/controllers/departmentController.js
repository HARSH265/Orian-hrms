const asyncHandler = require('../utils/asyncHandler');
const departmentService = require('../services/departmentService');

exports.createDepartment = asyncHandler(async (req, res, next) => {
    try {
        const department = await departmentService.createDepartment(req.body, req.user.id, req.ip);
        res.status(201).json({ success: true, data: department });
    } catch (error) {
        if (error.status) return res.status(error.status).json({ success: false, message: error.message });
        next(error);
    }
});

exports.getAllDepartments = asyncHandler(async (req, res) => {
    const { page, limit } = req.query;
    const result = await departmentService.getAllDepartments({ page, limit });
    res.json({ success: true, ...result });
});

exports.getDepartmentById = asyncHandler(async (req, res, next) => {
    try {
        const department = await departmentService.getDepartmentById(req.params.id);
        res.json({ success: true, data: department });
    } catch (error) {
        if (error.status) return res.status(error.status).json({ success: false, message: error.message });
        next(error);
    }
});

exports.updateDepartment = asyncHandler(async (req, res, next) => {
    try {
        const department = await departmentService.updateDepartment(req.params.id, req.body, req.user.id, req.ip);
        res.json({ success: true, data: department });
    } catch (error) {
        if (error.status) return res.status(error.status).json({ success: false, message: error.message });
        next(error);
    }
});

exports.deleteDepartment = asyncHandler(async (req, res, next) => {
    try {
        await departmentService.deleteDepartment(req.params.id, req.user.id, req.ip);
        res.json({ success: true, message: 'Department deleted.' });
    } catch (error) {
        if (error.status) return res.status(error.status).json({ success: false, message: error.message });
        next(error);
    }
});

exports.exportDepartments = asyncHandler(async (req, res) => {
    const csv = await departmentService.exportDepartmentsCSV();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="departments-export.csv"');
    res.send(csv);
});
