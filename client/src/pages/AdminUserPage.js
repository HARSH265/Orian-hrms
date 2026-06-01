import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Table, Button, Card, Typography, Modal, Form, Input, Select, message, Space, Popconfirm, Tag, Switch, DatePicker, Row, Col, Dropdown, Menu, Tabs } from 'antd';
import { FileDoneOutlined, DollarCircleOutlined, EditOutlined, DeleteOutlined, UserAddOutlined, BarsOutlined, MoreOutlined, CalendarOutlined } from '@ant-design/icons';
import { fetchAllUsers, createNewUser, updateUser, deactivateUser } from '../features/admin/adminThunks';
import { fetchAllDepartments } from '../features/department/departmentThunks';
import { fetchChecklistTemplates, applyChecklistTemplate } from '../features/checklist/checklistThunks';
import { fetchLeavePolicies, assignPolicyToEmployee } from '../features/leave-policy/leavePolicyThunks';
import { fetchRoles } from '../features/roles/roleThunks';
import SensitiveDataForm from '../components/admin/SensitiveDataForm';
import UserChecklistProgress from '../components/admin/UserChecklistProgress';
import moment from 'moment';
import debounce from 'lodash.debounce';

const { Title, Text } = Typography;
const { Option } = Select;

const roleHierarchy = {
    'super-admin': 3,
    'hr': 2,
    'manager': 1,
    'employee': 0,
};

