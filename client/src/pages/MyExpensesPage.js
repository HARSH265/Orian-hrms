import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Form, Input, Button, DatePicker, Table, message, Typography, Row, Col, Select, InputNumber } from 'antd';
import { fetchMyExpenses, submitExpense } from '../features/expense/expenseThunks';
import { fetchCategories } from '../features/expense/expenseCategoryThunks';
import StatusTag from '../components/common/StatusTag';
import FileUpload from '../components/FileUpload';

const { Title, Text } = Typography;
const { Option } = Select;

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'CNY', 'BRL', 'MXN', 'Other'];

const MyExpensesPage = () => {
    const dispatch = useDispatch();
    const [form] = Form.useForm();
    const [receiptUrl, setReceiptUrl] = useState('');
    const [receiptPublicId, setReceiptPublicId] = useState('');

    const { myExpenses, myStatus, actionStatus } = useSelector((state) => state.expense);
    const { categories } = useSelector((state) => state.expenseCategories);

    useEffect(() => {
        dispatch(fetchMyExpenses());
        dispatch(fetchCategories());
    }, [dispatch]);

    const onFinish = (values) => {
        const expenseData = {
            ...values,
            date: values.date?.toISOString(),
            receiptUrl,
            publicId: receiptPublicId,
        };

        dispatch(submitExpense(expenseData)).unwrap()
            .then(() => {
                message.success('Expense claim submitted!');
                form.resetFields();
                setReceiptUrl('');
                setReceiptPublicId('');
            })
            .catch((err) => message.error(`Submission failed: ${err}`));
    };

    const handleUploadSuccess = (filePath, publicId) => {
        setReceiptUrl(filePath);
        setReceiptPublicId(publicId || '');
    };

    const columns = [
        { title: 'Date', dataIndex: 'date', render: (date) => new Date(date).toLocaleDateString() },
        { title: 'Category', dataIndex: 'categoryName', key: 'categoryName' },
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
            render: (status) => <StatusTag status={status} />,
        },
        {
            title: 'Receipt',
            dataIndex: 'receiptUrl',
            key: 'receiptUrl',
            render: (url) => {
                if (url) {
                    return <a href={url} target="_blank" rel="noopener noreferrer">View</a>;
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
                            <Select
                                showSearch
                                placeholder="Select a category"
                                filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}
                            >
                                {categories.filter(c => c.isActive !== false).map(cat => (
                                    <Option key={cat._id} value={cat._id}>{cat.name}</Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item name="currency" label="Currency" initialValue="USD" rules={[{ required: true }]}>
                            <Select>
                                {CURRENCIES.map(c => <Option key={c} value={c}>{c}</Option>)}
                            </Select>
                        </Form.Item>
                        <Form.Item name="amount" label="Amount" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
                        <Form.Item name="description" label="Description" rules={[{ required: true }]}><Input.TextArea rows={4} /></Form.Item>
                        <Form.Item label="Upload Receipt (Optional)">
                            <FileUpload onUploadSuccess={handleUploadSuccess} />
                            {receiptUrl && (
                                <Text type="success" style={{ display: 'block', marginTop: 8 }}>
                                    Receipt uploaded successfully.
                                </Text>
                            )}
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={actionStatus === 'loading'}>Submit Claim</Button>
                        </Form.Item>
                    </Form>
                </Card>
            </Col>
            <Col xs={24} lg={16}>
                <Card title={<Title level={4}>My Expense History</Title>}>
                    <Table columns={columns} dataSource={myExpenses} rowKey="_id" loading={myStatus === 'loading'} scroll={{ x: true }} />
                </Card>
            </Col>
        </Row>
    );
};

export default MyExpensesPage;