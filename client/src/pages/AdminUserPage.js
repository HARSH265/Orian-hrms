import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
    Table, 
    Button, 
    Card, 
    Typography, 
    Modal, 
    Form, 
    Input, 
    Select, 
    message, 
    Space, 
    Popconfirm, 
    Tag,
    Switch 
} from 'antd';
import { FileDoneOutlined } from '@ant-design/icons';
import { DatePicker } from 'antd'
import { 
    fetchAllUsers, 
    createNewUser, 
    updateUser, 
    deactivateUser,
    fetchAllManagers 
} from '../features/admin/adminThunks';
import { fetchAllDepartments } from '../features/department/departmentThunks'; 
import { fetchChecklistTemplates, applyChecklistTemplate } from '../features/checklist/checklistThunks';

const { Title } = Typography;
const { Option } = Select;

const AdminUserPage = () => {
    // --- Hooks and State Initialization ---
    const dispatch = useDispatch();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [showInactive, setShowInactive] = useState(false); // State for the filter toggle
    const [form] = Form.useForm();

      const [isApplyModalVisible, setIsApplyModalVisible] = useState(false);
    const [targetUser, setTargetUser] = useState(null);
    const [applyForm] = Form.useForm();

    // Get checklist templates from the store
    const { templates } = useSelector((state) => state.checklist);
    
    // --- Redux State Selection ---
    const { users, managers, status } = useSelector((state) => state.admin);
    const { departments } = useSelector((state) => state.department); 
    const { user: loggedInUser } = useSelector((state) => state.auth);

    // --- Effects ---
    // Fetch all users when the component first loads
    useEffect(() => {
        dispatch(fetchAllUsers());
         dispatch(fetchAllDepartments());
         dispatch(fetchAllManagers());
    }, [dispatch]);

    // This effect runs after users are fetched to then get the managers list
    useEffect(() => {
        if (users.length > 0) {
            dispatch(fetchAllManagers());
        }
    }, [users, dispatch]);

     // Fetch the checklist templates
    useEffect(() => {
        dispatch(fetchChecklistTemplates());
    }, [dispatch]);

    // --- Data Filtering ---
    // Determine which users to display based on the 'showInactive' toggle
    const filteredUsers = showInactive ? users : users.filter(user => user.isActive);

    // --- Modal and Form Handlers ---
   const showModal = (user = null) => {
        setEditingUser(user);
        // Pre-fill form with user data, ensuring we use the _id for reference fields
        form.setFieldsValue(
            user ? {
                ...user,
                department: user.department?._id,
                manager: user.manager?._id,
            } : {
                role: 'employee', // Default role for new users
            }
        );
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingUser(null);
        form.resetFields();
    };

    

     const showApplyModal = (user) => {
        setTargetUser(user);
        setIsApplyModalVisible(true);
    };

    const handleApplyCancel = () => {
        setIsApplyModalVisible(false);
        setTargetUser(null);
        applyForm.resetFields();
    };


    // Handles both creating a new user and updating an existing one
     const onFinish = (values) => {
        // Clean the data before sending: remove empty optional fields
        const userData = { ...values };
        if (!userData.department) delete userData.department;
        if (!userData.manager) delete userData.manager;

        const action = editingUser
            ? updateUser({ userId: editingUser._id, userData })
            : createNewUser(userData);

        dispatch(action).unwrap()
            .then(() => {
                message.success(`User ${editingUser ? 'updated' : 'created'} successfully!`);
                handleCancel();
            })
            .catch((err) => message.error(`Failed to ${editingUser ? 'update' : 'create'} user: ${err}`));
    };

     const onApplyFinish = (values) => {
        const payload = {
            templateId: values.templateId,
            targetUserId: targetUser._id,
            startDate: values.startDate.toISOString(),
        };
        dispatch(applyChecklistTemplate(payload)).unwrap()
            .then((msg) => {
                message.success(msg);
                handleApplyCancel();
            })
            .catch((err) => message.error(err));
    };

    // --- Action Handlers ---
    const handleDeactivate = (userId) => {
        dispatch(deactivateUser(userId))
            .unwrap()
            .then(() => message.success('User deactivated successfully!'))
            .catch((err) => message.error(`Failed to deactivate user: ${err}`));
    };

    const handleReactivate = (userId) => {
        dispatch(updateUser({ userId, userData: { isActive: true } }))
            .unwrap()
            .then(() => message.success('User reactivated successfully!'))
            .catch((err) => message.error(`Failed to reactivate user: ${err}`));
    };

    // --- Table Column Definitions ---
    const columns = [
        { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
        { title: 'Email', dataIndex: 'email', key: 'email' },
        { title: 'Department', dataIndex: ['department', 'name'], key: 'department' },
        { title: 'Manager', dataIndex: ['manager', 'name'], key: 'manager' },
        { title: 'Role', dataIndex: 'role', key: 'role', render: role => <Tag>{role?.toUpperCase()}</Tag> },
        { title: 'Status', dataIndex: 'isActive', key: 'isActive', render: isActive => (<Tag color={isActive ? 'green' : 'red'}>{isActive ? 'ACTIVE' : 'INACTIVE'}</Tag>)},
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => {
                const isSelf = loggedInUser?._id === record._id;
                if (isSelf) return <Button type="link" disabled>(Own Account)</Button>;

                return (
                    <Space>
                        <Button type="link" onClick={() => showModal(record)}>Edit</Button>
                        {record.isActive ? (
                            <Popconfirm title="Deactivate this user?" onConfirm={() => handleDeactivate(record._id)}><Button type="link" danger>Deactivate</Button></Popconfirm>
                        ) : (
                            <Button type="link" onClick={() => handleReactivate(record._id)}>Reactivate</Button>
                        )}
                    </Space>
                );
            },
        },
         {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button type="link" onClick={() => showModal(record)}>Edit</Button>
                    {/* --- ADD NEW BUTTON --- */}
                    <Button type="link" icon={<FileDoneOutlined />} onClick={() => showApplyModal(record)}>
                        Apply Checklist
                    </Button>
                    {/* ... Deactivate/Reactivate buttons ... */}
                </Space>
            ),
        },
    ];

    return (
        <>
             <Card
                title={<Title level={3}>User Management</Title>}
                extra={
                    <Space>
                        <Switch checkedChildren="Show Inactive" unCheckedChildren="Active Only" checked={showInactive} onChange={setShowInactive} />
                        <Button type="primary" onClick={() => showModal(null)}>Create User</Button>
                    </Space>
                }
            >
                <Table
                    columns={columns}
                    dataSource={filteredUsers}
                    rowKey="_id"
                    loading={status === 'loading'}
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: true }}
                />
            </Card>

            <Modal
                title={editingUser ? 'Edit User' : 'Create New User'}
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Form.Item name="name" label="Full Name" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
                    {!editingUser && (<Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }]}><Input.Password /></Form.Item>)}
                    <Form.Item name="role" label="Role" rules={[{ required: true }]}>
                        <Select placeholder="Select a role">
                            <Option value="employee">Employee</Option><Option value="manager">Manager</Option><Option value="hr">HR</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="jobTitle" label="Job Title"><Input /></Form.Item>
                    <Form.Item name="department" label="Department">
                        <Select placeholder="Assign a department" allowClear>
                            {departments.map(dept => (<Option key={dept._id} value={dept._id}>{dept.name}</Option>))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="manager" label="Assign Manager">
                        <Select placeholder="Assign a manager" allowClear>
                            {managers.map(mgr => (<Option key={mgr._id} value={mgr._id}>{mgr.name}</Option>))}
                        </Select>
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={status === 'loading'}>
                            {editingUser ? 'Save Changes' : 'Create User'}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

             {/* --- ADD THE NEW "APPLY CHECKLIST" MODAL --- */}
            <Modal
                title={`Apply Checklist to ${targetUser?.name}`}
                open={isApplyModalVisible}
                onCancel={handleApplyCancel}
                footer={null}
            >
                <Form form={applyForm} layout="vertical" onFinish={onApplyFinish}>
                    <Form.Item name="templateId" label="Select a Checklist Template" rules={[{ required: true }]}>
                        <Select placeholder="Choose a template">
                            {templates.map(t => <Option key={t._id} value={t._id}>{t.name}</Option>)}
                        </Select>
                    </Form.Item>
                    <Form.Item name="startDate" label="Effective Start Date" rules={[{ required: true }]}>
                        <DatePicker />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={status === 'loading'}>
                            Generate Tasks
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

        </>
    );
};

export default AdminUserPage;