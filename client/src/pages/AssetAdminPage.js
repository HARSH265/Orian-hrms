import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Table, Button, Card, Typography, Modal, Form, Input, message, Space, Popconfirm, Select, DatePicker } from 'antd';
import StatusTag from '../components/common/StatusTag';
import { fetchAllAssets, createAsset, updateAsset, deleteAsset } from '../features/asset/assetThunks';
import { fetchAllUsers } from '../features/admin/adminThunks'; // We need users for the assignment dropdown
import dayjs from 'dayjs';
const { Title } = Typography;
const { Option } = Select;

const AssetAdminPage = () => {
    const dispatch = useDispatch();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingAsset, setEditingAsset] = useState(null);
    const [form] = Form.useForm();
    
    const { allAssets, status } = useSelector((state) => state.asset);
    const { users } = useSelector((state) => state.admin); // Get users for the dropdown

    useEffect(() => {
        dispatch(fetchAllAssets());
        dispatch(fetchAllUsers()); // Fetch users when the page loads
    }, [dispatch]);

    const showModal = (asset = null) => {
        setEditingAsset(asset);
        // Special handling for dates and assignedTo ID
        const formValues = asset 
            ? { 
                ...asset, 
                assignedTo: asset.assignedTo?._id,
                purchaseDate: asset.purchaseDate ? dayjs(asset.purchaseDate) : null,
                warrantyEndDate: asset.warrantyEndDate ? dayjs(asset.warrantyEndDate) : null
              } 
            : {};
        form.setFieldsValue(formValues);
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingAsset(null);
        form.resetFields();
    };

    const onFinish = (values) => {
        const action = editingAsset
            ? updateAsset({ assetId: editingAsset._id, assetData: values })
            : createAsset(values);

        dispatch(action)
            .unwrap()
            .then(() => {
                message.success(`Asset ${editingAsset ? 'updated' : 'created'} successfully!`);
                handleCancel();
            })
            .catch((err) => message.error(err));
    };

    const handleDelete = (assetId) => {
        dispatch(deleteAsset(assetId))
            .unwrap()
            .then(() => message.success('Asset deleted!'))
            .catch((err) => message.error(err));
    };

    const columns = [
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Type', dataIndex: 'assetType', key: 'assetType' },
        { title: 'Serial Number', dataIndex: 'serialNumber', key: 'serialNumber' },
        { 
            title: 'Status', 
            dataIndex: 'status', 
            key: 'status',
            render: (status) => <StatusTag status={status} />,
        },
        { title: 'Assigned To', dataIndex: ['assignedTo', 'name'], key: 'assignedTo' },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button type="link" onClick={() => showModal(record)}>Edit/Assign</Button>
                    {record.status !== 'Assigned' && (
                        <Popconfirm title="Are you sure?" onConfirm={() => handleDelete(record._id)}>
                            <Button type="link" danger>Delete</Button>
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <>
            <Card title={<Title level={3}>Asset Management</Title>} extra={<Button type="primary" onClick={() => showModal(null)}>Add New Asset</Button>}>
                <Table columns={columns} dataSource={allAssets} rowKey="_id" loading={status === 'loading'} />
            </Card>

            <Modal title={editingAsset ? 'Edit Asset' : 'Create New Asset'} open={isModalVisible} onCancel={handleCancel} footer={null}>
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Form.Item name="name" label="Asset Name" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="assetType" label="Asset Type" rules={[{ required: true }]}>
                        <Select><Option value="Hardware">Hardware</Option><Option value="Software">Software</Option><Option value="Other">Other</Option></Select>
                    </Form.Item>
                    <Form.Item name="serialNumber" label="Serial Number"><Input /></Form.Item>
                    <Form.Item name="assignedTo" label="Assign To">
                        <Select allowClear>
                            <Option value={null}>-- Unassign --</Option>
                            {users.map(user => <Option key={user._id} value={user._id}>{user.name}</Option>)}
                        </Select>
                    </Form.Item>
                    <Form.Item name="purchaseDate" label="Purchase Date"><DatePicker /></Form.Item>
                    <Form.Item name="warrantyEndDate" label="Warranty End Date"><DatePicker /></Form.Item>
                    <Form.Item name="notes" label="Notes"><Input.TextArea rows={4} /></Form.Item>
                    <Form.Item><Button type="primary" htmlType="submit" loading={status === 'loading'}>Save Asset</Button></Form.Item>
                </Form>
            </Modal>
        </>
    );
};



export default AssetAdminPage;