// In: client/src/components/tasks/AllSystemTasks.js

import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Table, Tag, Button, Modal, Form, Input, Select, DatePicker, message, Row, Col, Checkbox, Avatar, Tooltip } from 'antd';
import { fetchAllTasks, createTask } from '../../features/task/taskThunks';
import { fetchAllUsers } from '../../features/admin/adminThunks';
import { openTaskDetailsModal } from '../../features/task/taskSlice';
import FileUpload from '../FileUpload';
import debounce from 'lodash.debounce';

const { Option } = Select;

const AllSystemTasks = () => {
    const dispatch = useDispatch();
    const [form] = Form.useForm();

    // Modal state for the CREATE modal ONLY
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [showAttachmentUploader, setShowAttachmentUploader] = useState(false);
    const [attachmentData, setAttachmentData] = useState(null);

    // API Control States
    const [pagination, setPagination] = useState({ current: 1, pageSize: 5 });
    const [sorter, setSorter] = useState({ field: 'createdAt', order: 'descend' });
    const [filters, setFilters] = useState({ status: null, priority: null, assignee: null, search: '' });

    // --- CORRECTED: Select the nested state object for allTasks ---
    const { 
        data: allTasks, 
        status, 
        pagination: storePagination 
    } = useSelector((state) => state.task.allTasks);

    const { users: assignableUsers } = useSelector((state) => state.admin);

    const debouncedSearch = useCallback(debounce((value) => setFilters(prev => ({ ...prev, search: value })), 500), []);

    // Data Fetching
    useEffect(() => {
        const fetchParams = {
            page: pagination.current, limit: pagination.pageSize,
            sortBy: sorter.field, order: sorter.order === 'ascend' ? 'asc' : 'desc',
            filters: filters,
        };
        dispatch(fetchAllTasks(fetchParams));
    }, [dispatch, pagination, sorter, filters]);
    
    useEffect(() => { dispatch(fetchAllUsers()); }, [dispatch]);
    
    // Handlers
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
        const taskData = { ...values };
        if (showAttachmentUploader && attachmentData) {
            taskData.attachments = [{ url: attachmentData.url, originalName: attachmentData.name }];
        }
        dispatch(createTask(taskData)).unwrap()
            .then(() => {
                message.success('Task created successfully!');
                handleCreateCancel();
                setFilters(prev => ({...prev})); // Trigger a refresh
            })
            .catch((err) => message.error(err));
    };

    const showDetailsModal = (taskId) => {
        dispatch(openTaskDetailsModal(taskId));
    };

    // Table columns
    const columns = [
        { title: 'Task', dataIndex: 'title', key: 'title', sorter: true, render: (text, record) => <a onClick={() => showDetailsModal(record._id)}>{text}</a> },
        { title: 'Creator', dataIndex: ['creator', 'name'], key: 'creator' },
        { title: 'Assignees', dataIndex: 'assignees', key: 'assignees', render: (assignees) => { if (!Array.isArray(assignees)) return null; return ( <Avatar.Group maxCount={3}> {assignees.map(user => ( <Tooltip title={user.name} key={user._id}> <Avatar src={user.profilePictureUrl}>{user.name.charAt(0)}</Avatar> </Tooltip> ))} </Avatar.Group> ); } },
        { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => <Tag>{status}</Tag> },
        { title: 'Priority', dataIndex: 'priority', key: 'priority' },
        { title: 'Due Date', dataIndex: 'dueDate', key: 'dueDate', sorter: true, render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A' },
    ];

    return (
        <>
            {/* Filter Bar */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} md={6}><Input.Search placeholder="Search tasks..." onChange={(e) => debouncedSearch(e.target.value)} allowClear /></Col>
                <Col xs={24} sm={12} md={5}><Select placeholder="Filter by Status" onChange={(value) => setFilters(prev => ({ ...prev, status: value }))} allowClear style={{ width: '100%' }}><Option value="To Do">To Do</Option><Option value="In Progress">In Progress</Option><Option value="Done">Done</Option></Select></Col>
                <Col xs={24} sm={12} md={5}><Select placeholder="Filter by Priority" onChange={(value) => setFilters(prev => ({ ...prev, priority: value }))} allowClear style={{ width: '100%' }}><Option value="High">High</Option><Option value="Medium">Medium</Option><Option value="Low">Low</Option></Select></Col>
                <Col xs={24} sm={12} md={8}><Select placeholder="Filter by Assignee" onChange={(value) => setFilters(prev => ({ ...prev, assignee: value }))} allowClear showSearch optionFilterProp="children" style={{ width: '100%' }}>{assignableUsers.map(user => (<Option key={user._id} value={user._id}>{user.name}</Option>))}</Select></Col>
            </Row>
            <div style={{ marginBottom: 16, textAlign: 'right' }}><Button type="primary" onClick={showCreateModal}>Create Task</Button></div>
            
            <Table 
                columns={columns} 
                dataSource={allTasks} 
                rowKey="_id" 
                loading={status === 'loading'} 
                onChange={handleTableChange} 
                pagination={{ current: pagination.current, pageSize: pagination.pageSize, total: storePagination.total, showSizeChanger: true }} 
                scroll={{ x: true }} 
            />
            
            {/* Create Task Modal */}
            <Modal title="Create New Task" open={isCreateModalVisible} onCancel={handleCreateCancel} footer={null}>
                <Form form={form} layout="vertical" onFinish={onCreateFinish}>
                    <Form.Item name="title" label="Task Title" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="description" label="Description"><Input.TextArea rows={4} /></Form.Item>
                    <Form.Item name="assignees" label="Assign To" rules={[{ required: true }]}>
                        <Select mode="multiple" placeholder="Select one or more users" showSearch optionFilterProp="children" allowClear>{assignableUsers.map(user => (<Option key={user._id} value={user._id}>{user.name} ({user.role})</Option>))}</Select>
                    </Form.Item>
                    <Form.Item name="dueDate" label="Due Date"><DatePicker /></Form.Item>
                    <Form.Item name="priority" label="Priority" initialValue="Medium"><Select><Option value="High">High</Option><Option value="Medium">Medium</Option><Option value="Low">Low</Option></Select></Form.Item>
                    <Form.Item><Checkbox checked={showAttachmentUploader} onChange={(e) => setShowAttachmentUploader(e.target.checked)}>Add Attachment</Checkbox></Form.Item>
                    {showAttachmentUploader && (<Form.Item label="Upload File"><FileUpload onUploadSuccess={(file) => setAttachmentData(file)} onRemove={() => setAttachmentData(null)}/></Form.Item>)}
                    <Form.Item><Button type="primary" htmlType="submit" loading={status === 'loading'}>Assign Task</Button></Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default AllSystemTasks;