const AdminUserPage = () => {
    const dispatch = useDispatch();
    const [messageApi, contextHolder] = message.useMessage();

    // State for Modals and UI
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isApplyModalVisible, setIsApplyModalVisible] = useState(false);
    const [isLeaveModalVisible, setIsLeaveModalVisible] = useState(false);
    const [isSensitiveDataModalVisible, setIsSensitiveDataModalVisible] = useState(false);
    const [isProgressModalVisible, setIsProgressModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [targetUser, setTargetUser] = useState(null);
    const [sensitiveDataUser, setSensitiveDataUser] = useState(null);

    // State for API control
    const [pagination, setPagination] = useState({ current: 1, pageSize: 5 });
    const [sorter, setSorter] = useState({ field: 'name', order: 'ascend' });
    const [filters, setFilters] = useState({ role: null, status: 'active', search: '' });
    
    // Forms
    const [form] = Form.useForm();
    const [applyForm] = Form.useForm();
    const [leaveForm] = Form.useForm();

    // Selectors
    const { users, status, pagination: storePagination } = useSelector((state) => state.admin);
    const { departments } = useSelector((state) => state.department);
    const { user: loggedInUser } = useSelector((state) => state.auth);
    const { templates } = useSelector((state) => state.checklist);
    const { policies } = useSelector((state) => state.leavePolicy);
    const { roles } = useSelector((state) => state.roles);

    const debouncedSearch = useCallback(debounce((value) => {
        setFilters(prev => ({ ...prev, search: value, status: prev.status || 'active' }));
    }, 500), []);

    useEffect(() => {
        const fetchParams = {
            page: pagination.current,
            limit: pagination.pageSize,
            sortBy: sorter.field,
            order: sorter.order === 'ascend' ? 'asc' : 'desc',
            filters: filters,
        };
        dispatch(fetchAllUsers(fetchParams));
    }, [dispatch, pagination, sorter, filters]);
    
    useEffect(() => {
        dispatch(fetchAllDepartments());
        dispatch(fetchChecklistTemplates());
        dispatch(fetchLeavePolicies());
        dispatch(fetchRoles());
    }, [dispatch]);

    // Handlers


    const handleTableChange = (pagination, tableFilters, sorter) => {
        setPagination(pagination);
        setSorter({
            field: sorter.field || 'name',
            order: sorter.order || 'ascend',
        });
    };
    
    const showEditModal = (user = null) => {
        setEditingUser(user);
        if (user) {
            form.setFieldsValue({
                ...user,
                department: user.department?._id,
                manager: user.manager?._id,
                'employmentInfo.hireDate': user.employmentInfo?.hireDate ? moment(user.employmentInfo.hireDate) : null,
                'personalInfo.dateOfBirth': user.personalInfo?.dateOfBirth ? moment(user.personalInfo.dateOfBirth) : null,
                roles: user.roles?.map(role => role._id) || [],
                role: user.systemRole
            });
        } else {
            form.setFieldsValue({ role: 'employee', isActive: true, roles: [] });
        }
        setIsEditModalVisible(true);
    };
    const handleEditCancel = () => { setIsEditModalVisible(false); setEditingUser(null); form.resetFields(); };
    
    const onEditFinish = (values) => {
        const { role, ...otherValues } = values;
        const userData = { ...otherValues, systemRole: role };

        const action = editingUser 
            ? updateUser({ userId: editingUser._id, userData }) 
            : createNewUser(userData);
        
        dispatch(action).unwrap()
            .then(() => { messageApi.success(`User ${editingUser ? 'updated' : 'created'}!`); handleEditCancel(); })
            .catch(err => messageApi.error(err));
    };

    const showApplyModal = (user) => { setTargetUser(user); setIsApplyModalVisible(true); };
    const handleApplyCancel = () => { setIsApplyModalVisible(false); applyForm.resetFields(); };
    
    const onApplyFinish = (values) => {
        dispatch(applyChecklistTemplate({ templateId: values.templateId, startDate: values.startDate, targetUserId: targetUser._id }))
            .unwrap()
            .then((message) => { messageApi.success(message); handleApplyCancel(); })
            .catch(err => messageApi.error(err));
    };

    const showLeaveModal = (user) => { setTargetUser(user); setIsLeaveModalVisible(true); };
    const handleLeaveCancel = () => { setIsLeaveModalVisible(false); leaveForm.resetFields(); };
    
    const onLeaveAssign = (values) => {
        const payload = { ...values, employeeId: targetUser._id, year: values.year.year() };
        dispatch(assignPolicyToEmployee(payload)).unwrap()
            .then(() => { messageApi.success('Policy assigned!'); handleLeaveCancel(); })
            .catch(err => messageApi.error(err));
    };
    
    const showSensitiveDataModal = (user) => { setSensitiveDataUser(user); setIsSensitiveDataModalVisible(true); };
    const handleSensitiveDataCancel = () => { setIsSensitiveDataModalVisible(false); };

    const showProgressModal = (user) => { setTargetUser(user); setIsProgressModalVisible(true); };
    const handleProgressCancel = () => { setIsProgressModalVisible(false); setTargetUser(null); };
    
    const handleDeactivate = (userId) => dispatch(deactivateUser(userId)).unwrap()
        .then(() => messageApi.success('User deactivated!'))
        .catch(err => messageApi.error(err));
        
    const handleReactivate = (userId) => dispatch(updateUser({ userId, userData: { isActive: true } })).unwrap()
        .then(() => messageApi.success('User reactivated!'))
        .catch(err => messageApi.error(err));

    const columns = [
        { title: 'Name', dataIndex: 'name', key: 'name', fixed: 'left', sorter: true },
        { title: 'Email', dataIndex: 'email', key: 'email' },
        { title: 'Job Title', dataIndex: 'jobTitle', key: 'jobTitle' },
        { title: 'Department', dataIndex: ['department', 'name'], key: 'department' },
        { title: 'Manager', dataIndex: ['manager', 'name'], key: 'manager' },
        { title: 'Role', dataIndex: 'systemRole', key: 'systemRole', render: role => <Tag>{role?.toUpperCase()}</Tag> },
        { title: 'Status', dataIndex: 'isActive', key: 'isActive', render: isActive => <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'ACTIVE' : 'INACTIVE'}</Tag> },
        {
            title: 'Actions', key: 'actions', fixed: 'right', width: 100, align: 'center',
            render: (_, record) => {
                const loggedInUserLevel = roleHierarchy[loggedInUser?.systemRole] || 0;
                const targetUserLevel = roleHierarchy[record.systemRole] || 0;
                const canModify = loggedInUserLevel > targetUserLevel;

                const menuItems = [
                    canModify && { key: 'edit', label: 'Edit User', icon: <EditOutlined />, onClick: () => showEditModal(record) },
                    { key: 'leave', label: 'Assign Leave', icon: <CalendarOutlined />, onClick: () => showLeaveModal(record) },
                    { key: 'checklist', label: 'Apply Checklist', icon: <FileDoneOutlined />, onClick: () => showApplyModal(record) },
                    { key: 'progress', label: 'View Progress', icon: <BarsOutlined />, onClick: () => showProgressModal(record) },
                    loggedInUser?.systemRole === 'super-admin' && { key: 'sensitive', label: 'Sensitive Data', icon: <DollarCircleOutlined />, onClick: () => showSensitiveDataModal(record) },
                    canModify && { type: 'divider' },
                    canModify && record.isActive && { key: 'deactivate', label: <Popconfirm title="Deactivate this user?" onConfirm={() => handleDeactivate(record._id)}><span>Deactivate User</span></Popconfirm>, icon: <DeleteOutlined />, danger: true },
                    canModify && !record.isActive && { key: 'reactivate', label: 'Reactivate User', onClick: () => handleReactivate(record._id) }
                ].filter(Boolean);

                return (
                    <Dropdown menu={{ items: menuItems }} trigger={['click']} disabled={menuItems.length === 0}>
                        <Button type="text" icon={<MoreOutlined />} />
                    </Dropdown>
                );
            },
        },
    ];

    return (
        <Card>
            {contextHolder}
            <Title level={2}>User Management</Title>
            
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={24} sm={12} md={8}>
                    <Input.Search placeholder="Search by name or email..." onChange={(e) => debouncedSearch(e.target.value)} allowClear />
                </Col>
                <Col xs={12} sm={6} md={4}>
                    <Select placeholder="Filter by Role" onChange={(value) => setFilters(prev => ({ ...prev, role: value }))} allowClear style={{ width: '100%' }}
                        options={[{value: 'employee', label: 'Employee'}, {value: 'manager', label: 'Manager'}, {value: 'hr', label: 'HR'}]}
                    />
                </Col>
                 <Col xs={12} sm={6} md={4}>
                    <Select defaultValue="active" onChange={(value) => setFilters(prev => ({ ...prev, status: value }))} style={{ width: '100%' }}
                        options={[{value: 'active', label: 'Active Users'}, {value: 'inactive', label: 'Inactive Users'}]}
                    />
                </Col>
            </Row>

            <Space style={{ marginBottom: 16 }}>
                <Button type="primary" icon={<UserAddOutlined />} onClick={() => showEditModal(null)}>Add New User</Button>
            </Space>
            
            <Table columns={columns} dataSource={users} rowKey="_id" loading={status === 'loading'} scroll={{ x: 1300 }} onChange={handleTableChange}
                pagination={{ current: pagination.current, pageSize: pagination.pageSize, total: storePagination.total, showSizeChanger: true, pageSizeOptions: ['5', '10', '20', '50'] }}
            />

            <Modal title={editingUser ? `Edit User: ${editingUser.name}` : 'Add New User'} open={isEditModalVisible} onCancel={handleEditCancel} footer={null} width={720} destroyOnClose>
                <Form form={form} layout="vertical" onFinish={onEditFinish}>
                    <Tabs defaultActiveKey="1">
                        <Tabs.TabPane tab="Core Information" key="1">
                            <Row gutter={16}>
                                {!editingUser && (
                                    <>
                                        <Col span={12}><Form.Item name="name" label="Full Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
                                        <Col span={12}><Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item></Col>
                                        <Col span={12}><Form.Item name="password" label="Initial Password" rules={[{ required: true, min: 6 }]}><Input.Password /></Form.Item></Col>
                                    </>
                                )}
                                <Col span={12}><Form.Item name="jobTitle" label="Job Title"><Input /></Form.Item></Col>
                                <Col span={12}><Form.Item name="department" label="Department"><Select allowClear showSearch optionFilterProp="children" options={departments.map(d => ({ value: d._id, label: d.name }))} /></Form.Item></Col>
                                <Col span={12}><Form.Item name="manager" label="Assign Manager"><Select allowClear showSearch optionFilterProp="children" options={users.filter(u => u.systemRole !== 'employee').map(m => ({ value: m._id, label: m.name }))} /></Form.Item></Col>
                                <Col span={12}>
                                    <Form.Item name="role" label="System Role (UI Control)" rules={[{ required: true }]}>
                                        <Select options={['employee', 'manager', 'hr', 'super-admin'].map(r => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) }))} />
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item name="roles" label="Assign Functional Roles (Permissions)">
                                        <Select mode="multiple" allowClear placeholder="Select functional roles..." options={roles.map(r => ({ value: r._id, label: r.name }))} />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Tabs.TabPane>
                        <Tabs.TabPane tab="Employment Details" key="2">
                             <Row gutter={16}>
                                <Col span={12}><Form.Item name={['employmentInfo', 'employeeId']} label="Employee ID"><Input /></Form.Item></Col>
                                <Col span={12}><Form.Item name={['employmentInfo', 'hireDate']} label="Hire Date"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
                                <Col span={12}><Form.Item name={['employmentInfo', 'employmentType']} label="Employment Type">
                                    <Select allowClear options={['Full-time', 'Part-time', 'Contractor', 'Intern'].map(t => ({value: t, label: t}))} />
                                </Form.Item></Col>
                                <Col span={12}><Form.Item name={['employmentInfo', 'workLocation']} label="Work Location"><Input /></Form.Item></Col>
                             </Row>
                        </Tabs.TabPane>
                        <Tabs.TabPane tab="Personal Details" key="3">
                            <Row gutter={16}>
                                <Col span={12}><Form.Item name={['personalInfo', 'dateOfBirth']} label="Date of Birth"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
                                <Col span={12}><Form.Item name={['personalInfo', 'gender']} label="Gender"><Select allowClear options={['Male', 'Female', 'Other', 'Prefer not to say'].map(g => ({value: g, label: g}))} /></Form.Item></Col>
                                <Col span={12}><Form.Item name={['personalInfo', 'nationality']} label="Nationality"><Input /></Form.Item></Col>
                                <Col span={12}><Form.Item name={['personalInfo', 'maritalStatus']} label="Marital Status"><Select allowClear options={['Single', 'Married', 'Divorced', 'Widowed'].map(s => ({value: s, label: s}))} /></Form.Item></Col>
                            </Row>
                        </Tabs.TabPane>
                    </Tabs>
                    <Form.Item style={{ marginTop: '24px' }}>
                        <Button type="primary" htmlType="submit" loading={status === 'loading'}>{editingUser ? 'Save Changes' : 'Create User'}</Button>
                    </Form.Item>
                </Form>
            </Modal>
            
            <Modal title={`Apply Checklist to ${targetUser?.name}`} open={isApplyModalVisible} onCancel={handleApplyCancel} footer={null}>
                <Form form={applyForm} layout="vertical" onFinish={onApplyFinish}>
                    <Form.Item name="templateId" label="Select Template" rules={[{ required: true }]}><Select options={templates.map(t => ({ value: t._id, label: t.name }))} /></Form.Item>
                    <Form.Item name="startDate" label="Start Date" rules={[{ required: true }]}><DatePicker /></Form.Item>
                    <Form.Item><Button type="primary" htmlType="submit" loading={status === 'loading'}>Generate Tasks</Button></Form.Item>
                </Form>
            </Modal>
            
            <Modal title={`Assign Leave Policy to ${targetUser?.name}`} open={isLeaveModalVisible} onCancel={handleLeaveCancel} footer={null}>
                <Form form={leaveForm} onFinish={onLeaveAssign}>
                    <Form.Item name="leavePolicyId" label="Select Policy" rules={[{ required: true }]}><Select placeholder="Choose policy" options={policies.map(p => ({ value: p._id, label: `${p.name} (${p.daysPerYear} days/year)` }))} /></Form.Item>
                    <Form.Item name="year" label="For Year" rules={[{ required: true, message: 'Please select the year.' }]}>
                        <DatePicker picker="year" style={{ width: '100%' }} />
                    </Form.Item>
                    <Button type="primary" htmlType="submit">Assign Policy</Button>
                </Form>
            </Modal>

            <Modal title={`Sensitive Data for ${sensitiveDataUser?.name}`} open={isSensitiveDataModalVisible} onCancel={handleSensitiveDataCancel} footer={null} width={600}>
                {isSensitiveDataModalVisible && sensitiveDataUser && (<SensitiveDataForm userId={sensitiveDataUser._id} onFinished={handleSensitiveDataCancel} />)}
            </Modal>
            
            <Modal title={`Checklist Progress for ${targetUser?.name}`} open={isProgressModalVisible} onCancel={handleProgressCancel} footer={null} width={800} destroyOnClose>
                {isProgressModalVisible && targetUser && <UserChecklistProgress userId={targetUser._id} />}
            </Modal>
        </Card>
    );
};

