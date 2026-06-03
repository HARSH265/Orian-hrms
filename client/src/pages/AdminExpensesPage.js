import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Table, Button, Space, message, Typography, Card } from 'antd';
import StatusTag from '../components/common/StatusTag';
// Import the correct, admin-specific thunks
import { fetchAllSystemExpenses, adminUpdateExpenseStatus } from '../features/expense/expenseThunks';

const { Title } = Typography;

const AdminExpensesPage = () => {
    const dispatch = useDispatch();
    const { allExpenses, allStatus, actionStatus } = useSelector((state) => state.expense);

    useEffect(() => {
        dispatch(fetchAllSystemExpenses());
    }, [dispatch]);

    const handleUpdateStatus = (expenseId, newStatus) => {
        dispatch(adminUpdateExpenseStatus({ expenseId, status: newStatus })).unwrap()
            .then(() => message.success(`Claim has been ${newStatus.toLowerCase()}.`))
            .catch((err) => message.error(`Failed to update: ${err}`));
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
            title: 'Action', key: 'action',
            render: (_, record) => (
                record.status === 'Pending' && (
                    <Space size="middle">
                        <Button type="primary" size="small" onClick={() => handleUpdateStatus(record._id, 'Approved')}>Approve</Button>
                        <Button type="primary" danger size="small" onClick={() => handleUpdateStatus(record._id, 'Denied')}>Deny</Button>
                    </Space>
                )
            ),
        },
    ];

    return (
        <Card title={<Title level={3}>All Expense Claims (Admin View)</Title>}>
            <Table columns={columns} dataSource={allExpenses} rowKey="_id" loading={allStatus === 'loading' || actionStatus === 'loading'} scroll={{ x: true }} />
        </Card>
    );
};

export default AdminExpensesPage;