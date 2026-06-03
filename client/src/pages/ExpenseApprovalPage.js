import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Table, Button, Space, message, Typography, Card } from 'antd';
import StatusTag from '../components/common/StatusTag';
import { 
    fetchTeamExpenses, 
    updateTeamExpenseStatus, 
    fetchAllSystemExpenses, 
    adminUpdateExpenseStatus 
} from '../features/expense/expenseThunks';

const { Title } = Typography;

const ExpenseApprovalPage = () => {
    const dispatch = useDispatch();
    
    const { user: loggedInUser } = useSelector((state) => state.auth);

    const { allExpenses, teamExpenses, teamStatus, allStatus, actionStatus } = useSelector((state) => state.expense);
    const isAdmin = loggedInUser?.systemRole === 'hr' || loggedInUser?.systemRole === 'super-admin';
    const expenses = isAdmin ? allExpenses : teamExpenses;
    const loadingStatus = isAdmin ? allStatus : teamStatus;

    useEffect(() => {
        if (!loggedInUser) return;

        if (isAdmin) {
            dispatch(fetchAllSystemExpenses());
        } else {
            dispatch(fetchTeamExpenses());
        }
    }, [dispatch, loggedInUser, isAdmin]);

    const handleUpdateStatus = (expenseId, newStatus) => {
        const action = isAdmin
            ? adminUpdateExpenseStatus({ expenseId, status: newStatus })
            : updateTeamExpenseStatus({ expenseId, status: newStatus });
        
        dispatch(action).unwrap()
            .then(() => message.success(`Claim has been ${newStatus.toLowerCase()}.`))
            .catch((err) => message.error(err));
    };

    const columns = [
        { title: 'Employee', dataIndex: ['employee', 'name'], key: 'employeeName' },
        { title: 'Date', dataIndex: 'date', render: (date) => new Date(date).toLocaleDateString() },
        {
            title: 'Amount', key: 'amount',
            render: (_, record) => {
                const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: record.currency || 'USD' });
                return fmt.format(record.amount);
            }
        },
        { title: 'Description', dataIndex: 'description' },
        { 
            title: 'Status', dataIndex: 'status', 
            render: status => <StatusTag status={status} />
        },
        {
            title: 'Receipt', dataIndex: 'receiptUrl',
            render: (url) => url ? <a href={url} target="_blank" rel="noopener noreferrer">View</a> : null
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
            <Table columns={columns} dataSource={expenses} rowKey="_id" loading={loadingStatus === 'loading' || actionStatus === 'loading'} scroll={{ x: true }} />
        </Card>
    );
};

export default ExpenseApprovalPage;