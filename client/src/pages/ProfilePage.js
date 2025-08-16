import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Descriptions, Typography, Spin, Button, Modal, Form, Input, message, Avatar, List, Row, Col } from 'antd';

// --- THIS IS THE FIX: Add 'updateProfile' to the import list ---
import { updateProfile, updateProfilePicture } from '../features/auth/authThunks';
// --- END OF FIX ---

import { fetchMyAssets } from '../features/asset/assetThunks'; 
import FileUpload from '../components/FileUpload'; 

const { Title, Text } = Typography;

const ProfilePage = () => {
    // --- Hooks and State Initialization ---
    const dispatch = useDispatch();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();

    // --- Redux State Selection ---
    const { user, status: authStatus } = useSelector((state) => state.auth);
    const { myAssets, status: assetStatus } = useSelector((state) => state.asset);

    // --- Effects ---
    useEffect(() => {
        if (user) {
            form.setFieldsValue({
                phone: user.phone,
                address: user.address,
            });
        }
    }, [user, form]);

    useEffect(() => {
        dispatch(fetchMyAssets());
    }, [dispatch]);

    // --- Modal and Form Handlers ---
    const showModal = () => setIsModalVisible(true);
    const handleCancel = () => setIsModalVisible(false);

    const onFinish = (values) => {
        // This will now work because 'updateProfile' is imported
        dispatch(updateProfile(values))
            .unwrap()
            .then(() => {
                message.success('Profile updated successfully!');
                setIsModalVisible(false);
            })
            .catch((err) => {
                message.error(`Failed to update profile: ${err}`);
            });
    };

    const handleProfilePicUpload = (filePath) => {
        dispatch(updateProfilePicture(filePath))
            .unwrap()
            .then(() => message.success('Profile picture updated!'))
            .catch((err) => message.error(`Upload succeeded, but save failed: ${err}`));
    };

    // --- Render Logic ---
    if (authStatus === 'loading' && !user) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <Row gutter={[24, 24]}>
             <Col xs={24} md={8}>
                <Card title="Profile Picture">
                    <div style={{ textAlign: 'center' }}>
                        {/* Assuming Cloudinary URL. If local, use `http://localhost:5001${user?.profilePictureUrl}` */}
                        <Avatar size={128} src={user?.profilePictureUrl} />
                        <div style={{ marginTop: '16px' }}>
                            <FileUpload onUploadSuccess={handleProfilePicUpload} />
                        </div>
                    </div>
                </Card>
            </Col>
            <Col xs={24} md={16}>
                <Card
                    title={<Title level={3}>My Profile</Title>}
                    extra={<Button type="primary" onClick={showModal}>Edit Profile</Button>}
                >
                    <Descriptions bordered column={1}>
                        <Descriptions.Item label="Full Name">{user?.name}</Descriptions.Item>
                        <Descriptions.Item label="Email">{user?.email}</Descriptions.Item>
                        <Descriptions.Item label="Role">{user?.role}</Descriptions.Item>
                        <Descriptions.Item label="Job Title">{user?.jobTitle || 'N/A'}</Descriptions.Item>
                        <Descriptions.Item label="Department">{user?.department?.name || 'N/A'}</Descriptions.Item>
                        <Descriptions.Item label="Phone">{user?.phone || 'N/A'}</Descriptions.Item>
                        <Descriptions.Item label="Address">{user?.address || 'N/A'}</Descriptions.Item>
                    </Descriptions>
                </Card>
            </Col>
            <Col xs={24}>
                <Card title={<Title level={3}>My Assigned Assets</Title>}>
                    {assetStatus === 'loading' && <Spin />}
                    {assetStatus === 'succeeded' && (
                        <List
                            dataSource={myAssets}
                            renderItem={asset => (
                                <List.Item>
                                    <List.Item.Meta
                                        title={<Text strong>{asset.name}</Text>}
                                        description={`Type: ${asset.assetType} | Status: ${asset.status}`}
                                    />
                                    {asset.serialNumber && <div>Serial #: {asset.serialNumber}</div>}
                                </List.Item>
                            )}
                            locale={{ emptyText: "No assets are currently assigned to you." }}
                        />
                    )}
                    {assetStatus === 'failed' && (<Text type="danger">Could not load assigned assets.</Text>)}
                </Card>
            </Col>

            <Modal
                title="Edit Profile"
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={{ phone: user?.phone, address: user?.address }}
                >
                    <Form.Item name="phone" label="Phone Number"><Input /></Form.Item>
                    <Form.Item name="address" label="Address"><Input.TextArea rows={3} /></Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={authStatus === 'loading'}>
                            Save Changes
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </Row>
    );
};

export default ProfilePage;