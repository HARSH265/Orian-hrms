// In: server/controllers/dashboardController.js

const User = require('../model/user');
const Department = require('../model/department.model');
const Task = require('../model/task.model'); 
const Leave = require('../model/leave.model')
const asyncHandler = require('../utils/asyncHandler');
const mongoose = require('mongoose'); 

// @desc    Get data for the admin data health dashboard
// @route   GET /api/dashboard/data-health
// @access  Private/Admin
exports.getDataHealth = asyncHandler(async (req, res, next) => {
    try {
        const usersWithoutManager = await User.find({
            role: { $ne: 'super-admin' },
            manager: null,
            isActive: true
        }).select('name email role');

        const deptsWithoutHOD = await Department.find({
            manager: null
        }).select('name');
        
        res.status(200).json({
            success: true,
            data: {
                usersWithoutManager,
                deptsWithoutHOD,
            }
        });
    } catch (error) {
        next(error);
    }
};


// @desc    Get key performance metrics for tasks
// @route   GET /api/dashboard/task-metrics
// @access  Private (Manager, HR, Admin)
exports.getTaskMetrics = asyncHandler(async (req, res, next) => {
    try {
        const today = new Date();
        const startOfToday = new Date(today.setHours(0, 0, 0, 0));
        const endOfToday = new Date(today.setHours(23, 59, 59, 999));
        
        // --- The Aggregation Pipeline ---
        // This performs all calculations in a single, efficient database query.
        const metrics = await Task.aggregate([
            {
                // The $facet stage allows us to run multiple aggregation pipelines
                // on the same set of input documents, completely independently.
                $facet: {
                    // Pipeline 1: Calculate total and overdue tasks
                    "totalAndOverdue": [
                        {
                            $group: {
                                _id: null, // Group all tasks into a single bucket
                                totalTasks: { $sum: 1 }, // Count every task
                                overdueTasks: {
                                    $sum: { // Sum up the ones that match the condition
                                        $cond: [
                                            { // Condition:
                                                $and: [
                                                    { $lt: ["$dueDate", new Date()] }, // Due date is in the past
                                                    { $ne: ["$status", "Done"] }      // And status is NOT 'Done'
                                                ]
                                            },
                                            1, // If true, count it as 1
                                            0  // If false, count it as 0
                                        ]
                                    }
                                }
                            }
                        }
                    ],
                    // Pipeline 2: Count tasks completed today
                    "completedToday": [
                        {
                            $match: { // Filter for tasks that are 'Done'
                                status: "Done",
                                // And were updated within today's timeframe
                                updatedAt: { $gte: startOfToday, $lte: endOfToday }
                            }
                        },
                        { $count: "count" } // Count the matching documents
                    ],
                    // Pipeline 3: Group tasks by their status for a pie chart
                    "tasksByStatus": [
                        {
                            $group: {
                                _id: "$status", // Group by the value in the 'status' field
                                count: { $sum: 1 } // Count how many tasks are in each group
                            }
                        }
                    ]
                }
            }
        ]);

        // --- Format the Raw Database Output ---
        // The result of a $facet is an array containing an object. We need to extract
        // and format the data to be clean and easy for the frontend to use.
        const formattedMetrics = {
            totalTasks: metrics[0].totalAndOverdue[0]?.totalTasks || 0,
            overdueTasks: metrics[0].totalAndOverdue[0]?.overdueTasks || 0,
            completedToday: metrics[0].completedToday[0]?.count || 0,
            // Convert the tasksByStatus array into a more useful object
            tasksByStatus: metrics[0].tasksByStatus.reduce((acc, statusGroup) => {
                acc[statusGroup._id.replace(/\s+/g, '')] = statusGroup.count; // e.g., { ToDo: 5, InProgress: 3 }
                return acc;
            }, {})
        });

        res.status(200).json({ success: true, data: formattedMetrics });

    } catch (error) {
        next(error);
    }
};

// @desc    Get key performance metrics for leave requests
// @route   GET /api/dashboard/leave-metrics
// @access  Private (Manager, HR, Admin)
exports.getLeaveMetrics = asyncHandler(async (req, res, next) => {
    try {
        const today = new Date();
        const startOfToday = new Date(today.setHours(0, 0, 0, 0));
        const endOfToday = new Date(today.setHours(23, 59, 59, 999));

        // --- The Aggregation Pipeline for Leave Data ---
        const metrics = await Leave.aggregate([
            {
                $facet: {
                    // Pipeline 1: Count currently pending requests
                    "pendingRequests": [
                        { $match: { status: "Pending" } },
                        { $count: "count" }
                    ],
                    // Pipeline 2: Find employees on approved leave today
                    "onLeaveToday": [
                        {
                            $match: {
                                status: "Approved",
                                startDate: { $lte: endOfToday }, // Starts on or before today
                                endDate: { $gte: startOfToday }   // Ends on or after today
                            }
                        },
                        // We only need the employee's name for the widget
                        {
                            $lookup: {
                                from: "users",
                                localField: "employee",
                                foreignField: "_id",
                                as: "employeeInfo"
                            }
                        },
                        { $unwind: "$employeeInfo" },
                        {
                            $project: {
                                _id: 0,
                                employeeName: "$employeeInfo.name",
                                endDate: 1
                            }
                        }
                    ],
                    // Pipeline 3: Group all approved leave by type (Policy)
                    "leaveByType": [
                        { $match: { status: "Approved" } },
                        {
                            // Join with the leavepolicies collection to get the policy name
                            $lookup: {
                                from: "leavepolicies",
                                localField: "leavePolicy",
                                foreignField: "_id",
                                as: "policyInfo"
                            }
                        },
                        { $unwind: "$policyInfo" },
                        {
                            $group: {
                                _id: "$policyInfo.name", // Group by the policy name (e.g., "Sick Leave")
                                count: { $sum: 1 }      // Count how many leaves of each type
                            }
                        }
                    ]
                }
            }
        ]);

        // --- Format the Raw Database Output ---
        const formattedMetrics = {
            pendingRequests: metrics[0].pendingRequests[0]?.count || 0,
            onLeaveToday: metrics[0].onLeaveToday,
            // Convert the leaveByType array into a more useful object
            leaveByType: metrics[0].leaveByType.reduce((acc, policyGroup) => {
                acc[policyGroup._id] = policyGroup.count; // e.g., { "Sick Leave": 10, "Vacation": 25 }
                return acc;
            }, {})
        });

        res.status(200).json({ success: true, data: formattedMetrics });

    } catch (error) {
        next(error);
    }
};
