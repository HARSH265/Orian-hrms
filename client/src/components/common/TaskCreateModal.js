import React, { useState } from 'react';
import { Modal, Form, Input, InputNumber, DatePicker, Select, Button, Checkbox, Divider, Row, Col } from 'antd';
import CustomFieldInput from './CustomFieldInput';

const { Option } = Select;

const TaskCreateModal = ({ open, onCancel, onFinish, assigneeOptions, customFieldDefs = [] }) => {
    const [form] = Form.useForm();
    const [showAttachment, setShowAttachment] = useState(false);

    const handleFinish = (values) => {
        onFinish(values);
        form.resetFields();
        setShowAttachment(false);
    };

    const handleCancel = () => {
        onCancel();
        form.resetFields();
        setShowAttachment(false);
    };

    return (
        <Modal title="Create New Task" open={open} onCancel={handleCancel} footer={null} destroyOnClose aria-label="Create new task">
            <Form form={form} layout="vertical" onFinish={handleFinish}>
                <Row gutter={16}>
                    <Col span={16}>
                        <Form.Item name="title" label="Task Title" rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="timeEstimate" label="Estimate (hours)">
                            <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                </Row>
                <Form.Item name="description" label="Description">
                    <Input.TextArea rows={2} />
                </Form.Item>
                <Form.Item name="assignees" label="Assign To" rules={[{ required: true }]}>
                    <Select
                        mode="multiple"
                        placeholder="Select one or more team members"
                        showSearch
                        optionFilterProp="children"
                        allowClear
                    >
                        {assigneeOptions.map(option => (
                            <Option key={option.value} value={option.value}>{option.label}</Option>
                        ))}
                    </Select>
                </Form.Item>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="dueDate" label="Due Date">
                            <DatePicker style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="priority" label="Priority" initialValue="Medium">
                            <Select>
                                <Option value="High">High</Option>
                                <Option value="Medium">Medium</Option>
                                <Option value="Low">Low</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                {customFieldDefs.length > 0 && <Divider>Custom Details</Divider>}

                {customFieldDefs.map(field => (
                    <Form.Item
                        key={field._id}
                        label={field.name}
                        name={['customFieldValues', field._id]}
                        rules={field.isRequired ? [{ required: true, message: `Please input a value for ${field.name}.` }] : []}
                    >
                        <CustomFieldInput field={field} />
                    </Form.Item>
                ))}

                <Form.Item>
                    <Button type="primary" htmlType="submit">Create Task</Button>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default TaskCreateModal;
