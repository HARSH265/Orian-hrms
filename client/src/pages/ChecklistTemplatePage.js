// In: client/src/pages/ChecklistTemplatePage.js

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { List, Button, Card, Typography, Modal, Form, Input, message, Select, InputNumber, Space, Popconfirm, Row, Col  } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { fetchChecklistTemplates, createChecklistTemplate, updateChecklistTemplate, deleteChecklistTemplate } from '../features/checklist/checklistThunks';
import { fetchRoles } from '../features/roles/roleThunks';
const { Title } = Typography;
const { Option } = Select;

const ChecklistTemplatePage = () => {
    const dispatch = useDispatch();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    
    // --- NEW: State to track if we are editing or creating ---
    const [editingTemplate, setEditingTemplate] = useState(null);

    const { templates, status } = useSelector((state) => state.checklist);
    const { roles } = useSelector((state) => state.roles);

    useEffect(() => {
        dispatch(fetchChecklistTemplates());
         dispatch(fetchRoles())
    }, [dispatch]);

    // --- UPDATED: Show modal for creating or editing ---
    const showModal = (template = null) => {
        setEditingTemplate(template);
        if (template) {
            // If editing, populate the form with existing data
            form.setFieldsValue(template);
        } else {
            // If creating, reset the form
            form.resetFields();
        }
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingTemplate(null);
        form.resetFields();
    };

    // --- UPDATED: onFinish now handles both create and update ---
    const onFinish = (values) => {
        const action = editingTemplate
            ? updateChecklistTemplate({ templateId: editingTemplate._id, templateData: values })
            : createChecklistTemplate(values);

        dispatch(action).unwrap()
            .then(() => {
                message.success(`Template ${editingTemplate ? 'updated' : 'created'} successfully!`);
                handleCancel();
            })
            .catch((err) => message.error(err));
    };

    // --- NEW: Handler for deleting a template ---
    const handleDelete = (templateId) => {
        dispatch(deleteChecklistTemplate(templateId)).unwrap()
            .then((msg) => message.success(msg))
            .catch((err) => message.error(err));
    };

    return (
        <>
            <Card 
                title={<Title level={3}>Checklist Templates</Title>} 
                extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => showModal(null)}>Create New Template</Button>}
            >
                <List
                    loading={status === 'loading' && templates.length === 0}
                    dataSource={templates}
                    renderItem={template => (
                        <List.Item
                            // --- NEW: Add Edit and Delete buttons ---
                            actions={[
                                <Button icon={<EditOutlined />} onClick={() => showModal(template)}>Edit</Button>,
                                <Popconfirm
                                    title="Delete this template?"
                                    description="This action cannot be undone. You cannot delete templates that are already in use."
                                    onConfirm={() => handleDelete(template._id)}
                                    okText="Yes, Delete"
                                    cancelText="No"
                                >
                                    <Button icon={<DeleteOutlined />} danger />
                                </Popconfirm>
                            ]}
                        >
                            <List.Item.Meta
                                title={template.name}
                                description={template.description || `${template.tasks.length} tasks in this template.`}
                            />
                        </List.Item>
                    )}
                />
            </Card>

            <Modal 
                title={editingTemplate ? "Edit Checklist Template" : "Create New Checklist Template"} 
                open={isModalVisible} 
                onCancel={handleCancel} 
                footer={null} 
                width={800}
                destroyOnHidden // Ensures form resets properly
            >
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Form.Item name="name" label="Template Name" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="description" label="Description"><Input.TextArea /></Form.Item>
                    
                    <Title level={5}>Tasks</Title>
                    <Form.List name="tasks">
                        {(fields, { add, remove }) => (
                            <div style={{ maxHeight: '40vh', overflowY: 'auto', paddingRight: '10px' }}>
                                {fields.map(({ key, name, ...restField }) => (
                                    // --- THE UI UPGRADE ---
                                    <Row key={key} gutter={8} style={{ marginBottom: 8 }} wrap={false}>
                                        <Col flex="auto">
                                            <Form.Item {...restField} name={[name, 'title']} rules={[{ required: true }]} noStyle>
                                                <Input placeholder="Task Title" />
                                            </Form.Item>
                                        </Col>
                                        <Col flex="180px">
                                            {/* This Form.Item watches for changes in the assigneeType field */}
                                            <Form.Item noStyle shouldUpdate>
                                            {() => {
                                                const assigneeType = form.getFieldValue(['tasks', name, 'defaultAssignee', 'assigneeType']);
                                                return (
                                                    <Space.Compact style={{width: '100%'}}>
                                                        <Form.Item {...restField} name={[name, 'defaultAssignee', 'assigneeType']} noStyle initialValue="TargetUser">
                                                            <Select>
                                                                <Select.Option value="TargetUser">Employee</Select.Option>
                                                                <Select.Option value="TargetUsersManager">Manager</Select.Option>
                                                                <Select.Option value="HRTrigger">HR (Initiator)</Select.Option>
                                                                <Select.Option value="Role">Specific Role</Select.Option>
                                                            </Select>
                                                        </Form.Item>
                                                        {assigneeType === 'Role' && (
                                                            <Form.Item {...restField} name={[name, 'defaultAssignee', 'roleId']} noStyle rules={[{ required: true, message: 'Please select a role' }]}>
                                                                <Select placeholder="Select Role" style={{width: '120px'}} options={roles.map(r => ({value: r._id, label: r.name}))} />
                                                            </Form.Item>
                                                        )}
                                                    </Space.Compact>
                                                )
                                            }}
                                            </Form.Item>
                                        </Col>
                                        <Col flex="150px">
                                            <Form.Item {...restField} name={[name, 'dueDays']} noStyle initialValue={0}>
                                                <InputNumber addonAfter="days" />
                                            </Form.Item>
                                        </Col>
                                        <Col>
                                            <Button danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                                        </Col>
                                    </Row>
                                ))}
                                <Form.Item>
                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Add Task Item</Button>
                                </Form.Item>
                            </div>
                        )}
                    </Form.List>
                    <Form.Item style={{marginTop: '24px'}}>
                        <Button type="primary" htmlType="submit" loading={status === 'loading'}>
                            {editingTemplate ? 'Save Changes' : 'Create Template'}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default ChecklistTemplatePage;