const User = require('../model/user');
const Leave = require('../model/leave.model'); 
const LeaveBalance = require('../model/leaveBalance.model');
const { createNotification } = require('../services/notificationService');
const asyncHandler = require('../utils/asyncHandler');
/**
 * @desc    Get all leave requests for the manager's team
 * @route   GET /api/manager/team-leave-requests
 * @access  Private (Manager, HR, Super-Admin)
 */
exports.getTeamLeaveRequests = asyncHandler(async (req, res, next) => {
    try {
        // 1. Find all users who report to the current manager
        const teamMembers = await User.find({ manager: req.user.id }).select('_id');

        // 2. Extract just the IDs of the team members into an array
        const teamMemberIds = teamMembers.map(member => member._id);

        // 3. Find all leave requests submitted by those team members
        // We use .populate() to also get the employee's name and email for the frontend
        const leaveRequests = await Leave.find({ employee: { $in: teamMemberIds } })
            .populate('employee', 'name email') // 'employee' is the field, 'name email' are the fields to fetch from the User model
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: leaveRequests.length, data: leaveRequests });
    } catch (error) {
        next(error);
    }
    });


// exports.getTeamLeaveCalendar = asyncHandler(async (req, res, next) => {
//     try {
//         const { startDate, endDate } = req.query;
//         if (!startDate || !endDate) {
//             return res.status(400).json({ success: false, message: 'Start and end dates are required.' });
//         }
        
//         const teamMemberIds = await User.find({ manager: req.user.id }).select('_id');
//         const ids = teamMemberIds.map(u => u._id);

//         const teamLeaves = await Leave.find({
//             employee: { $in: ids },
//             status: 'Approved',
//             startDate: { $lte: new Date(endDate) },
//             endDate: { $gte: new Date(startDate) }
//         }).populate('employee', 'name');

//         res.status(200).json({ success: true, data: teamLeaves });
//     } catch (error) {
//         next(error);
//     }
//     });

/**
 * @desc    Update the status of a leave request (Approve/Deny)
 * @route   PUT /api/manager/leave-requests/:id
 * @access  Private (Manager, HR, Super-Admin)
 */
// exports.updateLeaveRequestStatus = asyncHandler(async (req, res, next) => {
//     try {
//         const { status, managerNotes } = req.body; // Get new status from request body

//         if (!['Approved', 'Denied'].includes(status)) {
//             return res.status(400).json({ success: false, message: 'Invalid status provided.' });
//         }

//         const leaveRequest = await Leave.findById(req.params.id);

//         if (!leaveRequest) {
//             return res.status(404).json({ success: false, message: 'Leave request not found.' });
//         }

//         // --- CORRECTED: V2 Denial Reason Check ---
//         if (status === 'Denied' && !managerNotes) {
//             return res.status(400).json({ success: false, message: 'A reason (manager notes) is required to deny a request.' });
//         }

//         // --- CRITICAL SECURITY CHECK (This logic is perfect, no change needed) ---
//         const employee = await User.findById(leaveRequest.employee);
//         const loggedInUser = req.user;

//         const isDirectManager = employee.manager && (employee.manager.toString() === loggedInUser.id.toString());
//         const isAdmin = loggedInUser.role === 'hr' || loggedInUser.role === 'super-admin';

//         if (!isDirectManager && !isAdmin) {
//             return res.status(403).json({ success: false, message: 'You are not authorized to update this leave request.' });
//         }
        
//         // --- V2 ENHANCED: BALANCE UPDATE LOGIC ---
//         const start = new Date(leaveRequest.startDate);
//         const end = new Date(leaveRequest.endDate);
//         const daysToUpdate = (end - start) / (1000 * 60 * 60 * 24) + 1;
//         const previousStatus = leaveRequest.status;

//         // CASE 1: Request is being newly Approved
//         if (status === 'Approved' && previousStatus !== 'Approved') {
//             await LeaveBalance.updateOne(
//                 {
//                     employee: leaveRequest.employee,
//                     leavePolicy: leaveRequest.leavePolicy,
//                     year: start.getFullYear()
//                 },
//                 { $inc: { daysTaken: daysToUpdate } }
//             );
//         }
        
//         // CASE 2: Request was previously Approved and is now being Denied (Refund days)
//         if (status === 'Denied' && previousStatus === 'Approved') {
//             await LeaveBalance.updateOne(
//                 {
//                     employee: leaveRequest.employee,
//                     leavePolicy: leaveRequest.leavePolicy,
//                     year: start.getFullYear()
//                 },
//                 { $inc: { daysTaken: -daysToUpdate } } // Use negative value to refund
//             );
//         }
//         // --- END BALANCE UPDATE LOGIC ---

//         // --- V2 UPDATE: Set all new fields ---
//         leaveRequest.status = status;
//         leaveRequest.approvedBy = loggedInUser.id; // Store who took the action
//         leaveRequest.managerNotes = managerNotes || ''; // Save notes if provided, otherwise clear them

//         await leaveRequest.save();

//         // --- NOTIFICATION LOGIC (This is perfect, no change needed) ---
//         await createNotification({
//             recipient: employee._id,
//             sender: loggedInUser.id,
//             message: `Your leave request from ${start.toLocaleDateString()} to ${end.toLocaleDateString()} has been ${status.toLowerCase()}.`,
//             link: '/leave',
//             type: 'Leave',
//         },req);

//         res.status(200).json({ success: true, data: leaveRequest });

//     } catch (error) {
//         next(error);
//     }
//     });

// In server/controllers/managerController.js

