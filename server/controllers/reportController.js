const Leave = require('../model/leave.model');
const Expense = require('../model/expense.model');
const Task = require('../model/task.model');
const mongoose = require('mongoose');

// @desc    Get Leave data aggregated by department
// @route   GET /api/reports/leave-by-department
exports.getLeaveByDepartment = async (req, res, next) => {
    try {
        const data = await Leave.aggregate([
            // Stage 1: Only look at 'Approved' leave requests
            { $match: { status: 'Approved' } },
            // Stage 2: Calculate the duration of each leave request
            {
                $addFields: {
                    duration: {
                        $divide: [
                            { $subtract: ["$endDate", "$startDate"] },
                            1000 * 60 * 60 * 24 // Convert milliseconds to days
                        ]
                    }
                }
            },
            // Stage 3: Look up the employee's department
            {
                $lookup: {
                    from: 'users', // The collection to join with
                    localField: 'employee',
                    foreignField: '_id',
                    as: 'employeeInfo'
                }
            },
            { $unwind: '$employeeInfo' }, // Deconstruct the employeeInfo array
            // Stage 4: Look up the department name from the department ID
            {
                $lookup: {
                    from: 'departments',
                    localField: 'employeeInfo.department',
                    foreignField: '_id',
                    as: 'departmentInfo'
                }
            },
            { $unwind: '$departmentInfo' },
            // Stage 5: Group by department and sum the durations
            {
                $group: {
                    _id: '$departmentInfo.name', // Group by the department name
                    totalLeaveDays: { $sum: '$duration' }
                }
            },
            // Stage 6: Format the output for the chart
            {
                $project: {
                    _id: 0, // Exclude the default _id field
                    department: '$_id',
                    days: '$totalLeaveDays'
                }
            }
        ]);
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

// @desc    Get Expense data aggregated by category
// @route   GET /api/reports/expenses-by-category
exports.getExpensesByCategory = async (req, res, next) => {
    try {
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
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};