export default AdminUserPage;








// ----------------------definivitive working code ------------------------------

// import React, { useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { Table, Button, Card, Typography, Modal, Form, Input, Select, message, Space, Popconfirm, Tag, Switch, DatePicker } from 'antd';
// import { FileDoneOutlined, DollarCircleOutlined, EditOutlined, DeleteOutlined, UserAddOutlined } from '@ant-design/icons';
// import { fetchAllUsers, createNewUser, updateUser, deactivateUser } from '../features/admin/adminThunks';
// import { fetchAllDepartments } from '../features/department/departmentThunks';
// import { fetchChecklistTemplates, applyChecklistTemplate } from '../features/checklist/checklistThunks';
// import { fetchLeavePolicies, assignPolicyToEmployee } from '../features/leave-policy/leavePolicyThunks';
// import SensitiveDataForm from '../components/admin/SensitiveDataForm';
// import moment from 'moment';
// const { Title } = Typography;
// const { Option } = Select;

// // --- Best Practice: Define the role hierarchy as a constant outside the component ---
// // This provides a single, clear source of truth for role power levels.
// const roleHierarchy = {
//     'super-admin': 3,
//     'hr': 2,
//     'manager': 1,
//     'employee': 0,
// };

// const AdminUserPage = () => {
//     const dispatch = useDispatch();
//     // State
//     const [isEditModalVisible, setIsEditModalVisible] = useState(false);
//     const [isApplyModalVisible, setIsApplyModalVisible] = useState(false);
//     const [isLeaveModalVisible, setIsLeaveModalVisible] = useState(false);
//     const [isSensitiveDataModalVisible, setIsSensitiveDataModalVisible] = useState(false);
//     const [editingUser, setEditingUser] = useState(null);
//     const [targetUser, setTargetUser] = useState(null);
//     const [sensitiveDataUser, setSensitiveDataUser] = useState(null);
//     const [showInactive, setShowInactive] = useState(false);
    
