import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Form, Input, Button, DatePicker, Table, message, Typography, Row, Col, Select, InputNumber } from 'antd';
import { fetchMyExpenses, submitExpense } from '../features/expense/expenseThunks';
import StatusTag from '../components/common/StatusTag';
import FileUpload from '../components/FileUpload'; // <-- Ensure this is imported

const { Title, Text } = Typography;
const { Option } = Select;

const MyExpensesPage = () => {
    const dispatch = useDispatch();
    const [form] = Form.useForm();
    
    // This state will hold the path of the file after a successful upload
    const [receiptUrl, setReceiptUrl] = useState('');

    const { myExpenses, status } = useSelector((state) => state.expense);

    useEffect(() => {
        dispatch(fetchMyExpenses());
    }, [dispatch]);

    // --- 1. UPDATED: onFinish handler to include the receiptUrl ---
    const onFinish = (values) => {
        // Create the final data object, including the URL from our state
        const expenseData = {
            ...values,
            receiptUrl: receiptUrl // Add the file path to the submission
        };

        dispatch(submitExpense(expenseData)).unwrap()
            .then(() => {
                message.success('Expense claim submitted!');
                form.resetFields();
                setReceiptUrl(''); // Clear the file path from state after successful submission
            })
            .catch((err) => message.error(`Submission failed: ${err}`));
    };

    const columns = [
        { title: 'Date', dataIndex: 'date', render: (date) => new Date(date).toLocaleDateString() },
        { title: 'Category', dataIndex: 'category' },
        { title: 'Amount', dataIndex: 'amount', render: (amount) => `$${amount.toFixed(2)}` },
        { title: 'Description', dataIndex: 'description' },
        {
            title: 'Status', dataIndex: 'status',
            render: (status) => <StatusTag status={status} />,
        },
        // --- 2. NEW: Column to view the uploaded receipt ---
        {
            title: 'Receipt',
            dataIndex: 'receiptUrl',
            key: 'receiptUrl',
            render: (url) => {
                if (url) {
                    // Assuming your backend is running on localhost:5004
                    // For production, you would use your actual domain
                    const downloadUrl = `${process.env.REACT_APP_API_URL || ''}${url}`;
                    return <a href={downloadUrl} target="_blank" rel="noopener noreferrer">View</a>;
                }
                return <Text type="secondary">N/A</Text>;
            }
        }
    ];

    return (
        <Row gutter={[24, 24]}>
            <Col xs={24} lg={8}>
                <Card title={<Title level={4}>Submit Expense Claim</Title>}>
                    <Form form={form} layout="vertical" onFinish={onFinish}>
                        <Form.Item name="date" label="Date of Expense" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
                        <Form.Item name="category" label="Category" rules={[{ required: true }]}>
                            <Select><Option value="Travel">Travel</Option><Option value="Meal">Meal</Option><Option value="Supplies">Supplies</Option><Option value="Training">Training</Option><Option value="Other">Other</Option></Select>
                        </Form.Item>
                        <Form.Item name="amount" label="Amount ($)" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
                        <Form.Item name="description" label="Description" rules={[{ required: true }]}><Input.TextArea rows={4} /></Form.Item>
                        
                        {/* --- 3. NEW: The FileUpload component in the form --- */}
                        <Form.Item label="Upload Receipt (Optional)">
                            <FileUpload onUploadSuccess={(filePath) => setReceiptUrl(filePath)} />
                            {receiptUrl && (
                                <Text type="success" style={{ display: 'block', marginTop: 8 }}>
                                    Receipt uploaded successfully.
                                </Text>
                            )}
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={status === 'loading'}>Submit Claim</Button>
                        </Form.Item>
                    </Form>
                </Card>
            </Col>
            <Col xs={24} lg={16}>
                <Card title={<Title level={4}>My Expense History</Title>}>
                    <Table columns={columns} dataSource={myExpenses} rowKey="_id" loading={status === 'loading'} scroll={{ x: true }} />
                </Card>
            </Col>
        </Row>
    );
};

export default MyExpensesPage;