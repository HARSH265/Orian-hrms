import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Table, Button, Card, Typography, Modal, Form, Input, Select, Switch, message, Space, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { fetchCustomFields, createCustomField } from '../features/customFields/customFieldThunks';

const { Title, Text } = Typography;
const { Option } = Select;

const AdminCustomFieldsPage = () => {
    const dispatch = useDispatch();
    const [form] = Form.useForm();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingField, setEditingField] = useState(null);
    const [fieldType, setFieldType] = useState('Text');

    const { fields, status } = useSelector(state => state.customFields);

    useEffect(() => {
        dispatch(fetchCustomFields());
    }, [dispatch]);

    const showModal = (field = null) => {
        setEditingField(field);
        if (field) {
            form.setFieldsValue({ ...field, options: field.options.join(',') });
            setFieldType(field.fieldType);
        } else {
            form.resetFields();
            setFieldType('Text');
        }
        setIsModalVisible(true);
    };

    const handleCancel = () => setIsModalVisible(false);

    const onFinish = (values) => {
        const fieldData = { ...values };
        if (['Select', 'MultiSelect'].includes(values.fieldType) && values.options) {
            fieldData.options = values.options.split(',').map(opt => opt.trim());
        }
        
        // TODO: Implement update logic later
        dispatch(createCustomField(fieldData)).unwrap()
            .then(() => {
                message.success('Custom field created!');
                handleCancel();
            })
            .catch(err => message.error(err));
    };

    const columns = [
        { title: 'Field Name', dataIndex: 'name', key: 'name' },
        { title: 'Field Type', dataIndex: 'fieldType', key: 'fieldType', render: type => <Tag>{type}</Tag> },
        { title: 'Applies To', dataIndex: 'appliesTo', key: 'appliesTo', render: module => <Tag color="blue">{module}</Tag> },
        { title: 'Required', dataIndex: 'isRequired', key: 'isRequired', render: isReq => isReq ? 'Yes' : 'No' },
        { title: 'Actions', key: 'actions', render: (_, record) => (
            <Space>
                <Button icon={<EditOutlined />} onClick={() => showModal(record)}>Edit</Button>
                <Button icon={<DeleteOutlined />} danger>Delete</Button>
            </Space>
        )},
    ];

    return (
        <Card>
            <Title level={2}>Custom Fields</Title>
            <Text type="secondary">Define custom fields to capture extra information in different modules.</Text>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal(null)} style={{ float: 'right' }}>
                Create Field
            </Button>
            <Table columns={columns} dataSource={fields} rowKey="_id" loading={status === 'loading'} style={{ marginTop: 24 }} />

            <Modal title={editingField ? 'Edit Custom Field' : 'Create Custom Field'} open={isModalVisible} onCancel={handleCancel} footer={null}>
                <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ fieldType: 'Text', appliesTo: 'Task', isRequired: false }}>
                    <Form.Item name="name" label="Field Name" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="appliesTo" label="Applies To Module" rules={[{ required: true }]}>
                        <Select options={[{value: 'Task', label: 'Task Management'}]} />
                    </Form.Item>
                    <Form.Item name="fieldType" label="Field Type" rules={[{ required: true }]}>
                        <Select onChange={setFieldType} options={['Text', 'Number', 'Date', 'Select', 'MultiSelect'].map(t => ({value: t, label: t}))} />
                    </Form.Item>
                    {['Select', 'MultiSelect'].includes(fieldType) && (
                        <Form.Item name="options" label="Options (comma-separated)" rules={[{ required: true }]}>
                            <Input.TextArea placeholder="e.g., Option A, Option B, Option C" />
                        </Form.Item>
                    )}
                    <Form.Item name="isRequired" label="Is this field required?" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={status === 'loading'}>{editingField ? 'Save Changes' : 'Create Field'}</Button>
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
};

export default AdminCustomFieldsPage;