exports.updateLeaveRequestStatus = asyncHandler(async (req, res, next) => {
    try {
        const { status, managerNotes } = req.body;

        if (!['Approved', 'Denied'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status provided.' });
        }

        const leaveRequest = await Leave.findById(req.params.id);

        if (!leaveRequest) {
            return res.status(404).json({ success: false, message: 'Leave request not found.' });
        }

        if (status === 'Denied' && (!managerNotes || managerNotes.trim() === '')) {
            return res.status(400).json({ success: false, message: 'A reason (manager notes) is required to deny a request.' });
        }

        const employee = await User.findById(leaveRequest.employee);
        const loggedInUser = req.user;

        const isDirectManager = employee.manager && (employee.manager.toString() === loggedInUser.id.toString());
        const isAdmin = ['hr', 'super-admin'].includes(loggedInUser.role);

        if (!isDirectManager && !isAdmin) {
            return res.status(403).json({ success: false, message: 'You are not authorized to update this leave request.' });
        }
        
        const start = new Date(leaveRequest.startDate);
        const end = new Date(leaveRequest.endDate); // Ensure 'end' is defined
        const daysToUpdate = (end - start) / (1000 * 60 * 60 * 24) + 1;
        const previousStatus = leaveRequest.status;

        if (status === 'Approved' && previousStatus !== 'Approved') {
            await LeaveBalance.updateOne(
                { employee: leaveRequest.employee, leavePolicy: leaveRequest.leavePolicy, year: start.getFullYear() },
                { $inc: { daysTaken: daysToUpdate } }
            );
        }
        
        if (status === 'Denied' && previousStatus === 'Approved') {
            await LeaveBalance.updateOne(
                { employee: leaveRequest.employee, leavePolicy: leaveRequest.leavePolicy, year: start.getFullYear() },
                { $inc: { daysTaken: -daysToUpdate } }
            );
        }

        leaveRequest.status = status;
        leaveRequest.approvedBy = loggedInUser.id;
        leaveRequest.managerNotes = managerNotes || '';

        await leaveRequest.save();

        await createNotification({ 
            recipient: employee._id, 
            sender: loggedInUser.id, 
            message: `Your leave request from ${start.toLocaleDateString()} to ${end.toLocaleDateString()} has been ${status.toLowerCase()}.`, 
            link: '/leave', 
            type: 'Leave' 
        }, req);

        res.status(200).json({ success: true, data: leaveRequest });

    } catch (error) {
        console.error("CRASH in updateLeaveRequestStatus:", error);
        next(error);
    }
    });

/**
 * @desc    Get the logged-in manager's direct reports
 * @route   GET /api/manager/my-team
 * @access  Private (Manager+)
 */
exports.getMyTeam = asyncHandler(async (req, res, next) => {
    try {
        const loggedInUser = req.user;
        let query = {    });

        const roleHierarchy = ['employee', 'manager', 'hr', 'super-admin'];
        const userRoleIndex = roleHierarchy.indexOf(loggedInUser.role);

        if (loggedInUser.role === 'super-admin' || loggedInUser.role === 'hr') {
            const assignableRoles = roleHierarchy.slice(0, userRoleIndex);
            query = { role: { $in: assignableRoles }     });
        } 
        else if (loggedInUser.role === 'manager') {
            // Managers can only assign to their direct reports and HR.
            // We handle this on the client, but the backend query will be simpler.
            const directReports = await User.find({ manager: loggedInUser.id }).select('name email');
            const hrUsers = await User.find({ role: 'hr' }).select('name email');
            const finalUserList = [...directReports, ...hrUsers];
            return res.status(200).json({ success: true, count: finalUserList.length, data: finalUserList });
        }
        else {
            return res.status(200).json({ success: true, count: 0, data: [] });
        }

        // --- THIS IS THE KEY FIX ---
        // Ensure the logged-in user themselves is not in the list
        const assignableUsers = await User.find({ ...query, _id: { $ne: loggedInUser.id } }).select('name email');
        
        res.status(200).json({ success: true, count: assignableUsers.length, data: assignableUsers });

    } catch (error) {
        next(error);
    }
    });

exports.getLeaveRequestDetails = asyncHandler(async (req, res, next) => {
    try {
        const leaveId = req.params.id;
        const loggedInUser = req.user;

        // 1. Get the primary leave request and populate all necessary details
        const primaryRequest = await Leave.findById(leaveId)
            .populate('employee', 'name department')
            .populate({
                path: 'employee',
                populate: { path: 'department', select: 'name' }
            });

        if (!primaryRequest) {
            return res.status(404).json({ success: false, message: 'Leave request not found.' });
        }

        // Security check (same as before)
        const isManagerOrAdmin = (primaryRequest.employee.manager?.toString() === loggedInUser.id) || ['hr', 'super-admin'].includes(loggedInUser.role);
        if (!isManagerOrAdmin) {
            return res.status(403).json({ success: false, message: 'Not authorized to view this request.' });
        }

        // 2. Find any overlapping leaves from the ENTIRE company
        const overlappingLeaves = await Leave.find({
            _id: { $ne: leaveId }, // Exclude the current request
            status: 'Approved',
            startDate: { $lte: primaryRequest.endDate },
            endDate: { $gte: primaryRequest.startDate }
        }).populate({
            path: 'employee',
            select: 'name department',
            populate: { path: 'department', select: 'name' }
        });

        // 3. Send all data back in one clean object
        res.status(200).json({
            success: true,
            data: {
                request: primaryRequest,
                overlapping: overlappingLeaves,
            }
        });

    } catch (error) {
        next(error);
    }
};