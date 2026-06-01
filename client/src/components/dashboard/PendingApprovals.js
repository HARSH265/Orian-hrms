import React, { useEffect } from 'react'; // <-- Add React
import { useDispatch, useSelector } from 'react-redux';
import { Spin, Statistic, Row, Col, Card, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { fetchTeamLeaveRequests } from '../../features/manager/managerThunks';
import { fetchTeamExpenses } from '../../features/expense/expenseThunks';
import { fetchAllSystemLeaves } from '../../features/admin-leaves/adminLeavesThunks';
import { fetchAllSystemExpenses } from '../../features/expense/expenseThunks';

const { Title } = Typography; // <-- Add Title for consistency

const PendingApprovals = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    // This is good, but let's make it safer.
    const isManagerOrAdmin = user?.role === 'manager' || user?.role === 'hr' || user?.role === 'super-admin';
    const isAdmin = user?.role === 'hr' || user?.role === 'super-admin';

    const { leaves, leavesStatus } = useSelector((state) => ({
        leaves: isAdmin ? state.adminLeaves.allLeaves : state.manager.teamLeaveRequests,
        leavesStatus: isAdmin ? state.adminLeaves.status : state.manager.status,
    }));

    const { expenses, expensesStatus } = useSelector((state) => ({
        expenses: isAdmin ? state.expense.allExpenses : state.expense.teamExpenses,
        expensesStatus: state.expense.status,
    }));

    useEffect(() => {
        if (!user) return; // Guard clause

        if (isAdmin) {
            dispatch(fetchAllSystemLeaves());
            dispatch(fetchAllSystemExpenses());
        } else if (user.role === 'manager') {
            dispatch(fetchTeamLeaveRequests());
            dispatch(fetchTeamExpenses());
        }
    }, [dispatch, user]); // <-- useEffect should depend on user object

    const pendingLeaves = leaves.filter(req => req.status === 'Pending');
    const pendingExpenses = expenses.filter(req => req.status === 'Pending');
    
    // Better loading check
    if ((leavesStatus === 'loading' || expensesStatus === 'loading') && (pendingLeaves.length === 0 && pendingExpenses.length === 0)) {
        return <Card title={<Title level={4}>Pending Approvals</Title>}><Spin /></Card>;
    }

    const leaveLink = isAdmin ? '/admin/leaves' : '/team';
    const expenseLink = isAdmin ? '/admin/expenses' : '/team/expenses';

    return (
        <Card title={<Title level={4}>Pending Approvals</Title>}>
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