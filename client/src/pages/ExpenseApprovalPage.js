import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Table, Button, Space, Tag, message, Typography, Card } from 'antd';
import { 
    fetchTeamExpenses, 
    updateTeamExpenseStatus, 
    fetchAllSystemExpenses, 
    adminUpdateExpenseStatus 
} from '../features/expense/expenseThunks';

const { Title } = Typography;

const ExpenseApprovalPage = () => {
    const dispatch = useDispatch();
    
    // --- THIS IS THE MISSING LINE ---
    const { user: loggedInUser } = useSelector((state) => state.auth);
    // --- END OF FIX ---

    // Now, we can performantly select our data
    const { allExpenses, teamExpenses, status } = useSelector((state) => state.expense);

    // And use the loggedInUser to determine which data to display
    const expenses = (loggedInUser.role === 'hr' || loggedInUser.role === 'super-admin') ? allExpenses : teamExpenses;

    useEffect(() => {
        if (!loggedInUser) return; // Don't fetch data until we know who the user is

        if (loggedInUser.role === 'hr' || loggedInUser.role === 'super-admin') {
            dispatch(fetchAllSystemExpenses());
        } else if (loggedInUser.role === 'manager') {
            dispatch(fetchTeamExpenses());
        }
    }, [dispatch, loggedInUser]);

    const handleUpdateStatus = (expenseId, newStatus) => {
        const action = (loggedInUser.role === 'hr' || loggedInUser.role === 'super-admin')
            ? adminUpdateExpenseStatus({ expenseId, status: newStatus })
            : updateTeamExpenseStatus({ expenseId, status: newStatus });
        
        dispatch(action).unwrap()
            .then(() => message.success(`Claim has been ${newStatus.toLowerCase()}.`))
            .catch((err) => message.error(err));
    };

    const columns = [
        { title: 'Employee', dataIndex: ['employee', 'name'], key: 'employeeName' },
        { title: 'Date', dataIndex: 'date', render: (date) => new Date(date).toLocaleDateString() },
        { title: 'Amount', dataIndex: 'amount', render: (amount) => `$${amount.toFixed(2)}` },
        { title: 'Description', dataIndex: 'description' },
        { 
            title: 'Status', dataIndex: 'status', 
            render: status => <Tag color={status === 'Approved' ? 'success' : status === 'Denied' ? 'error' : 'warning'}>{status.toUpperCase()}</Tag>
        },
        {
            title: 'Action', key: 'action',
            render: (_, record) => {
                const isOwnRequest = record.employee?._id === loggedInUser?._id;
                if (record.status === 'Pending' && !isOwnRequest) {
                    return (
                        <Space size="middle">
                            <Button type="primary" size="small" onClick={() => handleUpdateStatus(record._id, 'Approved')}>Approve</Button>
                            <Button type="primary" danger size="small" onClick={() => handleUpdateStatus(record._id, 'Denied')}>Deny</Button>
                        </Space>
                    );
                }
                return null;
            },
        },
    ];

    return (
        <Card title={<Title level={3}>Expense Claim Approvals</Title>}>
            <Table columns={columns} dataSource={expenses} rowKey="_id" loading={status === 'loading'} scroll={{ x: true }} />
        </Card>
    );
};

export default ExpenseApprovalPage;