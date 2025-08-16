import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Table, Button, Card, Typography, Modal, Form, Input, message, Space, Popconfirm } from 'antd';
import { fetchAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../features/announcement/announcementThunks';

const { Title } = Typography;

const AnnouncementAdminPage = () => {
    const dispatch = useDispatch();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState(null);
    const [form] = Form.useForm();
    
    const { announcements, status } = useSelector((state) => state.announcement);
    const { user: loggedInUser } = useSelector((state) => state.auth);

    useEffect(() => {
        dispatch(fetchAnnouncements());
    }, [dispatch]);

    const showModal = (announcement = null) => {
        setEditingAnnouncement(announcement);
        form.setFieldsValue(announcement ? { ...announcement } : { title: '', content: '' });
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingAnnouncement(null);
        form.resetFields();
    };

    const onFinish = (values) => {
        const action = editingAnnouncement
            ? updateAnnouncement({ announcementId: editingAnnouncement._id, announcementData: values })
            : createAnnouncement(values);

        dispatch(action)
            .unwrap()
            .then(() => {
                message.success(`Announcement ${editingAnnouncement ? 'updated' : 'created'} successfully!`);
                handleCancel();
            })
            .catch((err) => message.error(err));
    };

    const handleDelete = (announcementId) => {
        dispatch(deleteAnnouncement(announcementId))
            .unwrap()
            .then(() => message.success('Announcement deleted successfully!'))
            .catch((err) => message.error(err));
    };

    const columns = [
        { title: 'Title', dataIndex: 'title', key: 'title' },
        { title: 'Author', dataIndex: ['author', 'name'], key: 'author' },
        { title: 'Created At', dataIndex: 'createdAt', render: (date) => new Date(date).toLocaleString() },
        {
            title: 'Actions',
            key: 'actions',
            // --- STEP 2: Add smarter rendering logic ---
            render: (_, record) => {
                // Check for ownership or super-admin privileges
                const isAuthor = record.author?._id === loggedInUser?._id;
                const isSuperAdmin = loggedInUser?.role === 'super-admin';

                // A user can edit or delete IF they are the author OR they are a super-admin.
                if (isAuthor || isSuperAdmin) {
                    return (
                        <Space>
                            <Button type="link" onClick={() => showModal(record)}>Edit</Button>
                            <Popconfirm title="Are you sure?" onConfirm={() => handleDelete(record._id)}>
                                <Button type="link" danger>Delete</Button>
                            </Popconfirm>
                        </Space>
                    );
                }

                // If they don't have permission, render nothing.
                return null;
            },
        },
    ];

    return (
        <>
            <Card
                title={<Title level={3}>Manage Announcements</Title>}
                extra={<Button type="primary" onClick={() => showModal(null)}>Create Announcement</Button>}
            >
                <Table columns={columns} dataSource={announcements} rowKey="_id" loading={status === 'loading'} />
            </Card>

            <Modal
                title={editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Form.Item name="title" label="Title" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="content" label="Content" rules={[{ required: true }]}>
                        <Input.TextArea rows={6} />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={status === 'loading'}>
                            {editingAnnouncement ? 'Save Changes' : 'Post Announcement'}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default AnnouncementAdminPage;