// In: client/src/components/tasks/TeamTasks.js

import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Table, Tag, Button, Modal, Form, Input, Select, DatePicker, message, Row, Col, Checkbox, Avatar, Tooltip, Typography, InputNumber, Divider } from 'antd';
import { fetchTeamTasks, createTask } from '../../features/task/taskThunks';
import { fetchMyTeam } from '../../features/manager/managerThunks';
import { fetchCustomFields } from '../../features/customFields/customFieldThunks';
import { openTaskDetailsModal } from '../../features/task/taskSlice';
import FileUpload from '../FileUpload';
import debounce from 'lodash.debounce';
import ViewSwitcher from './ViewSwitcher';
import KanbanBoard from './kanban/KanbanBoard';
import GanttView from './gantt/GanttView';

const { Option } = Select;
const { Title } = Typography;

// Reusable helper for rendering custom field inputs
const renderCustomField = (field) => {
    const commonProps = {
        label: field.name,
        name: ['customFieldValues', field._id], // Nest inside `customFieldValues` object
        rules: [{ required: field.isRequired, message: `Please provide a value for ${field.name}.` }],
    };

    switch (field.fieldType) {
        case 'Text': return <Form.Item {...commonProps}><Input /></Form.Item>;
        case 'Number': return <Form.Item {...commonProps}><InputNumber style={{ width: '100%' }} /></Form.Item>;
        case 'Date': return <Form.Item {...commonProps}><DatePicker style={{ width: '100%' }} /></Form.Item>;
        case 'Select': return <Form.Item {...commonProps}><Select options={field.options.map(o => ({label: o, value: o}))} /></Form.Item>;
        case 'MultiSelect': return <Form.Item {...commonProps}><Select mode="multiple" options={field.options.map(o => ({label: o, value: o}))} /></Form.Item>;
        default: return null;
    }
};