//     // Forms
//     const [form] = Form.useForm();
//     const [applyForm] = Form.useForm();
//     const [leaveForm] = Form.useForm();

//     // Selectors
//     const { users, status } = useSelector((state) => state.admin);
//     const { departments } = useSelector((state) => state.department);
//     const { user: loggedInUser } = useSelector((state) => state.auth);
//     const { templates } = useSelector((state) => state.checklist);
//     const { policies } = useSelector((state) => state.leavePolicy);


//     // Effects

//      useEffect(() => {
//         if (isLeaveModalVisible) {
//             leaveForm.setFieldsValue({
//                 year: moment() // Default the year to the current year
//             });
//         } else {
//             leaveForm.resetFields(); // Reset the form when the modal closes
//         }
//     }, [isLeaveModalVisible, leaveForm]);
    
//     useEffect(() => {
//         dispatch(fetchAllUsers());
//         dispatch(fetchAllDepartments());
//         dispatch(fetchChecklistTemplates());
//         dispatch(fetchLeavePolicies());
//     }, [dispatch]);

//     // --- Handlers are unchanged, as the logic is in the view layer ---
//     const showEditModal = (user = null) => {
//         setEditingUser(user);
//         form.setFieldsValue(user ? { ...user, department: user.department?._id, manager: user.manager?._id } : { role: 'employee', isActive: true });
//         setIsEditModalVisible(true);
//     };
//     const handleEditCancel = () => { setIsEditModalVisible(false); setEditingUser(null); form.resetFields(); };
//     const onEditFinish = (values) => {
//         const action = editingUser ? updateUser({ userId: editingUser._id, userData: values }) : createNewUser(values);
//         dispatch(action).unwrap().then(() => { message.success(`User ${editingUser ? 'updated' : 'created'}!`); handleEditCancel(); }).catch(err => message.error(err));
//     };
//     const showApplyModal = (user) => { setTargetUser(user); setIsApplyModalVisible(true); };
//     const handleApplyCancel = () => { setIsApplyModalVisible(false); applyForm.resetFields(); };
//     const onApplyFinish = (values) => {
//         dispatch(applyChecklistTemplate({ ...values, employeeId: targetUser._id })).unwrap().then(() => { message.success('Checklist applied successfully!'); handleApplyCancel(); }).catch(err => message.error(err));
//     };
//     const showLeaveModal = (user) => { setTargetUser(user); setIsLeaveModalVisible(true); };
//     const handleLeaveCancel = () => { setIsLeaveModalVisible(false); leaveForm.resetFields(); };
//     const onLeaveAssign = (values) => {
//         const payload = {
//             ...values,
//             employeeId: targetUser._id,
//             year: values.year.year()
//         };
//         dispatch(assignPolicyToEmployee(payload))
//             .unwrap()
//             .then(() => { 
//                 message.success('Policy assigned!'); 
//                 handleLeaveCancel(); 
//             })
//             .catch(err => message.error(err));
//     };
//     const showSensitiveDataModal = (user) => { setSensitiveDataUser(user); setIsSensitiveDataModalVisible(true); };
//     const handleSensitiveDataCancel = () => { setIsSensitiveDataModalVisible(false); };
//     const handleDeactivate = (userId) => dispatch(deactivateUser(userId)).unwrap().then(() => message.success('User deactivated!')).catch(err => message.error(err));
//     const handleReactivate = (userId) => dispatch(updateUser({ userId, userData: { isActive: true } })).unwrap().then(() => message.success('User reactivated!')).catch(err => message.error(err));

