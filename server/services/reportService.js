const Leave = require('../model/leave.model');
const Expense = require('../model/expense.model');
const logger = require('../utils/logger');

const getLeaveByDepartment = async () => {
    const data = await Leave.aggregate([
        { $match: { status: 'Approved' } },
        {
            $addFields: {
                duration: {
                    $divide: [
                        { $subtract: ["$endDate", "$startDate"] },
                        1000 * 60 * 60 * 24
                    ]
                }
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'employee',
                foreignField: '_id',
                as: 'employeeInfo'
            }
        },
        { $unwind: '$employeeInfo' },
        {
            $lookup: {
                from: 'departments',
                localField: 'employeeInfo.department',
                foreignField: '_id',
                as: 'departmentInfo'
            }
        },
        { $unwind: '$departmentInfo' },
        {
            $group: {
                _id: '$departmentInfo.name',
                totalLeaveDays: { $sum: '$duration' }
            }
        },
        {
            $project: {
                _id: 0,
                department: '$_id',
                days: '$totalLeaveDays'
            }
        }
    ]);
    return data;
};

const getExpensesByCategory = async () => {
    const data = await Expense.aggregate([
        { $match: { status: 'Approved' } },
        {
            $group: {
                _id: '$category',
                totalAmount: { $sum: '$amount' }
            }
        },
        {
            $project: {
                _id: 0,
                category: '$_id',
                amount: '$totalAmount'
            }
        }
    ]);
    return data;
};

module.exports = { getLeaveByDepartment, getExpensesByCategory };
