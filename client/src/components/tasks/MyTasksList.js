// In: client/src/components/tasks/MyTasksList.js

import React, { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { List, Spin, Tag, Select, message, Typography, Row, Col, Input, Avatar, Tooltip, Space, Button, Modal, Form } from 'antd';
import { fetchMyTasks, updateTaskStatus, requestTaskReopen } from '../../features/task/taskThunks';
import { openTaskDetailsModal } from '../../features/task/taskSlice';
import debounce from 'lodash.debounce';
import FilterBar from '../common/FilterBar';

const { Text, Link } = Typography;

const MyTasksList = () => {
    const dispatch = useDispatch();
    const [reopenForm] = Form.useForm();

    // --- NEW: State for the re-open request modal ---
    const [isReopenModalVisible, setIsReopenModalVisible] = useState(false);
    const [reopenTaskId, setReopenTaskId] = useState(null);
    const [reopenLoading, setReopenLoading] = useState(false);
    
    // API Control States
    const [pagination, setPagination] = useState({ current: 1, pageSize: 5 });
    const [sorter, setSorter] = useState({ field: 'dueDate', order: 'asc' });
    const [filters, setFilters] = useState({ status: null, priority: null, search: '' });
    
    const { 
        data: myTasks, 
        status, 
        pagination: storePagination 
    } = useSelector((state) => state.task.myTasks);

    const debouncedSearch = useCallback(debounce((value) => {
        setFilters(prev => ({ ...prev, search: value }));
    }, 500), []);

    useEffect(() => {
        const fetchParams = {
            page: pagination.current,
            limit: pagination.pageSize,
            sortBy: sorter.field,
            order: sorter.order,
            filters: filters,
        };
        dispatch(fetchMyTasks(fetchParams));
    }, [dispatch, pagination, sorter, filters]);

    const handleStatusChange = (taskId, newStatus) => {
        dispatch(updateTaskStatus({ taskId, status: newStatus })).unwrap()
            .then(() => message.success('Task status updated!'))
            .catch((err) => message.error(err));
    };

    const handleTaskClick = (taskId) => {
        dispatch(openTaskDetailsModal(taskId));
    };

    // --- NEW: Handlers for the re-open modal ---
    const showReopenModal = (taskId) => {
        setReopenTaskId(taskId);
        setIsReopenModalVisible(true);
    };

    const handleReopenCancel = () => {
        setIsReopenModalVisible(false);
        setReopenTaskId(null);
        reopenForm.resetFields();
    };

    const handleReopenSubmit = (values) => {
        setReopenLoading(true);
        dispatch(requestTaskReopen({ taskId: reopenTaskId, reason: values.reason })).unwrap()
            .then(() => {
                message.success('Re-open request submitted!');
                handleReopenCancel();
            })
            .catch((err) => message.error(err))
            .finally(() => setReopenLoading(false));
    };

    if (status === 'loading' && myTasks.length === 0) return <Spin />;

    return (
        <>
            <FilterBar
                searchPlaceholder="Search my tasks..."
                onSearch={(value) => debouncedSearch(value)}
                onStatusChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                onSortChange={(value) => {
                    const [field, order] = value.split('_'); setSorter({ field, order });
                }}
                statusOptions={[
                    { value: 'To Do', label: 'To Do' },
                    { value: 'In Progress', label: 'In Progress' },
                    { value: 'Done', label: 'Done' },
                ]}
                sortOptions={[
                    { value: 'dueDate_asc', label: 'Due Date (Soonest)' },
                    { value: 'createdAt_desc', label: 'Newest' },
                    { value: 'priority_desc', label: 'Priority' },
                ]}
                defaultSort="dueDate_asc"
            />

            <List
                dataSource={myTasks}
                loading={status === 'loading'}
                locale={{ emptyText: 'You have no tasks matching the current filters. Great job!' }}
                pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    total: storePagination.total,
                    onChange: (page, pageSize) => setPagination({ current: page, pageSize: pageSize }),
                    showSizeChanger: true,
                    pageSizeOptions: ['5', '10', '20'],
                }}
                renderItem={task => (
                    <List.Item>
                        <Row align="middle" style={{ width: '100%' }}>
                            <Col flex="auto">
                                <Link onClick={() => handleTaskClick(task._id)} style={{ fontSize: '16px' }}>{task.title}</Link>
                                <br/>
                                <Space size="small" style={{ marginTop: '4px' }}>
                                    <Text type="secondary">Creator:</Text>
                                    <Tooltip title={task.creator?.name || 'Unknown'}>
                                        <Avatar size="small" src={task.creator?.profilePictureUrl}>{task.creator?.name?.charAt(0)}</Avatar>
                                    </Tooltip>
                                </Space>
                            </Col>
                            <Col flex="250px" style={{ textAlign: 'right' }}>
                                <Space>
                                    <Tag color={task.priority === 'High' ? 'red' : task.priority === 'Medium' ? 'orange' : 'blue'}>{task.priority}</Tag>

                                    {/* --- NEW: Conditional Rendering for Status Control --- */}
                                    {task.status === 'Done' ? (
                                        <Button size="small" onClick={() => showReopenModal(task._id)}>
                                            Request Re-open
                                        </Button>
                                    ) : (
                                       <Select
                                            value={task.status}
                                            style={{ width: 120 }}
                                            onChange={(value) => handleStatusChange(task._id, value)}
                                            options={[
                                                { value: 'To Do', label: 'To Do' },
                                                { value: 'In Progress', label: 'In Progress' },
                                                { value: 'Done', label: 'Done' },
                                            ]}
                                        />
                                    )}
                                </Space>
                                <br/>
                                <Text type="secondary" style={{ marginTop: '4px', display: 'block' }}>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</Text>
                            </Col>
                        </Row>
                    </List.Item>
                )}
            />
            
             {/* --- NEW: Modal for submitting a re-open request --- */}
            <Modal
                title="Request to Re-open Task"
                open={isReopenModalVisible}
                onCancel={handleReopenCancel}
                footer={[
                    <Button key="back" onClick={handleReopenCancel}>Cancel</Button>,
                    <Button key="submit" type="primary" loading={reopenLoading} onClick={() => reopenForm.submit()}>
                        Submit Request
                    </Button>,
                ]}
            >
                <Form form={reopenForm} layout="vertical" onFinish={handleReopenSubmit}>
                    <Form.Item
                        name="reason"
                        label="Reason for Re-opening"
                        rules={[{ required: true, message: 'Please provide a reason.' }]}
                    >
                        <Input.TextArea rows={4} placeholder="Explain why this task needs to be re-opened..." />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default MyTasksList;