import  { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {  Spin, Statistic, Row, Col, Card } from 'antd'; // Make sure Card is imported
import { Link } from 'react-router-dom';
// Import ALL the thunks we might need
import { fetchTeamLeaveRequests } from '../../features/manager/managerThunks';
import { fetchTeamExpenses } from '../../features/expense/expenseThunks';
import { fetchAllSystemLeaves } from '../../features/admin-leaves/adminLeavesThunks';
import { fetchAllSystemExpenses } from '../../features/expense/expenseThunks';

const PendingApprovals = () => {
    const dispatch = useDispatch();
    
    // --- 1. GET THE LOGGED-IN USER'S ROLE ---
    const { user } = useSelector((state) => state.auth);

    // --- 2. SELECT THE CORRECT DATA SOURCE BASED ON ROLE ---
    const { leaves, leavesStatus } = useSelector((state) => {
        const isManager = user.role === 'manager';
        return {
            leaves: isManager ? state.manager.teamLeaveRequests : state.adminLeaves.allLeaves,
            leavesStatus: isManager ? state.manager.status : state.adminLeaves.status,
        };
    });

    const { expenses, expensesStatus } = useSelector((state) => {
        const isManager = user.role === 'manager';
        return {
            expenses: isManager ? state.expense.teamExpenses : state.expense.allExpenses,
            expensesStatus: isManager ? state.expense.status : state.expense.status, // Status can be shared for simplicity
        };
    });

    // --- 3. FETCH THE CORRECT DATA BASED ON ROLE ---
    useEffect(() => {
        if (user.role === 'hr' || user.role === 'super-admin') {
            dispatch(fetchAllSystemLeaves());
            dispatch(fetchAllSystemExpenses());
        } else if (user.role === 'manager') {
            dispatch(fetchTeamLeaveRequests());
            dispatch(fetchTeamExpenses());
        }
    }, [dispatch, user.role]);

    // Filter the selected data for pending items
    const pendingLeaves = leaves.filter(req => req.status === 'Pending');
    const pendingExpenses = expenses.filter(req => req.status === 'Pending');

    if (leavesStatus === 'loading' || expensesStatus === 'loading') return <Spin />;

    // --- 4. LINK TO THE CORRECT APPROVAL PAGE BASED ON ROLE ---
    const leaveLink = (user.role === 'hr' || user.role === 'super-admin') ? '/admin/leaves' : '/team';
    const expenseLink = (user.role === 'hr' || user.role === 'super-admin') ? '/admin/expenses' : '/team/expenses';

    return (
        <Card title="Pending Approvals">
            <Row gutter={16}>
                <Col span={12}>
                    <Link to={leaveLink}>
                        <Statistic title="Leave Requests" value={pendingLeaves.length} />
                    </Link>
                </Col>
                <Col span={12}>
                    <Link to={expenseLink}>
                        <Statistic title="Expense Claims" value={pendingExpenses.length} />
                    </Link>
                </Col>
            </Row>
        </Card>
    );
};

export default PendingApprovals;