//     // --- UPDATED: Table columns with conditional rendering for actions ---
//     const columns = [
//         { title: 'Name', dataIndex: 'name', key: 'name', fixed: 'left' },
//         { title: 'Email', dataIndex: 'email', key: 'email' },
//         { title: 'Job Title', dataIndex: 'jobTitle', key: 'jobTitle' },
//         { title: 'Department', dataIndex: ['department', 'name'], key: 'department' },
//         { title: 'Manager', dataIndex: ['manager', 'name'], key: 'manager' },
//         { title: 'Role', dataIndex: 'role', key: 'role', render: role => <Tag>{role?.toUpperCase()}</Tag> },
//         { title: 'Status', dataIndex: 'isActive', key: 'isActive', render: isActive => <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'ACTIVE' : 'INACTIVE'}</Tag> },
//         {
//             title: 'Actions', key: 'actions', fixed: 'right', width: 450,
//             render: (_, record) => {
//                 // Get power levels from our hierarchy object
//                 const loggedInUserLevel = roleHierarchy[loggedInUser?.role] || 0;
//                 const targetUserLevel = roleHierarchy[record.role] || 0;

//                 // The key condition: Can the logged-in user modify the target user?
//                 const canModify = loggedInUserLevel > targetUserLevel;

//                 return (
//                     <Space size="small">
//                         {/* Edit button is only shown if the user has permission */}
//                         {canModify && <Button icon={<EditOutlined />} onClick={() => showEditModal(record)}>Edit</Button>}
                        
//                         {/* These actions are generally safe for admins to perform on anyone below them */}
//                         <Button onClick={() => showLeaveModal(record)}>Leave</Button>
//                         <Button icon={<FileDoneOutlined />} onClick={() => showApplyModal(record)}>Checklist</Button>
                        
//                         {/* Sensitive data remains a super-admin only privilege */}
//                         {loggedInUser?.role === 'super-admin' && <Button icon={<DollarCircleOutlined />} onClick={() => showSensitiveDataModal(record)}>Sensitive Data</Button>}

//                         {/* Conditionally render Deactivate/Reactivate buttons based on hierarchy */}
//                         {record.isActive ? (
//                             canModify && (
//                                 <Popconfirm title="Deactivate this user?" onConfirm={() => handleDeactivate(record._id)}>
//                                     <Button icon={<DeleteOutlined />} danger>Deactivate</Button>
//                                 </Popconfirm>
//                             )
//                         ) : (
//                             canModify && (
//                                 <Button type="primary" onClick={() => handleReactivate(record._id)}>Reactivate</Button>
//                             )
//                         )}
//                     </Space>
//                 );
//             },
//         },
//     ];

