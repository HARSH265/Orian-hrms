import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal, Typography, List, Avatar, Form, Input, InputNumber, DatePicker, Button, message, Tag, Spin, Empty, Popover, Select, Space, Tabs, Descriptions, Divider, Tooltip, Row, Col, Popconfirm, Progress } from 'antd';
import { 
    fetchTaskById, 
    addCommentToTask, 
    createSubTask, 
    updateTaskStatus, 
    addAttachmentToTask, 
    updateTaskDependencies, 
    fetchAllTasks,
    resolveTaskReopen,
    logTimeToTask,
    toggleTaskSubscription,
    updateTask 
} from '../../features/task/taskThunks';
import { fetchCustomFields } from '../../features/customFields/customFieldThunks';
import FileUpload from '../FileUpload';
import { 
    UserOutlined, CalendarOutlined, FlagOutlined, TeamOutlined, PaperClipOutlined, 
    CommentOutlined, ApartmentOutlined, UnorderedListOutlined, CheckCircleOutlined, 
    LinkOutlined, HistoryOutlined,ClockCircleOutlined, EyeOutlined, EyeInvisibleOutlined, AppstoreAddOutlined
} from '@ant-design/icons';
import debounce from 'lodash.debounce';
import dayjs from 'dayjs';
import CustomFieldInput from '../common/CustomFieldInput';

const { Title, Text, Paragraph, Link } = Typography;
const { Option } = Select;

// Reusable helper for rendering custom field inputs using shared component
const renderCustomFieldInput = (field) => {
    const commonProps = {
        label: field.name,
        name: ['customFieldValues', field._id],
        rules: [{ required: field.isRequired, message: `Please input a value for ${field.name}.` }],
    };

    return <Form.Item {...commonProps}><CustomFieldInput field={field} /></Form.Item>;
};

