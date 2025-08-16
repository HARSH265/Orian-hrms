import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { List, Card, Typography, Spin, Tag, Select, message, Button, Modal, Form, Input, DatePicker, Row, Col } from 'antd';
import { createTask, fetchTasksCreatedByMe } from '../features/task/taskThunks';
import MyTasksList from '../components/tasks/MyTasksList'; // We can even reuse our component here!

const { Title, Text } = Typography;
const { Option } = Select;

const MyTasksPage = () => {
    const dispatch = useDispatch();
    const { createdTasks, status } = useSelector((state) => state.task);
    const { user: loggedInUser } = useSelector((state) => state.auth);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        dispatch(fetchTasksCreatedByMe());
    }, [dispatch]);
    
    const showCreateModal = () => setIsModalVisible(true);
    const handleCancel = () => { setIsModalVisible(false); form.resetFields(); };
    
    const onFinish = (values) => {
        const taskData = { ...values, assignee: loggedInUser?.manager?._id };
        dispatch(createTask(taskData)).unwrap()
            .then(() => {
                message.success(`Task assigned to ${loggedInUser.manager.name} successfully!`);
                handleCancel();
                dispatch(fetchTasksCreatedByMe());
            })
            .catch((err) => message.error(err));
    };

    return (
        <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
                <Card
                    title={<Title level={4}>Tasks Assigned to Me</Title>}
                    extra={ loggedInUser?.manager && (<Button type="primary" onClick={showCreateModal}>Create Task for Manager</Button>)}
                >
                    <MyTasksList />
                </Card>
            </Col>
            <Col xs={24} lg={12}>
                <Card title={<Title level={4}>Tasks I've Created</Title>}>
                    {(status === 'loading' && createdTasks.length === 0) ? <Spin /> : (
                        <List
                            dataSource={createdTasks}
                            locale={{ emptyText: "You have not created any tasks for others." }}
                            renderItem={task => (
                                <List.Item>
                                    <List.Item.Meta
                                        title={<Text strong>{task.title}</Text>}
                                        description={`Assigned to: ${task.assignee?.name || 'N/A'}`}
                                    />
                                    <Tag>{task.status}</Tag>
                                </List.Item>
                            )}
                        />
                    )}
                </Card>
            </Col>
            <Modal title="Create a New Task for Your Manager" open={isModalVisible} onCancel={handleCancel} footer={null}>
                {loggedInUser?.manager ? (
                    <Form form={form} layout="vertical" onFinish={onFinish}>
                        <Form.Item label="Assign To"><Input value={loggedInUser.manager.name} disabled /></Form.Item>
                        <Form.Item name="title" label="Task Title" rules={[{ required: true }]}><Input /></Form.Item>
                        <Form.Item name="description" label="Description"><Input.TextArea rows={4} /></Form.Item>
                        <Form.Item name="dueDate" label="Due Date"><DatePicker /></Form.Item>
                        <Form.Item name="priority" label="Priority" initialValue="Medium">
                            <Select><Option value="High">High</Option><Option value="Medium">Medium</Option><Option value="Low">Low</Option></Select>
                        </Form.Item>
                        <Form.Item><Button type="primary" htmlType="submit" loading={status === 'loading'}>Assign Task</Button></Form.Item>
                    </Form>
                ) : (<Text type="warning">You cannot create a task because you do not have a manager assigned.</Text>)}
            </Modal>
        </Row>
    );
};

export default MyTasksPage;