//     // --- UPDATED: Filtering logic to also exclude the logged-in user from the table ---
//     const displayUsers = users
//         .filter(user => user._id !== loggedInUser?._id) // Don't show the current user in the list
//         .filter(user => showInactive ? true : user.isActive); // Apply the active/inactive filter

//     return (
//         <Card>
//             <Title level={2}>User Management</Title>
//             <Space style={{ marginBottom: 16 }}>
//                 <Button type="primary" icon={<UserAddOutlined />} onClick={() => showEditModal(null)}>Add New User</Button>
//                 <Switch checked={showInactive} onChange={setShowInactive} checkedChildren="Show Inactive" unCheckedChildren="Show Active" />
//             </Space>
//             {/* --- UPDATED: Use the new 'displayUsers' for the table's data source --- */}
//             <Table columns={columns} dataSource={displayUsers} rowKey="_id" loading={status === 'loading'} scroll={{ x: 1300 }} />

//             {/* --- All Modals are unchanged --- */}
//             <Modal title={editingUser ? 'Edit User' : 'Add New User'} open={isEditModalVisible} onCancel={handleEditCancel} footer={null}>
//                 <Form form={form} layout="vertical" onFinish={onEditFinish}>
//                     {!editingUser && (
//                         <>
//                             <Form.Item name="name" label="Full Name" rules={[{ required: true }]}><Input /></Form.Item>
//                             <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
//                             <Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }]}><Input.Password /></Form.Item>
//                         </>
//                     )}
//                      <Form.Item name="jobTitle" label="Job Title"><Input /></Form.Item>
//                      <Form.Item name="department" label="Department"><Select allowClear showSearch optionFilterProp="children" options={departments.map(d => ({ value: d._id, label: d.name }))} /></Form.Item>
//                      <Form.Item name="manager" label="Assign Manager"><Select allowClear showSearch optionFilterProp="children" options={users.filter(u => u.role !== 'employee').map(m => ({ value: m._id, label: m.name }))} /></Form.Item>
//                      <Form.Item name="role" label="Role" rules={[{ required: true }]}><Select options={[{ value: 'employee', label: 'Employee' }, { value: 'manager', label: 'Manager' }, { value: 'hr', label: 'HR' }, { value: 'super-admin', label: 'Super Admin' }]} /></Form.Item>
//                      <Form.Item><Button type="primary" htmlType="submit" loading={status === 'loading'}>{editingUser ? 'Save Changes' : 'Create User'}</Button></Form.Item>
//                 </Form>
//             </Modal>
//             <Modal title={`Apply Checklist to ${targetUser?.name}`} open={isApplyModalVisible} onCancel={handleApplyCancel} footer={null}>
//                 <Form form={applyForm} layout="vertical" onFinish={onApplyFinish}>
//                     <Form.Item name="templateId" label="Select Template" rules={[{ required: true }]}><Select options={templates.map(t => ({ value: t._id, label: t.name }))} /></Form.Item>
//                     <Form.Item name="startDate" label="Start Date" rules={[{ required: true }]}><DatePicker /></Form.Item>
//                     <Form.Item><Button type="primary" htmlType="submit" loading={status === 'loading'}>Generate Tasks</Button></Form.Item>
//                 </Form>
//             </Modal>
//             <Modal 
//             title={`Assign Leave Policy to ${targetUser?.name}`} 
//             open={isLeaveModalVisible} 
//             onCancel={handleLeaveCancel} 
//             footer={null}
//             >
//                 <Form 
//                 form={leaveForm} 
//                 onFinish={onLeaveAssign}
//                 initialValues={{ year: moment() }}
//                 >
//                     <Form.Item name="leavePolicyId" label="Select Policy" rules={[{ required: true }]}><Select placeholder="Choose policy" options={policies.map(p => ({ value: p._id, label: `${p.name} (${p.daysPerYear} days/year)` }))} /></Form.Item>
//                     <Form.Item 
//                         name="year" 
//                         label="For Year" 
//                         rules={[{ required: true, message: 'Please select the year this policy applies to.' }]}
//                     >
//                         <DatePicker picker="year" style={{ width: '100%' }} />
//                     </Form.Item>
//                     <Button type="primary" htmlType="submit">Assign Policy</Button>
//                 </Form>
//             </Modal>
//             <Modal title={`Sensitive Data for ${sensitiveDataUser?.name}`} open={isSensitiveDataModalVisible} onCancel={handleSensitiveDataCancel} footer={null} width={600}>
//                 {isSensitiveDataModalVisible && sensitiveDataUser && (<SensitiveDataForm userId={sensitiveDataUser._id} onFinished={handleSensitiveDataCancel} />)}
//             </Modal>
//         </Card>
//     );
// };

// export default AdminUserPage;