const TaskDetailsModal = ({ open, onCancel, taskId }) => {
    const dispatch = useDispatch();
    const [detailsForm] = Form.useForm();
    const [commentForm] = Form.useForm();
    const [subTaskForm] = Form.useForm();
    const [timeLogForm] = Form.useForm();
    
    const [isSubTaskPopoverVisible, setSubTaskPopoverVisible] = useState(false);
    const [searchingTasks, setSearchingTasks] = useState(false);
    const [searchOptions, setSearchOptions] = useState([]);

    const { selectedTaskDetails: task, selectedTaskStatus: status, error } = useSelector((state) => state.task);
    const { user: loggedInUser } = useSelector((state) => state.auth);
    const { fields: customFieldDefs } = useSelector(state => state.customFields);

    useEffect(() => {
        if (open && taskId) {
            dispatch(fetchTaskById(taskId));
            dispatch(fetchCustomFields('Task'));
        }
    }, [open, taskId, dispatch]);

    useEffect(() => {
        if (task && customFieldDefs.length > 0) {
            const customValuesForForm = task.customFieldValues.reduce((acc, curr) => {
                // Ensure curr.field exists before trying to access _id
                if (curr.field && curr.field._id) {
                    acc[curr.field._id] = curr.value;
                }
                return acc;
            }, {});
            detailsForm.setFieldsValue({
                ...task,
                customFieldValues: customValuesForForm,
            });
        }
    }, [task, customFieldDefs, detailsForm]);

    const debouncedSearchTasks = useMemo(() => debounce((searchValue) => {
        if (searchValue) {
            setSearchingTasks(true);
            dispatch(fetchAllTasks({ page: 1, limit: 20, sortBy: 'title', order: 'asc', filters: { search: searchValue } }))
                .unwrap()
                .then((result) => {
                    if (task?.dependsOn) {
                        const existingIds = task.dependsOn.map(t => t._id);
                        const filteredOptions = result.data.filter(t => t._id !== taskId && !existingIds.includes(t._id));
                        setSearchOptions(filteredOptions);
                    }
                })
                .finally(() => setSearchingTasks(false));
        } else { setSearchOptions([]); }
    }, 500), [dispatch, taskId, task?.dependsOn]);

    const handleMainStatusChange = (newStatus) => {
        dispatch(updateTaskStatus({ taskId, status: newStatus })).unwrap()
            .then(() => message.success('Task status updated!'))
            .catch(err => message.error(err.message || err));
    };

    const onCommentSubmit = (values) => {
        dispatch(addCommentToTask({ taskId, text: values.commentText })).unwrap()
            .then(() => { message.success('Comment added!'); commentForm.resetFields(); })
            .catch((err) => message.error(err));
    };

    const handleAttachmentUpload = (fileInfo) => {
        dispatch(addAttachmentToTask({ taskId, url: fileInfo.url, originalName: fileInfo.name }))
            .unwrap()
            .then(() => message.success('File attached!'))
            .catch((err) => message.error(err));
    };

    const handleSubTaskSubmit = (values) => {
        const subTaskData = { title: values.subTaskTitle, assignees: values.subTaskAssignees };
        dispatch(createSubTask({ parentId: taskId, subTaskData })).unwrap()
            .then(() => { message.success('Sub-task created!'); subTaskForm.resetFields(); setSubTaskPopoverVisible(false); })
            .catch(err => message.error(err));
    };
    
    const handleSubTaskStatusChange = (subTaskId, newStatus) => {
        dispatch(updateTaskStatus({ taskId: subTaskId, status: newStatus })).unwrap()
            .then(() => { message.success('Sub-task status updated!'); dispatch(fetchTaskById(taskId)); })
            .catch(err => message.error(err));
    };

    const handleDependencyChange = (newDependencyIds) => {
        dispatch(updateTaskDependencies({ taskId, dependsOn: newDependencyIds })).unwrap()
            .then(() => message.success('Dependencies updated successfully.'))
            .catch((err) => message.error(err));
    };

    const handleResolveRequest = (requestId, status) => {
        dispatch(resolveTaskReopen({ requestId, status })).unwrap()
            .then((res) => message.success(res.message))
            .catch(err => message.error(err));
    };
    
    const handleToggleSubscription = () => {
        dispatch(toggleTaskSubscription(taskId)).unwrap()
            .then((payload) => message.success(payload.message))
            .catch(err => message.error(err));
    };

    const handleDetailsSave = (values) => {
        const { customFieldValues, ...coreValues } = values;
        const formattedCustomValues = customFieldValues 
            ? Object.entries(customFieldValues).map(([fieldId, value]) => ({
                field: fieldId,
                value: value,
            })).filter(item => item.value !== undefined && item.value !== null)
            : [];
        
        const taskData = { ...coreValues, customFieldValues: formattedCustomValues };
        
        dispatch(updateTask({ taskId, taskData })).unwrap()
            .then(() => message.success('Task details updated!'))
            .catch(err => message.error(err));
    };

    const handleTimeLogSubmit = (values) => {
        dispatch(logTimeToTask({ taskId, timeLogData: values })).unwrap()
            .then(() => {
                message.success('Time logged successfully!');
                timeLogForm.resetFields({ date: dayjs() }); // Reset form but keep today's date
            })
            .catch(err => message.error(err));
    };

    const renderContent = () => {
        if (status === 'loading' || !task) { return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>; }
        if (status === 'failed') { return <Empty description={<><strong>Could not load task details.</strong><br/>{error}</>} />; }
        if (status === 'succeeded' && !task) { return <Empty description="This task could not be found." />; }

        const isSubscribed = task.subscribers?.some(sub => sub._id === loggedInUser?._id);
        const renderSubTasksTab = () => (
            <>
                <List dataSource={task.subTasks || []} renderItem={sub => (
                    <List.Item actions={[<Select size="small" value={sub.status} style={{ width: 120 }} onChange={(val) => handleSubTaskStatusChange(sub._id, val)}><Option value="To Do">To Do</Option><Option value="In Progress">In Progress</Option><Option value="Blocked">Blocked</Option><Option value="Done">Done</Option></Select>]}>
                        <List.Item.Meta title={<Text>{sub.title}</Text>} description={<>Assigned to: {sub.assignees.map(a => a.name).join(', ')}</>} />
                    </List.Item> )}
                    locale={{ emptyText: "No sub-tasks have been created."}}
                />
                <Popover content={<Form form={subTaskForm} onFinish={handleSubTaskSubmit} style={{width: 300}}><Form.Item name="subTaskTitle" rules={[{ required: true }]}><Input placeholder="New sub-task title" /></Form.Item><Form.Item name="subTaskAssignees" rules={[{ required: true }]}><Select mode="multiple" placeholder="Assign to..." options={task.assignees.map(a => ({label: a.name, value: a._id}))} /></Form.Item><Button type="primary" htmlType="submit">Add Sub-task</Button></Form>} title="Create a New Sub-task" trigger="click" open={isSubTaskPopoverVisible} onOpenChange={setSubTaskPopoverVisible}>
                    <Button type="dashed" icon={<ApartmentOutlined />} style={{marginTop: '16px'}}>Add Sub-task</Button>
                </Popover>
            </>
        );

        const renderDependenciesTab = () => (
            <Row gutter={32}>
                <Col xs={24} md={12}>
                    <Title level={5}>Blocking (This task is waiting for)</Title>
                    <Select mode="multiple" placeholder="Link to tasks that must be finished first" value={task.dependsOn.map(t => t._id)} onChange={handleDependencyChange} onSearch={debouncedSearchTasks} loading={searchingTasks} filterOption={false} style={{ width: '100%' }} notFoundContent={searchingTasks ? <Spin size="small" /> : null}>
                        {task.dependsOn.map(dep => <Option key={dep._id} value={dep._id}>{dep.title}</Option>)}
                        {searchOptions.map(opt => <Option key={opt._id} value={opt._id}>{opt.title}</Option>)}
                    </Select>
                </Col>
                <Col xs={24} md={12}>
                    <Title level={5}>Blocked By (Tasks waiting for this one)</Title>
                    <List dataSource={task.blocking || []} renderItem={item => <List.Item><Link>{item.title}</Link></List.Item>} locale={{emptyText: "No tasks are blocked by this one."}} />
                </Col>
            </Row>
        );

        const renderAttachmentsTab = () => (
            <>
                <List dataSource={task.attachments || []} renderItem={att => ( <List.Item> <Link href={att.fileUrl} target="_blank"><PaperClipOutlined /> {att.title}</Link> </List.Item> )} locale={{ emptyText: "No files have been attached."}} />
                <div style={{ marginTop: '16px' }}><FileUpload onUploadSuccess={handleAttachmentUpload} /></div>
            </>
        );

        const renderCommentsTab = () => (
            <>
                <List dataSource={task.comments || []} renderItem={comment => ( <List.Item> <List.Item.Meta avatar={<Avatar src={comment.author?.profilePictureUrl}>{comment.author?.name?.charAt(0)}</Avatar>} title={comment.author?.name || "Unknown User"} description={<Paragraph style={{whiteSpace: 'pre-wrap'}}>{comment.text}</Paragraph>} /> <Text type="secondary">{new Date(comment.createdAt).toLocaleString()}</Text> </List.Item> )} locale={{ emptyText: "No comments yet. Start the conversation!" }} />
                <Form form={commentForm} onFinish={onCommentSubmit} style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                    <Form.Item name="commentText" rules={[{ required: true, message: "Comment cannot be empty" }]} style={{flex: 1}}><Input.TextArea rows={1} placeholder="Add a comment..." autoSize /></Form.Item>
                    <Form.Item><Button htmlType="submit" type="primary">Post</Button></Form.Item>
                </Form>
            </>
        );

        const renderRequestsTab = () => (
            <List
                dataSource={task.reopenRequests || []}
                renderItem={req => {
                    const isCreator = loggedInUser?._id === task.creator._id;
                    const canResolve = isCreator && req.status === 'Pending';
                    return (
                        <List.Item>
                            <List.Item.Meta
                                avatar={<Avatar src={req.requestedBy?.profilePictureUrl}>{req.requestedBy?.name?.charAt(0)}</Avatar>}
                                title={<>{req.requestedBy?.name} requested to re-open <Text type="secondary" style={{fontWeight: 400}}>on {new Date(req.createdAt).toLocaleDateString()}</Text></>}
                                description={<Paragraph><strong>Reason:</strong> {req.reason}</Paragraph>}
                            />
                            <Space>
                                <Tag>{req.status}</Tag>
                                {canResolve && (
                                    <>
                                        <Popconfirm title="Are you sure you want to approve this request?" onConfirm={() => handleResolveRequest(req._id, 'Approved')}>
                                            <Button size="small" type="primary">Approve</Button>
                                        </Popconfirm>
                                        <Popconfirm title="Are you sure you want to reject this request?" onConfirm={() => handleResolveRequest(req._id, 'Rejected')}>
                                            <Button size="small" danger>Reject</Button>
                                        </Popconfirm>
                                    </>
                                )}
                            </Space>
                        </List.Item>
                    );
                }}
                locale={{ emptyText: "No re-open requests have been made for this task."}}
            />
        );

        const renderTimeTrackingTab = () => {
            const timeSpent = task.totalTimeSpent || 0;
            const timeEstimate = task.timeEstimate || 0;
            const progressPercent = timeEstimate > 0 ? Math.round((timeSpent / timeEstimate) * 100) : 0;
            
            return (
                <Row gutter={32}>
                    <Col xs={24} md={10}>
                        <Title level={5}>Log Work</Title>
                        <Form form={timeLogForm} layout="vertical" onFinish={handleTimeLogSubmit}>
                            <Form.Item name="timeSpent" label="Time Spent (hours)" rules={[{ required: true }]}>
                                <InputNumber min={0.1} step={0.5} style={{width: '100%'}} />
                            </Form.Item>
                            <Form.Item name="date" label="Date" initialValue={dayjs()} rules={[{ required: true }]}>
                                <DatePicker style={{width: '100%'}} />
                            </Form.Item>
                            <Form.Item name="notes" label="Notes (Optional)">
                                <Input.TextArea rows={2} />
                            </Form.Item>
                            <Form.Item>
                                <Button type="primary" htmlType="submit">Log Time</Button>
                            </Form.Item>
                        </Form>
                    </Col>
                    <Col xs={24} md={14}>
                        <Title level={5}>Progress</Title>
                        <Space direction="vertical" style={{width: '100%'}}>
                            <Progress percent={progressPercent} />
                            <Text type="secondary">{`${timeSpent}h logged of ${timeEstimate}h estimated`}</Text>
                        </Space>

                        <Divider />
                        <Title level={5}>Work Log</Title>
                        <List
                            dataSource={task.timeLogs || []}
                            renderItem={log => (
                                <List.Item>
                                    <List.Item.Meta
                                        avatar={<Avatar>{log.user?.name?.charAt(0)}</Avatar>}
                                        title={<>{log.user?.name} logged <strong>{log.timeSpent}h</strong></>}
                                        description={log.notes}
                                    />
                                    <Text type="secondary">{new Date(log.date).toLocaleDateString()}</Text>
                                </List.Item>
                            )}
                            locale={{emptyText: "No time has been logged for this task."}}
                        />
                    </Col>
                </Row>
            );
        };

         const renderCustomDetailsTab = () => (
            <Form form={detailsForm} layout="vertical" onFinish={handleDetailsSave}>
                {customFieldDefs.map((field) => (
                    <React.Fragment key={field._id}>
                        {renderCustomFieldInput(field)}
                    </React.Fragment>
                ))}
                {customFieldDefs.length > 0 && (
                    <Form.Item>
                        <Button type="primary" htmlType="submit">Save Custom Details</Button>
                    </Form.Item>
                )}
                {customFieldDefs.length === 0 && (
                    <Empty description="No custom fields have been configured for tasks." />
                )}
            </Form>
        );

        const tabItems = [
            { label: <span><UnorderedListOutlined /> Description</span>, key: '1', children: <Paragraph style={{whiteSpace: 'pre-wrap'}}>{task.description || <Text type="secondary">No description.</Text>}</Paragraph> },
            { label: <span><ApartmentOutlined /> Sub-tasks ({task.subTasks?.length || 0})</span>, key: '2', children: renderSubTasksTab() },
            { label: <span><LinkOutlined /> Dependencies</span>, key: '3', children: renderDependenciesTab() },
            { label: <span><ClockCircleOutlined /> Time ({task.totalTimeSpent || 0}h)</span>, key: '4', children: renderTimeTrackingTab() },
            { label: <span><PaperClipOutlined /> Attachments ({task.attachments?.length || 0})</span>, key: '5', children: renderAttachmentsTab() },
            { label: <span><CommentOutlined /> Comments ({task.comments?.length || 0})</span>, key: '6', children: renderCommentsTab() },
            { label: <span><HistoryOutlined /> Requests ({task.reopenRequests?.length || 0})</span>, key: '7', children: renderRequestsTab() },
            { label: <span><AppstoreAddOutlined /> Custom Details</span>, key: '8', children: renderCustomDetailsTab()},
        ];

        return (
            <div>
                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <Space align="center">
                        <Title level={4} style={{ margin: 0, paddingRight: '16px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</Title>
                        <Tooltip title={isSubscribed ? "Unwatch this task" : "Watch this task"}><Button type={isSubscribed ? "primary" : "default"} shape="circle" icon={isSubscribed ? <EyeInvisibleOutlined /> : <EyeOutlined />} onClick={handleToggleSubscription} /></Tooltip>
                    </Space>
                </div>
                
                <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
                    <Descriptions.Item label={<><TeamOutlined /> Assignees</>}><Avatar.Group maxCount={5}>{task.assignees.map(a => (<Tooltip title={a.name} key={a._id}><Avatar src={a.profilePictureUrl}>{a.name.charAt(0)}</Avatar></Tooltip>))}</Avatar.Group></Descriptions.Item>
                    <Descriptions.Item label={<><UserOutlined /> Creator</>}><Space><Avatar size="small" src={task.creator?.profilePictureUrl}>{task.creator?.name?.charAt(0)}</Avatar><Text>{task.creator?.name}</Text></Space></Descriptions.Item>
                    <Descriptions.Item label={<><CalendarOutlined /> Due Date</>}><Text>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</Text></Descriptions.Item>
                    <Descriptions.Item label={<><FlagOutlined /> Priority</>}><Tag color={task.priority === 'High' ? 'red' : task.priority === 'Medium' ? 'orange' : 'blue'}>{task.priority}</Tag></Descriptions.Item>
                    <Descriptions.Item label={<><CheckCircleOutlined /> Status</>} span={2}>
                        <Select value={task.status} style={{ width: '100%' }} onChange={handleMainStatusChange} disabled={task.status === 'Done' && loggedInUser?._id !== task.creator._id}>
                            <Option value="To Do"><Tag color="blue">To Do</Tag></Option>
                            <Option value="In Progress"><Tag color="processing">In Progress</Tag></Option>
                            <Option value="Blocked"><Tag color="error">Blocked</Tag></Option>
                            <Option value="Done"><Tag color="success">Done</Tag></Option>
                        </Select>
                    </Descriptions.Item>
                </Descriptions>
                
                <Divider />

                <Tabs defaultActiveKey="1" items={tabItems} />
            </div>
        );
    };

    return (
        <Modal
            title={null}
            open={open}
            onCancel={onCancel}
            footer={null}
            width={800}
            destroyOnClose
        >
            {renderContent()}
        </Modal>
    );
};

export default TaskDetailsModal;