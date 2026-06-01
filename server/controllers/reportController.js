const { getLeaveByDepartment, getExpensesByCategory } = require('../services/reportService');

exports.getLeaveByDepartment = async (req, res, next) => {
    try {
        const data = await getLeaveByDepartment();
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

exports.getExpensesByCategory = async (req, res, next) => {
    try {
        const data = await getExpensesByCategory();
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};
