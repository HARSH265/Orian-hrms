import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Table, Button, Card, Typography, Modal, Form, Input, message, Space, Popconfirm, Tag } from 'antd';
import {
    fetchAllSkills,
    createSkill,
    updateSkill,
    archiveSkill
} from '../features/skill/skillThunks';

const { Title } = Typography;

const AdminSkillsPage = () => {
    const dispatch = useDispatch();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingSkill, setEditingSkill] = useState(null);
    const [form] = Form.useForm();
    
    const { skills, status } = useSelector((state) => state.skill);

    useEffect(() => {
        dispatch(fetchAllSkills());
    }, [dispatch]);

    const showModal = (skill = null) => {
        setEditingSkill(skill);
        form.setFieldsValue(skill ? { ...skill } : { name: '', category: '' });
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingSkill(null);
        form.resetFields();
    };

    const onFinish = (values) => {
        const action = editingSkill
            ? updateSkill({ skillId: editingSkill._id, skillData: values })
            : createSkill(values);

        dispatch(action).unwrap()
            .then(() => {
                message.success(`Skill ${editingSkill ? 'updated' : 'created'} successfully!`);
                handleCancel();
            })
            .catch((err) => message.error(err));
    };

    const handleArchive = (skillId) => {
        dispatch(archiveSkill(skillId)).unwrap()
            .then(() => message.success('Skill archived successfully!'))
            .catch((err) => message.error(err));
    };

    const columns = [
        { title: 'Skill Name', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
        { title: 'Category', dataIndex: 'category', key: 'category', sorter: (a, b) => a.category.localeCompare(b.category) },
        { title: 'Status', dataIndex: 'isArchived', key: 'isArchived', 
            render: (isArchived) => (
                <Tag color={isArchived ? 'red' : 'green'}>{isArchived ? 'ARCHIVED' : 'ACTIVE'}</Tag>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                !record.isArchived && ( // Only show actions for active skills
                    <Space>
                        <Button type="link" onClick={() => showModal(record)}>Edit</Button>
                        <Popconfirm title="Are you sure you want to archive this skill?" onConfirm={() => handleArchive(record._id)}>
                            <Button type="link" danger>Archive</Button>
                        </Popconfirm>
                    </Space>
                )
            ),
        },
    ];

    return (
        <>
            <Card
                title={<Title level={3}>Skill Library Management</Title>}
                extra={<Button type="primary" onClick={() => showModal(null)}>Create Skill</Button>}
            >
                <Table
                    columns={columns}
                    dataSource={skills}
                    rowKey="_id"
                    loading={status === 'loading'}
                />
            </Card>

            <Modal
                title={editingSkill ? 'Edit Skill' : 'Create New Skill'}
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Form.Item name="name" label="Skill Name" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="category" label="Category" rules={[{ required: true }]}><Input placeholder="e.g., Technical, Soft Skill, Leadership" /></Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={status === 'loading'}>
                            {editingSkill ? 'Save Changes' : 'Create Skill'}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default AdminSkillsPage;