// import React, { useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { Table, Button, Card, Typography, Modal, Form, Input, Select, message, Space, Popconfirm, Tag, Switch, DatePicker } from 'antd';
// import { FileDoneOutlined, DollarCircleOutlined } from '@ant-design/icons';
// import { fetchAllUsers, createNewUser, updateUser, deactivateUser, fetchAllManagers } from '../features/admin/adminThunks';
// import { fetchAllDepartments } from '../features/department/departmentThunks';
// import { fetchChecklistTemplates, applyChecklistTemplate } from '../features/checklist/checklistThunks';
// import { fetchLeavePolicies, assignPolicyToEmployee } from '../features/leave-policy/leavePolicyThunks';
// import SensitiveDataForm from '../components/admin/SensitiveDataForm';

// const { Title } = Typography;

// const AdminUserPage = () => {
//     const dispatch = useDispatch();
//     const [isEditModalVisible, setIsEditModalVisible] = useState(false);
//     const [isApplyModalVisible, setIsApplyModalVisible] = useState(false);
//     const [isLeaveModalVisible, setIsLeaveModalVisible] = useState(false);
//     const [editingUser, setEditingUser] = useState(null);
//     const [targetUser, setTargetUser] = useState(null);
//     const [showInactive, setShowInactive] = useState(false);

//      const [isSensitiveDataModalVisible, setIsSensitiveDataModalVisible] = useState(false);
//     const [sensitiveDataUser, setSensitiveDataUser] = useState(null);
    
//     const [editForm] = Form.useForm();
//     const [applyForm] = Form.useForm();
//     const [leaveForm] = Form.useForm();

//     const { users, managers, status } = useSelector((state) => state.admin);
//     const { departments } = useSelector((state) => state.department);
//     const { user: loggedInUser } = useSelector((state) => state.auth);
//     const { templates } = useSelector((state) => state.checklist);
//     const { policies } = useSelector((state) => state.leavePolicy);

//     useEffect(() => {
//         dispatch(fetchAllUsers());
//         dispatch(fetchAllDepartments());
//         dispatch(fetchAllManagers());
//         dispatch(fetchChecklistTemplates());
//         dispatch(fetchLeavePolicies());
//     }, [dispatch]);

//     const filteredUsers = showInactive ? users : users.filter(user => user.isActive);

//     const showEditModal = (user = null) => { setEditingUser(user); editForm.setFieldsValue(user ? { ...user, department: user.department?._id, manager: user.manager?._id } : { role: 'employee' }); setIsEditModalVisible(true); };
//     const handleEditCancel = () => { setIsEditModalVisible(false); setEditingUser(null); editForm.resetFields(); };
//     const onEditFinish = (values) => {
//         const userData = { ...values };
//         if (!userData.department) delete userData.department;
//         if (!userData.manager) delete userData.manager;
//         const action = editingUser ? updateUser({ userId: editingUser._id, userData }) : createNewUser(userData);
//         dispatch(action).unwrap().then(() => { message.success(`User ${editingUser ? 'updated' : 'created'}!`); handleEditCancel(); }).catch(err => message.error(err));
//     };

//     const showApplyModal = (user) => { setTargetUser(user); setIsApplyModalVisible(true); };
//     const handleApplyCancel = () => { setIsApplyModalVisible(false); setTargetUser(null); applyForm.resetFields(); };
//     const onApplyFinish = (values) => {
//         const payload = { templateId: values.templateId, targetUserId: targetUser._id, startDate: values.startDate.toISOString() };
//         dispatch(applyChecklistTemplate(payload)).unwrap().then(msg => { message.success(msg); handleApplyCancel(); }).catch(err => message.error(err));
//     };

//     const showLeaveModal = (user) => { setTargetUser(user); setIsLeaveModalVisible(true); };
//      const showSensitiveDataModal = (user) => {
//         setSensitiveDataUser(user);
//         setIsSensitiveDataModalVisible(true);
//     };

//      const handleCancel = () => {
//         setIsSensitiveDataModalVisible(false); // Close the new modal
//         setSensitiveDataUser(null); 
//     };

//     const handleLeaveCancel = () => { setIsLeaveModalVisible(false); setTargetUser(null); leaveForm.resetFields(); };
//     const onLeaveAssign = (values) => {
//         const payload = { ...values, employeeId: targetUser._id, year: new Date().getFullYear() };
//         dispatch(assignPolicyToEmployee(payload)).unwrap().then(() => { message.success('Policy assigned!'); handleLeaveCancel(); }).catch(err => message.error(err));
//     };

