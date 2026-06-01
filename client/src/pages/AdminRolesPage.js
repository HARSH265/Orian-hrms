// In: client/src/pages/AdminRolesPage.js

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Table, Button, Card, Typography, Modal, Form, Input, message, Space, Popconfirm, Checkbox, Divider, Col, Row } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { fetchRoles, createRole, updateRole, deleteRole } from '../features/roles/roleThunks';
import { getGroupedPermissions } from '../config/permissions'; // <-- IMPORT PERMISSIONS

const { Title, Text } = Typography;

const AdminRolesPage = () => {
    const dispatch = useDispatch();
    const [form] = Form.useForm();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingRole, setEditingRole] = useState(null);

    const { roles, status } = useSelector(state => state.roles);
    const groupedPermissions = getGroupedPermissions();

    useEffect(() => {
        dispatch(fetchRoles());
    }, [dispatch]);

    const showModal = (role = null) => {
        setEditingRole(role);
        if (role) {
            form.setFieldsValue(role);
        } else {
            form.resetFields();
        }
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingRole(null);
        form.resetFields();
    };

    const onFinish = (values) => {
        const action = editingRole
            ? updateRole({ roleId: editingRole._id, roleData: values })
            : createRole(values);
        
        dispatch(action).unwrap()
            .then(() => {
                message.success(`Role ${editingRole ? 'updated' : 'created'} successfully!`);
                handleCancel();
            })
            // --- THE FIX: Make the catch block safe ---
            .catch(err => {
                // err can be a string or an object. We ensure we only show a string.
                const errorMessage = typeof err === 'string' ? err : 'An unexpected error occurred.';
                message.error(errorMessage);
            });
    };

    const handleDelete = (roleId) => {
        dispatch(deleteRole(roleId)).unwrap()
            .then(() => message.success('Role deleted.'))
            .catch(err => message.error(err));
    };

    const columns = [
        { title: 'Role Name', dataIndex: 'name', key: 'name' },
        { title: 'Description', dataIndex: 'description', key: 'description' },
        { title: 'Permissions', dataIndex: 'permissions', key: 'permissions', render: (perms) => `${perms?.length || 0} assigned` },
        { title: 'Actions', key: 'actions', render: (_, record) => (
            <Space>
                <Button icon={<EditOutlined />} onClick={() => showModal(record)}>Edit</Button>
                <Popconfirm title="Delete this role?" onConfirm={() => handleDelete(record._id)}>
                    <Button icon={<DeleteOutlined />} danger disabled={record.isSystemRole} />
                </Popconfirm>
            </Space>
        )},
    ];

    return (
        <Card>
            <Title level={2}>Manage Roles & Permissions</Title>
            <Text type="secondary">Create functional roles and assign specific permissions to them.</Text>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal(null)} style={{ float: 'right' }}>
                Create New Role
            </Button>
            <Table columns={columns} dataSource={roles} rowKey="_id" loading={status === 'loading'} style={{ marginTop: 24 }} />

            <Modal 
                title={editingRole ? `Edit Role: ${editingRole.name}` : 'Create New Role'} 
                open={isModalVisible} 
                onCancel={handleCancel} 
                footer={null}
                width={800} // Make modal wider
                destroyOnClose
            >
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Form.Item name="name" label="Role Name" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="description" label="Description"><Input.TextArea /></Form.Item>
                    
                    <Divider>Permissions</Divider>

                    <Form.Item name="permissions">
                        <Checkbox.Group style={{ width: '100%' }}>
                            <Row gutter={[16, 16]}>
                                {Object.entries(groupedPermissions).map(([groupName, perms]) => (
                                    <Col xs={24} md={12} key={groupName}>
                                        <Card size="small" title={groupName} style={{ height: '100%' }}>
                                            <Space direction="vertical">
                                                {perms.map(p => (
                                                    <Checkbox key={p.key} value={p.key}>
                                                        {p.name}
                                                    </Checkbox>
                                                ))}
                                            </Space>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        </Checkbox.Group>
                    </Form.Item>
                    
                    <Form.Item style={{ marginTop: '24px' }}>
                        <Button type="primary" htmlType="submit" loading={status === 'loading'}>
                            {editingRole ? 'Save Changes' : 'Create Role'}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
};

export default AdminRolesPage;