const TeamTasks = () => {
    const dispatch = useDispatch();
    const [form] = Form.useForm();

    const [view, setView] = useState('list');
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [showAttachmentUploader, setShowAttachmentUploader] = useState(false);
    const [attachmentData, setAttachmentData] = useState(null);

    const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
    const [sorter, setSorter] = useState({ field: 'createdAt', order: 'descend' });
    const [filters, setFilters] = useState({ status: null, priority: null, assignee: null, search: '' });

    const { data: teamTasks, status, pagination: storePagination } = useSelector((state) => state.task.teamTasks);
    const { myTeam } = useSelector((state) => state.manager);
    const { fields: customFieldDefs } = useSelector(state => state.customFields);

    const debouncedSearch = useCallback(debounce((value) => setFilters(prev => ({ ...prev, search: value })), 500), []);

    useEffect(() => {
        const fetchParams = {
            page: view === 'list' ? pagination.current : 1,
            limit: view === 'list' ? pagination.pageSize : 1000,
            sortBy: sorter.field,
            order: sorter.order === 'ascend' ? 'asc' : 'desc',
            filters: filters,
        };
        dispatch(fetchTeamTasks(fetchParams));
    }, [dispatch, pagination, sorter, filters, view]);
    
    useEffect(() => {
        dispatch(fetchMyTeam());
        dispatch(fetchCustomFields('Task')); // Fetch custom fields for the create modal
    }, [dispatch]);

    const handleTableChange = (pagination, tableFilters, sorter) => {
        setPagination(pagination);
        setSorter({ field: sorter.field || 'createdAt', order: sorter.order || 'descend' });
    };

    const showCreateModal = () => setIsCreateModalVisible(true);
    const handleCreateCancel = () => {
        setIsCreateModalVisible(false);
        setShowAttachmentUploader(false);
        setAttachmentData(null);
        form.resetFields();
    };

    const onCreateFinish = (values) => {
        const { customFieldValues, ...coreValues } = values;
        
        const formattedCustomValues = customFieldValues 
            ? Object.entries(customFieldValues).map(([fieldId, value]) => ({
                field: fieldId,
                value: value,
            }))
            : [];

        const taskData = { ...coreValues, customFieldValues: formattedCustomValues };
        
        if (showAttachmentUploader && attachmentData) {
            taskData.attachments = [{ url: attachmentData.url, originalName: attachmentData.name }];
        }
        
        dispatch(createTask(taskData)).unwrap()
            .then(() => {
                message.success('Task created successfully!');
                handleCreateCancel();
                setFilters(prev => ({...prev}));
            })
            .catch((err) => message.error(err));
    };

    const showDetailsModal = (taskId) => {
        dispatch(openTaskDetailsModal(taskId));
    };

    const columns = [
        { title: 'Task', dataIndex: 'title', key: 'title', sorter: true, render: (text, record) => <a onClick={() => showDetailsModal(record._id)}>{text}</a> },
        { title: 'Assignees', dataIndex: 'assignees', key: 'assignees', render: (assignees) => { if (!Array.isArray(assignees)) return null; return ( <Avatar.Group maxCount={3}> {assignees.map(user => ( <Tooltip title={user.name} key={user._id}> <Avatar src={user.profilePictureUrl}>{user.name.charAt(0)}</Avatar> </Tooltip> ))} </Avatar.Group> ); } },
        { title: 'Due Date', dataIndex: 'dueDate', key: 'dueDate', sorter: true, render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A' },
        { title: 'Priority', dataIndex: 'priority', render: (priority) => <Tag>{priority}</Tag> },
        { title: 'Status', dataIndex: 'status', render: (status) => <Tag>{status}</Tag> },
    ];

    const renderCurrentView = () => {
        if (view === 'gantt') { return <GanttView tasks={teamTasks} />; }
        if (view === 'board') { return ( <div style={{ height: 'calc(100vh - 340px)', overflowX: 'auto', overflowY: 'hidden', padding: '8px 0', border: '1px solid #f0f0f0', borderRadius: '8px' }}><KanbanBoard tasks={teamTasks} isLoading={status === 'loading'}/></div> ); }
        return ( <Table columns={columns} dataSource={teamTasks} rowKey="_id" loading={status === 'loading'} onChange={handleTableChange} pagination={{ current: pagination.current, pageSize: pagination.pageSize, total: storePagination.total, showSizeChanger: true }} scroll={{ x: true }} /> );
    };

    return (
        <>
            <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
                <Col><Title level={4} style={{ margin: 0 }}>Team Tasks</Title></Col>
                <Col><ViewSwitcher currentView={view} onViewChange={(v) => setView(v)} /></Col>
            </Row>

            {view !== 'gantt' && (
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={12} md={6}><Input.Search placeholder="Search tasks..." onChange={(e) => debouncedSearch(e.target.value)} allowClear /></Col>
                    <Col xs={24} sm={12} md={5}><Select placeholder="Filter by Status" onChange={(value) => setFilters(prev => ({ ...prev, status: value }))} allowClear style={{ width: '100%' }}><Option value="To Do">To Do</Option><Option value="In Progress">In Progress</Option><Option value="Done">Done</Option></Select></Col>
                    <Col xs={24} sm={12} md={5}><Select placeholder="Filter by Priority" onChange={(value) => setFilters(prev => ({ ...prev, priority: value }))} allowClear style={{ width: '100%' }}><Option value="High">High</Option><Option value="Medium">Medium</Option><Option value="Low">Low</Option></Select></Col>
                    <Col xs={24} sm={12} md={8}><Select placeholder="Filter by Team Member" onChange={(value) => setFilters(prev => ({ ...prev, assignee: value }))} allowClear showSearch optionFilterProp="children" style={{ width: '100%' }}>{myTeam.map(member => (<Option key={member._id} value={member._id}>{member.name}</Option>))}</Select></Col>
                </Row>
            )}
            
            <div style={{ marginBottom: 16, textAlign: 'right' }}>
                <Button type="primary" onClick={showCreateModal}>Create Task</Button>
            </div>
            
            {renderCurrentView()}

            <Modal title="Create New Task for Team" open={isCreateModalVisible} onCancel={handleCreateCancel} footer={null}>
                <Form form={form} layout="vertical" onFinish={onCreateFinish}>
                    <Row gutter={16}>
                        <Col span={16}><Form.Item name="title" label="Task Title" rules={[{ required: true }]}><Input /></Form.Item></Col>
                        <Col span={8}><Form.Item name="timeEstimate" label="Estimate (hours)"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
                    </Row>
                    <Form.Item name="description" label="Description"><Input.TextArea rows={2} /></Form.Item>
                    <Form.Item name="assignees" label="Assign To" rules={[{ required: true }]}>
                        <Select mode="multiple" placeholder="Select one or more team members" showSearch optionFilterProp="children" allowClear>{myTeam.map(member => (<Option key={member._id} value={member._id}>{member.name}</Option>))}</Select>
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="dueDate" label="Due Date"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
                        <Col span={12}><Form.Item name="priority" label="Priority" initialValue="Medium"><Select><Option value="High">High</Option><Option value="Medium">Medium</Option><Option value="Low">Low</Option></Select></Form.Item></Col>
                    </Row>
                    
                    {customFieldDefs.length > 0 && <Divider>Custom Details</Divider>}
                    
                    {customFieldDefs.map(field => (
                        <React.Fragment key={field._id}>
                            {renderCustomField(field)}
                        </React.Fragment>
                    ))}

                    <Form.Item><Checkbox checked={showAttachmentUploader} onChange={(e) => setShowAttachmentUploader(e.target.checked)}>Add Attachment</Checkbox></Form.Item>
                    {showAttachmentUploader && (<Form.Item label="Upload File"><FileUpload onUploadSuccess={(file) => setAttachmentData(file)} onRemove={() => setAttachmentData(null)}/></Form.Item>)}
                    <Form.Item><Button type="primary" htmlType="submit" loading={status === 'loading'}>Assign Task</Button></Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default TeamTasks;






// ------------------- reserved file ----------------------------


// // In: client/src/components/tasks/TeamTasks.js

// import React, { useEffect, useState, useCallback } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { Table, Tag, Button, Modal, Form, Input, Select, DatePicker, message, Row, Col, Checkbox, Avatar, Tooltip } from 'antd';
// import { fetchTeamTasks, createTask } from '../../features/task/taskThunks';
// import { fetchMyTeam } from '../../features/manager/managerThunks';
// import { openTaskDetailsModal } from '../../features/task/taskSlice';
// import FileUpload from '../FileUpload';
// import debounce from 'lodash.debounce';

// const { Option } = Select;

// const TeamTasks = () => {
//     const dispatch = useDispatch();
//     const [form] = Form.useForm();

//     const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
//     const [showAttachmentUploader, setShowAttachmentUploader] = useState(false);
//     const [attachmentData, setAttachmentData] = useState(null);

//     const [pagination, setPagination] = useState({ current: 1, pageSize: 5 });
//     const [sorter, setSorter] = useState({ field: 'createdAt', order: 'descend' });
//     const [filters, setFilters] = useState({ status: null, priority: null, assignee: null, search: '' });

//     // --- CORRECTED: Select the nested state object for teamTasks ---
//     const { 
//         data: teamTasks, 
//         status, 
//         pagination: storePagination 
//     } = useSelector((state) => state.task.teamTasks);

//     const { myTeam } = useSelector((state) => state.manager);

//     const debouncedSearch = useCallback(debounce((value) => setFilters(prev => ({ ...prev, search: value })), 500), []);

//     useEffect(() => {
//         const fetchParams = {
//             page: pagination.current, limit: pagination.pageSize,
//             sortBy: sorter.field, order: sorter.order === 'ascend' ? 'asc' : 'desc',
//             filters: filters,
//         };
//         dispatch(fetchTeamTasks(fetchParams));
//     }, [dispatch, pagination, sorter, filters]);
    
//     useEffect(() => { dispatch(fetchMyTeam()); }, [dispatch]);

//     const handleTableChange = (pagination, tableFilters, sorter) => {
//         setPagination(pagination);
//         setSorter({ field: sorter.field || 'createdAt', order: sorter.order || 'descend' });
//     };

//     const showCreateModal = () => setIsCreateModalVisible(true);
//     const handleCreateCancel = () => {
//         setIsCreateModalVisible(false);
//         setShowAttachmentUploader(false);
//         setAttachmentData(null);
//         form.resetFields();
//     };
//     const onCreateFinish = (values) => {
//         const taskData = { ...values };
//         if (showAttachmentUploader && attachmentData) {
//             taskData.attachments = [{ url: attachmentData.url, originalName: attachmentData.name }];
//         }
//         dispatch(createTask(taskData)).unwrap()
//             .then(() => {
//                 message.success('Task created successfully!');
//                 handleCreateCancel();
//                 setFilters(prev => ({...prev}));
//             })
//             .catch((err) => message.error(err));
//     };

//     const showDetailsModal = (taskId) => {
//         dispatch(openTaskDetailsModal(taskId));
//     };

//     const columns = [
//         { title: 'Task', dataIndex: 'title', key: 'title', sorter: true, render: (text, record) => <a onClick={() => showDetailsModal(record._id)}>{text}</a> },
//         { title: 'Assignees', dataIndex: 'assignees', key: 'assignees', render: (assignees) => { if (!Array.isArray(assignees)) return null; return ( <Avatar.Group maxCount={3}> {assignees.map(user => ( <Tooltip title={user.name} key={user._id}> <Avatar src={user.profilePictureUrl}>{user.name.charAt(0)}</Avatar> </Tooltip> ))} </Avatar.Group> ); } },
//         { title: 'Due Date', dataIndex: 'dueDate', key: 'dueDate', sorter: true, render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A' },
//         { title: 'Priority', dataIndex: 'priority', render: (priority) => <Tag>{priority}</Tag> },
//         { title: 'Status', dataIndex: 'status', render: (status) => <Tag>{status}</Tag> },
//     ];

//     return (
//         <>
//             <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
//                 <Col xs={24} sm={12} md={6}><Input.Search placeholder="Search tasks..." onChange={(e) => debouncedSearch(e.target.value)} allowClear /></Col>
//                 <Col xs={24} sm={12} md={5}><Select placeholder="Filter by Status" onChange={(value) => setFilters(prev => ({ ...prev, status: value }))} allowClear style={{ width: '100%' }}><Option value="To Do">To Do</Option><Option value="In Progress">In Progress</Option><Option value="Done">Done</Option></Select></Col>
//                 <Col xs={24} sm={12} md={5}><Select placeholder="Filter by Priority" onChange={(value) => setFilters(prev => ({ ...prev, priority: value }))} allowClear style={{ width: '100%' }}><Option value="High">High</Option><Option value="Medium">Medium</Option><Option value="Low">Low</Option></Select></Col>
//                 <Col xs={24} sm={12} md={8}><Select placeholder="Filter by Team Member" onChange={(value) => setFilters(prev => ({ ...prev, assignee: value }))} allowClear showSearch optionFilterProp="children" style={{ width: '100%' }}>{myTeam.map(member => (<Option key={member._id} value={member._id}>{member.name}</Option>))}</Select></Col>
//             </Row>
//             <div style={{ marginBottom: 16, textAlign: 'right' }}><Button type="primary" onClick={showCreateModal}>Create Task</Button></div>
            
//             <Table columns={columns} dataSource={teamTasks} rowKey="_id" loading={status === 'loading'} onChange={handleTableChange} pagination={{ current: pagination.current, pageSize: pagination.pageSize, total: storePagination.total, showSizeChanger: true }} scroll={{ x: true }} />

//             <Modal title="Create New Task for Team" open={isCreateModalVisible} onCancel={handleCreateCancel} footer={null}>
//                 <Form form={form} layout="vertical" onFinish={onCreateFinish}>
//                     <Form.Item name="title" label="Task Title" rules={[{ required: true }]}><Input /></Form.Item>
//                     <Form.Item name="description" label="Description"><Input.TextArea rows={4} /></Form.Item>
//                     <Form.Item name="assignees" label="Assign To" rules={[{ required: true }]}>
//                         <Select mode="multiple" placeholder="Select one or more team members" showSearch optionFilterProp="children" allowClear>{myTeam.map(member => (<Option key={member._id} value={member._id}>{member.name}</Option>))}</Select>
//                     </Form.Item>
//                     <Form.Item name="dueDate" label="Due Date"><DatePicker /></Form.Item>
//                     <Form.Item name="priority" label="Priority" initialValue="Medium"><Select><Option value="High">High</Option><Option value="Medium">Medium</Option><Option value="Low">Low</Option></Select></Form.Item>
//                     <Form.Item><Checkbox checked={showAttachmentUploader} onChange={(e) => setShowAttachmentUploader(e.target.checked)}>Add Attachment</Checkbox></Form.Item>
//                     {showAttachmentUploader && (<Form.Item label="Upload File"><FileUpload onUploadSuccess={(file) => setAttachmentData(file)} onRemove={() => setAttachmentData(null)}/></Form.Item>)}
//                     <Form.Item><Button type="primary" htmlType="submit" loading={status === 'loading'}>Assign Task</Button></Form.Item>
//                 </Form>
//             </Modal>
//         </>
//     );
// };

// export default TeamTasks;




// In: client/src/components/tasks/TeamTasks.js