import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Table, Button, Space, message, Typography, Card } from 'antd';
import StatusTag from '../components/common/StatusTag';
// Import the correct, admin-specific thunks
import { fetchAllSystemExpenses, adminUpdateExpenseStatus } from '../features/expense/expenseThunks';

const { Title } = Typography;

const AdminExpensesPage = () => {
    const dispatch = useDispatch();
    // Select the correct data from the Redux store
    const { allExpenses, status } = useSelector((state) => state.expense);

    useEffect(() => {
        dispatch(fetchAllSystemExpenses());
    }, [dispatch]);

    // This is the local handler function for this component
    const handleUpdateStatus = (expenseId, newStatus) => {
        // It dispatches the specific admin thunk
        dispatch(adminUpdateExpenseStatus({ expenseId, status: newStatus })).unwrap()
            .then(() => message.success(`Claim has been ${newStatus.toLowerCase()}.`))
            .catch((err) => message.error(`Failed to update: ${err}`));
    };

    const columns = [
        { title: 'Employee', dataIndex: ['employee', 'name'], key: 'employeeName' },
        { title: 'Date', dataIndex: 'date', render: (date) => new Date(date).toLocaleDateString() },
        { title: 'Amount', dataIndex: 'amount', render: (amount) => `$${amount.toFixed(2)}` },
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
                        {/* Buttons now correctly call the local handler */}
                        <Button type="primary" size="small" onClick={() => handleUpdateStatus(record._id, 'Approved')}>Approve</Button>
                        <Button type="primary" danger size="small" onClick={() => handleUpdateStatus(record._id, 'Denied')}>Deny</Button>
                    </Space>
                )
            ),
        },
    ];

    return (
        <Card title={<Title level={3}>All Expense Claims (Admin View)</Title>}>
            {/* The table's dataSource now correctly uses the `allExpenses` variable */}
            <Table columns={columns} dataSource={allExpenses} rowKey="_id" loading={status === 'loading'} scroll={{ x: true }} />
        </Card>
    );
};

export default AdminExpensesPage;