//     // --- Action Handlers ---
//     const handleDeactivate = (userId) => {
//         dispatch(deactivateUser(userId))
//             .unwrap()
//             .then(() => message.success('User deactivated successfully!'))
//             .catch((err) => message.error(`Failed to deactivate user: ${err}`));
//     };const handleReactivate = (userId) => {
//         dispatch(updateUser({ userId, userData: { isActive: true } }))
//             .unwrap()
//             .then(() => message.success('User reactivated successfully!'))
//             .catch((err) => message.error(`Failed to reactivate user: ${err}`));
//     };
//     const columns = [
//         { title: 'Name', dataIndex: 'name' },
//         { title: 'Department', dataIndex: ['department', 'name'] },
//         { title: 'Manager', dataIndex: ['manager', 'name'] },
//         { title: 'Role', dataIndex: 'role', render: role => <Tag>{role?.toUpperCase()}</Tag> },
//         { title: 'Status', dataIndex: 'isActive', render: isActive => <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'ACTIVE' : 'INACTIVE'}</Tag> },
//         {
//             title: 'Actions', key: 'actions',
//             render: (_, record) => {
//                 if (loggedInUser?._id === record._id) return <Button type="link" disabled>(Own Account)</Button>;
//                 return (
//                     <Space size="small">
//                         <Button type="link" onClick={() => showEditModal(record)}>Edit</Button>
//                         <Button type="link" onClick={() => showLeaveModal(record)}>Leave</Button>
//                         <Button type="link" icon={<FileDoneOutlined />} onClick={() => showApplyModal(record)}>Checklist</Button>
//                         {loggedInUser?.role === 'super-admin' && (
//                          <Button icon={<DollarCircleOutlined />} onClick={() => showSensitiveDataModal(record)}>Sensitive Data</Button>
//                     )}
//                         {record.isActive ? (
//                             <Popconfirm title="Deactivate this user?" onConfirm={() => handleDeactivate(record._id)}><Button type="link" danger>Deactivate</Button></Popconfirm>
//                         ) : (
//                             <Button type="link" onClick={() => handleReactivate(record._id)}>Reactivate</Button>
//                         )}
//                     </Space>
//                 );
//             },
//         },
//     ];

//     return (
//         <>
//             <Card title={<Title level={3}>User Management</Title>} extra={<Space><Switch checkedChildren="All Users" unCheckedChildren="Active Only" checked={showInactive} onChange={setShowInactive} /><Button type="primary" onClick={() => showEditModal(null)}>Create User</Button></Space>}>
//                 <Table columns={columns} dataSource={filteredUsers} rowKey="_id" loading={status === 'loading'} scroll={{ x: true }} />
//             </Card>

//             <Modal title={editingUser ? 'Edit User' : 'Create New User'} open={isEditModalVisible} onCancel={handleEditCancel} footer={null}>
//                 <Form form={editForm} layout="vertical" onFinish={onEditFinish}>
//                      <Form.Item name="role" label="Role" rules={[{ required: true }]}><Select options={[{ value: 'employee', label: 'Employee' }, { value: 'manager', label: 'Manager' }, { value: 'hr', label: 'HR' }]} /></Form.Item>
//                      <Form.Item name="department" label="Department"><Select allowClear options={departments.map(d => ({ value: d._id, label: d.name }))} /></Form.Item>
//                      <Form.Item name="manager" label="Assign Manager"><Select allowClear options={managers.map(m => ({ value: m._id, label: m.name }))} /></Form.Item>
//                      <Form.Item><Button type="primary" htmlType="submit" loading={status === 'loading'}>{editingUser ? 'Save Changes' : 'Create User'}</Button></Form.Item>
//                 </Form>
//             </Modal>
            
//             <Modal title={`Apply Checklist to ${targetUser?.name}`} open={isApplyModalVisible} onCancel={handleApplyCancel} footer={null}>
//                 <Form form={applyForm} layout="vertical" onFinish={onApplyFinish}>
//                     <Form.Item name="templateId" label="Select Template" rules={[{ required: true }]}><Select options={templates.map(t => ({ value: t._id, label: t.name }))} /></Form.Item>
//                     <Form.Item name="startDate" label="Start Date" rules={[{ required: true }]}><DatePicker /></Form.Item>
//                     <Form.Item><Button type="primary" htmlType="submit" loading={status === 'loading'}>Generate Tasks</Button></Form.Item>
//                 </Form>
//             </Modal>

//             <Modal title={`Assign Leave Policy to ${targetUser?.name}`} open={isLeaveModalVisible} onCancel={handleLeaveCancel} footer={null}>
//                 <Form form={leaveForm} onFinish={onLeaveAssign}>
//                     <Form.Item name="leavePolicyId" label="Select Policy" rules={[{ required: true }]}>
//                         <Select placeholder="Choose policy" options={policies.map(p => ({ value: p._id, label: `${p.name} (${p.daysPerYear} days/year)` }))} />
//                     </Form.Item>
//                     <Button type="primary" htmlType="submit">Assign Policy</Button>
//                 </Form>
//             </Modal>

//              <Modal
//                 title={`Sensitive Data for ${sensitiveDataUser?.name}`}
//                 open={isSensitiveDataModalVisible}
//                 onCancel={handleCancel}
//                 footer={null}
//                 width={600}
//             >
//                 {/* Conditionally render the form to ensure it re-fetches data each time it opens */}
//                 {isSensitiveDataModalVisible && sensitiveDataUser && (
//                     <SensitiveDataForm 
//                         userId={sensitiveDataUser._id} 
//                         onFinished={handleCancel} 
//                     />
//                 )}
//             </Modal>
//         </>
//     );
// };

// export default AdminUserPage;