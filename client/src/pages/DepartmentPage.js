import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
    Table, 
    Button, 
    Card, 
    Typography, 
    Modal, 
    Form, 
    Input, 
    message, 
    Space, 
    Popconfirm,
    Select
} from 'antd';

import { 
    fetchAllDepartments, 
    createDepartment, 
    updateDepartment, 
    deleteDepartment 
} from '../features/department/departmentThunks';

import { fetchAllManagers } from '../features/admin/adminThunks';

const { Title } = Typography;
const { Option } = Select;

const DepartmentPage = () => {
    const dispatch = useDispatch();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingDept, setEditingDept] = useState(null);
    const [form] = Form.useForm();
    
    const { departments, status } = useSelector((state) => state.department);
    const { managers } = useSelector((state) => state.admin);

    useEffect(() => {
        dispatch(fetchAllDepartments());
        dispatch(fetchAllManagers());
    }, [dispatch]);

    const showModal = (dept = null) => {
        setEditingDept(dept);
        // --- 4. NEW: Handle the manager field for the form ---
        form.setFieldsValue(dept ? { 
            ...dept,
            manager: dept.manager?._id // Pre-fill with the manager's ID
         } : { name: '', description: '', manager: null });
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingDept(null);
        form.resetFields();
    };

    const onFinish = (values) => {
        const action = editingDept
            ? updateDepartment({ departmentId: editingDept._id, departmentData: values })
            : createDepartment(values);

        dispatch(action)
            .unwrap()
            .then(() => {
                message.success(`Department ${editingDept ? 'updated' : 'created'} successfully!`);
                handleCancel();
            })
            .catch((err) => message.error(err));
    };

    const handleDelete = (departmentId) => {
        dispatch(deleteDepartment(departmentId))
            .unwrap()
            .then(() => message.success('Department deleted successfully!'))
            .catch((err) => message.error(err));
    };

    const columns = [
        { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
        { title: 'Head of Department', dataIndex: ['manager', 'name'], key: 'manager' },
        { title: 'Description', dataIndex: 'description', key: 'description' },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button type="link" onClick={() => showModal(record)}>Edit</Button>
                    <Popconfirm
                        title="Are you sure? This cannot be undone."
                        onConfirm={() => handleDelete(record._id)}
                    >
                        <Button type="link" danger>Delete</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <>
            <Card
                title={<Title level={3}>Department Management</Title>}
                extra={<Button type="primary" onClick={() => showModal(null)}>Create Department</Button>}
            >
                <Table
                    columns={columns}
                    dataSource={departments}
                    rowKey="_id"
                    loading={status === 'loading'}
                />
            </Card>

            <Modal
                title={editingDept ? 'Edit Department' : 'Create New Department'}
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Form.Item name="name" label="Department Name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                     <Form.Item name="manager" label="Head of Department">
                        <Select placeholder="Assign a manager" allowClear>
                            {managers.map(mgr => (
                                <Option key={mgr._id} value={mgr._id}>{mgr.name}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea rows={3} />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={status === 'loading'}>
                            {editingDept ? 'Save Changes' : 'Create Department'}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default DepartmentPage;