const User = require('../model/user');
const Department = require('../model/department.model');
const Task = require('../model/task.model');
const Leave = require('../model/leave.model');
const logger = require('../utils/logger');

const getDataHealth = async () => {
    const usersWithoutManager = await User.find({
        role: { $ne: 'super-admin' },
        manager: null,
        isActive: true
    }).select('name email role');

    const deptsWithoutHOD = await Department.find({
        manager: null
    }).select('name');

    return { usersWithoutManager, deptsWithoutHOD };
};

const getTaskMetrics = async () => {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const endOfToday = new Date(today.setHours(23, 59, 59, 999));

    const metrics = await Task.aggregate([
        {
            $facet: {
                "totalAndOverdue": [
                    {
                        $group: {
                            _id: null,
                            totalTasks: { $sum: 1 },
                            overdueTasks: {
                                $sum: {
                                    $cond: [
                                        {
                                            $and: [
                                                { $lt: ["$dueDate", new Date()] },
                                                { $ne: ["$status", "Done"] }
                                            ]
                                        },
                                        1,
                                        0
                                    ]
                                }
                            }
                        }
                    }
                ],
                "completedToday": [
                    {
                        $match: {
                            status: "Done",
                            updatedAt: { $gte: startOfToday, $lte: endOfToday }
                        }
                    },
                    { $count: "count" }
                ],
                "tasksByStatus": [
                    {
                        $group: {
                            _id: "$status",
                            count: { $sum: 1 }
                        }
                    }
                ]
            }
        }
    ]);

    const formattedMetrics = {
        totalTasks: metrics[0].totalAndOverdue[0]?.totalTasks || 0,
        overdueTasks: metrics[0].totalAndOverdue[0]?.overdueTasks || 0,
        completedToday: metrics[0].completedToday[0]?.count || 0,
        tasksByStatus: metrics[0].tasksByStatus.reduce((acc, statusGroup) => {
            acc[statusGroup._id.replace(/\s+/g, '')] = statusGroup.count;
            return acc;
        }, {})
    };

    return formattedMetrics;
};

const getLeaveMetrics = async () => {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const endOfToday = new Date(today.setHours(23, 59, 59, 999));

    const metrics = await Leave.aggregate([
        {
            $facet: {
                "pendingRequests": [
                    { $match: { status: "Pending" } },
                    { $count: "count" }
                ],
                "onLeaveToday": [
                    {
                        $match: {
                            status: "Approved",
                            startDate: { $lte: endOfToday },
                            endDate: { $gte: startOfToday }
                        }
                    },
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
                "leaveByType": [
                    { $match: { status: "Approved" } },
                    {
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
                            _id: "$policyInfo.name",
                            count: { $sum: 1 }
                        }
                    }
                ]
            }
        }
    ]);

    const formattedMetrics = {
        pendingRequests: metrics[0].pendingRequests[0]?.count || 0,
        onLeaveToday: metrics[0].onLeaveToday,
        leaveByType: metrics[0].leaveByType.reduce((acc, policyGroup) => {
            acc[policyGroup._id] = policyGroup.count;
            return acc;
        }, {})
    };

    return formattedMetrics;
};

module.exports = {
    getDataHealth,
    getTaskMetrics,
    getLeaveMetrics,
};
