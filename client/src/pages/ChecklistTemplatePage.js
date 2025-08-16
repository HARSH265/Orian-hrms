import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { List, Button, Card, Typography, Modal, Form, Input, message, Select, InputNumber, Space } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { fetchChecklistTemplates, createChecklistTemplate } from '../features/checklist/checklistThunks';

const { Title } = Typography;
const { Option } = Select;

const ChecklistTemplatePage = () => {
    const dispatch = useDispatch();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();

    const { templates, status } = useSelector((state) => state.checklist);

    useEffect(() => {
        dispatch(fetchChecklistTemplates());
    }, [dispatch]);

    const showModal = () => setIsModalVisible(true);
    const handleCancel = () => { setIsModalVisible(false); form.resetFields(); };

    const onFinish = (values) => {
        dispatch(createChecklistTemplate(values)).unwrap()
            .then(() => {
                message.success('Template created successfully!');
                handleCancel();
            })
            .catch((err) => message.error(err));
    };

    return (
        <>
            <Card title={<Title level={3}>Checklist Templates</Title>} extra={<Button type="primary" onClick={showModal}>Create New Template</Button>}>
                <List
                    loading={status === 'loading'}
                    dataSource={templates}
                    renderItem={template => (
                        <List.Item>
                            <List.Item.Meta
                                title={template.name}
                                description={`${template.tasks.length} tasks in this template.`}
                            />
                        </List.Item>
                    )}
                />
            </Card>

            <Modal title="Create New Checklist Template" open={isModalVisible} onCancel={handleCancel} footer={null} width={800}>
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Form.Item name="name" label="Template Name" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="description" label="Description"><Input.TextArea /></Form.Item>
                    
                    <Title level={5}>Tasks</Title>
                    <Form.List name="tasks">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                        <Form.Item {...restField} name={[name, 'title']} rules={[{ required: true }]}><Input placeholder="Task Title" /></Form.Item>
                                        <Form.Item {...restField} name={[name, 'defaultAssignee']} rules={[{ required: true }]} initialValue="New Employee">
                                            <Select style={{ width: 150 }}>
                                                <Option value="New Employee">New Employee</Option>
                                                <Option value="Manager">Manager</Option>
                                                <Option value="HR">HR</Option>
                                            </Select>
                                        </Form.Item>
                                        <Form.Item {...restField} name={[name, 'dueDays']} initialValue={0}>
                                            <InputNumber addonAfter="days after start" />
                                        </Form.Item>
                                        <DeleteOutlined onClick={() => remove(name)} />
                                    </Space>
                                ))}
                                <Form.Item>
                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Add Task</Button>
                                </Form.Item>
                            </>
                        )}
                    </Form.List>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={status === 'loading'}>Create Template</Button>
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default ChecklistTemplatePage;