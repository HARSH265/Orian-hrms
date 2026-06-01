// In: client/src/pages/ProfilePage.js

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Descriptions, Typography, Spin, Button, Modal, Form, Input, message, Avatar, List, Tag, Select, Popconfirm, Row, Col, Space, Timeline, Divider, DatePicker, Skeleton } from 'antd';
import { PlusOutlined,UserOutlined,ApartmentOutlined,UpCircleOutlined } from '@ant-design/icons';
import { updateProfile, updateProfilePicture } from '../features/auth/authThunks';
import { fetchAllSkills, addSkillToProfile, removeSkillFromProfile } from '../features/skill/skillThunks';
import { fetchMyAssets } from '../features/asset/assetThunks';
import FileUpload from '../components/FileUpload';
import { fetchUserKudos } from '../features/kudos/kudosThunks';
import KudosCard from '../components/kudos/KudosCard';
import TwoFactorAuthManager from '../components/profile/TwoFactorAuthManager';
import ProfileCompleteness from '../components/profile/ProfileCompleteness';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const ProfilePage = () => {
    // --- Hooks and State Initialization ---
    const dispatch = useDispatch();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const { skills: skillLibrary } = useSelector((state) => state.skill);
    const [isAddingSkill, setIsAddingSkill] = useState(false);
    const [selectedSkill, setSelectedSkill] = useState(null);
    const [proficiency, setProficiency] = useState('Intermediate');
    const [form] = Form.useForm();

    // --- Redux State Selection ---
    const { user, status: authStatus } = useSelector((state) => state.auth);
    const { myAssets, status: assetStatus } = useSelector((state) => state.asset);
    const { userKudos, status: kudosStatus } = useSelector((state) => state.kudos);

    // --- Effects ---
    useEffect(() => {
        if (user) {
            form.setFieldsValue({ 
                name: user.name, // Also allow editing name
                phone: user.phone, 
                address: user.address, 
                personalInfo: {
                    ...user.personalInfo,
                    dateOfBirth: user.personalInfo?.dateOfBirth ? dayjs(user.personalInfo.dateOfBirth) : null
                },
                // Set nested fields for emergency contact
                emergencyContact: user.emergencyContact
            
            });
            dispatch(fetchMyAssets());
            dispatch(fetchAllSkills());
            dispatch(fetchUserKudos(user._id));
        }
    }, [user, dispatch, form]);

    // --- Modal and Form Handlers ---
    const showModal = () => setIsModalVisible(true);
    const handleCancel = () => setIsModalVisible(false);

    const onFinish = (values) => {
        dispatch(updateProfile(values))
            .unwrap()
            .then(() => {
                message.success('Profile updated successfully!');
                setIsModalVisible(false);
            })
            .catch((err) => message.error(`Failed to update profile: ${err}`));
    };

    const handleProfilePicUpload = (filePath) => {
        dispatch(updateProfilePicture(filePath))
            .unwrap()
            .then(() => message.success('Profile picture updated!'))
            .catch((err) => message.error(`Upload succeeded, but save failed: ${err}`));
    };

    const handleAddSkill = () => {
        if (!selectedSkill) return message.error('Please select a skill.');
        dispatch(addSkillToProfile({ skillId: selectedSkill, proficiency })).unwrap()
            .then(() => {
                message.success('Skill added!');
                setIsAddingSkill(false);
                setSelectedSkill(null);
            })
            .catch((err) => message.error(err));
    };

    const handleRemoveSkill = (skillId) => {
        dispatch(removeSkillFromProfile(skillId)).unwrap()
            .then(() => message.success('Skill removed.'))
            .catch((err) => message.error(err));
    };

    // --- Render Logic ---
    if (authStatus === 'loading' && !user) {
        return <div style={{ padding: 24 }}><Skeleton active avatar paragraph={{ rows: 4 }} /></div>;
    }

     return (
        <Row gutter={[24, 24]} style={{ height: '80vh', overflow: 'hidden' }}>
  {/* --- Left Column (fixed) --- */}
  <Col
    xs={24}
    lg={8}
    style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 24,
      overflowY: 'auto', // allow its own scroll if needed
      paddingRight: 8
    }}
  >
    <Card style={{ flexShrink: 0 }}>
      <div style={{ textAlign: 'center' }}>
        <Avatar size={128} src={user?.profilePictureUrl} style={{ marginBottom: 16 }}>
          {user?.name?.charAt(0)}
        </Avatar>
        <Title level={4}>{user?.name}</Title>
        <Text type="secondary">{user?.jobTitle}</Text>
        <div style={{ marginTop: 24 }}>
          <FileUpload onUploadSuccess={handleProfilePicUpload} />
        </div>
      </div>
    </Card>
    <ProfileCompleteness user={user} />
    <TwoFactorAuthManager />

    <Card
      title={<Title level={5} style={{ margin: 0 }}>My Assigned Assets</Title>}
      style={{ flex: 1, overflow: 'auto' }}
    >
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
            </List.Item>
          )}
          locale={{ emptyText: "No assets assigned" }}
        />
      )}
    </Card>
  </Col>

  {/* --- Right Column (scrollable) --- */}
  <Col
    xs={24}
    lg={16}
    style={{
      height: '100%',
      overflowY: 'auto',
      paddingRight: 8
    }}
  >
    <Space direction="vertical" size="large" style={{ width: '100%', paddingBottom: 24 }}>
       <Card title={<Title level={4}>Personal & Contact Information</Title>} extra={<Button type="primary" onClick={showModal}>Edit Info</Button>}>
                        <Descriptions bordered column={1} size="small">
                            <Descriptions.Item label="Full Name">{user?.name}</Descriptions.Item>
                            <Descriptions.Item label="Email">{user?.email}</Descriptions.Item>
                            <Descriptions.Item label="Phone">{user?.phone || 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Address">{user?.address || 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Date of Birth">{user?.personalInfo?.dateOfBirth ? new Date(user.personalInfo.dateOfBirth).toLocaleDateString() : 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Gender">{user?.personalInfo?.gender || 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Marital Status">{user?.personalInfo?.maritalStatus || 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Emergency Contact">{user?.emergencyContact?.name ? `${user.emergencyContact.name} (${user.emergencyContact.relation}) - ${user.emergencyContact.phone} `: 'N/A'}</Descriptions.Item>
                        </Descriptions>
                    </Card>

      <Card title={<Title level={4} style={{ margin: 0 }}>Employment Details</Title>}>
        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="Employee ID">{user?.employmentInfo?.employeeId || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Job Title">{user?.jobTitle || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Department">{user?.department?.name || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Manager">{user?.manager?.name || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Hire Date">
            {user?.employmentInfo?.hireDate
              ? new Date(user.employmentInfo.hireDate).toLocaleDateString()
              : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Employment Type">{user?.employmentInfo?.employmentType || 'N/A'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={<Title level={4} style={{ margin: 0 }}>Kudos Received</Title>}>
        {kudosStatus === 'loading' && <Spin />}
        {kudosStatus === 'succeeded' && (
          <List
            grid={{ gutter: 16, column: 1 }}
            dataSource={userKudos}
            renderItem={(kudos) => (
              <List.Item><KudosCard kudos={kudos} /></List.Item>
            )}
            locale={{ emptyText: "No kudos yet." }}
          />
        )}
      </Card>

      <Card title={<Title level={4} style={{ margin: 0 }}>My Skills Matrix</Title>}>
        <List
          dataSource={user?.skills}
          renderItem={userSkill => (
            <List.Item
              actions={[
                <Popconfirm
                  title="Remove this skill?"
                  onConfirm={() => handleRemoveSkill(userSkill.skill._id)}
                >
                  <Button type="link" danger>Remove</Button>
                </Popconfirm>
              ]}
            >
              <List.Item.Meta
                title={userSkill.skill?.name}
                description={`Proficiency: ${userSkill.proficiency}`}
              />
              <Tag>{userSkill.endorsements?.length || 0} Endorsements</Tag>
            </List.Item>
          )}
          locale={{ emptyText: "No skills added yet." }}
        />
        {isAddingSkill ? (
          <Space style={{ marginTop: 16, flexWrap: 'wrap' }}>
            <Select
              showSearch
              placeholder="Select skill"
              style={{ width: 200 }}
              onChange={setSelectedSkill}
              options={skillLibrary.map(skill => ({
                value: skill._id, label: skill.name
              }))}
            />
            <Select
              defaultValue="Intermediate"
              style={{ width: 150 }}
              onChange={setProficiency}
              options={[
                { value: 'Beginner', label: 'Beginner' },
                { value: 'Intermediate', label: 'Intermediate' },
                { value: 'Advanced', label: 'Advanced' },
                { value: 'Expert', label: 'Expert' }
              ]}
            />
            <Button type="primary" onClick={handleAddSkill}>Add</Button>
            <Button onClick={() => setIsAddingSkill(false)}>Cancel</Button>
          </Space>
        ) : (
          <Button
            icon={<PlusOutlined />}
            onClick={() => setIsAddingSkill(true)}
            style={{ marginTop: 16 }}
          >
            Add Skill
          </Button>
        )}
      </Card>

        <Card title={<Title level={4} style={{ margin: 0 }}>Career Progression</Title>}>
                        {user?.employmentHistory && user.employmentHistory.length > 0 ? (
                            <Timeline>
                                {user.employmentHistory.map((entry, index) => (
                                    <Timeline.Item key={index} dot={<UpCircleOutlined style={{ fontSize: '16px' }} />}>
                                        <Text strong>{entry.jobTitle}</Text>
                                        <br/>
                                        <Text type="secondary">{new Date(entry.effectiveDate).toLocaleDateString()}</Text>
                                        <Descriptions column={1} size="small" style={{marginTop: '8px'}}>
                                            {entry.department && <Descriptions.Item label="Department"><Tag icon={<ApartmentOutlined />}>{entry.department.name}</Tag></Descriptions.Item>}
                                            {entry.manager && <Descriptions.Item label="Manager"><Tag icon={<UserOutlined />}>{entry.manager.name}</Tag></Descriptions.Item>}
                                            {entry.employmentType && <Descriptions.Item label="Type">{entry.employmentType}</Descriptions.Item>}
                                        </Descriptions>
                                    </Timeline.Item>
                                ))}
                            </Timeline>
                        ) : (
                            <Text type="secondary">No job history recorded yet.</Text>
                        )}
                    </Card>
    </Space>
  </Col>

  {/* Modal stays outside */}
  <Modal title="Edit Personal Information" open={isModalVisible} onCancel={handleCancel} footer={null}>
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Title level={5}>Contact Information</Title>
                    <Form.Item name="name" label="Full Name" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="phone" label="Phone Number"><Input /></Form.Item>
                    <Form.Item name="address" label="Address"><Input.TextArea rows={3} /></Form.Item>

                    <Divider />
                    <Title level={5}>Personal Details</Title>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name={['personalInfo', 'dateOfBirth']} label="Date of Birth"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
                        <Col span={12}><Form.Item name={['personalInfo', 'gender']} label="Gender">
                            <Select allowClear options={['Male', 'Female', 'Other', 'Prefer not to say'].map(g => ({value: g, label: g}))} />
                        </Form.Item></Col>
                         <Col span={12}><Form.Item name={['personalInfo', 'nationality']} label="Nationality"><Input /></Form.Item></Col>
                         <Col span={12}><Form.Item name={['personalInfo', 'maritalStatus']} label="Marital Status">
                            <Select allowClear options={['Single', 'Married', 'Divorced', 'Widowed'].map(s => ({value: s, label: s}))} />
                        </Form.Item></Col>
                    </Row>

                    <Divider />
                    <Title level={5}>Emergency Contact</Title>
                     <Row gutter={16}>
                        <Col span={12}><Form.Item name={['emergencyContact', 'name']} label="Contact Name"><Input /></Form.Item></Col>
                        <Col span={12}><Form.Item name={['emergencyContact', 'phone']} label="Contact Phone"><Input /></Form.Item></Col>
                        <Col span={24}><Form.Item name={['emergencyContact', 'relation']} label="Relation"><Input /></Form.Item></Col>
                    </Row>
                    
                    <Form.Item style={{marginTop: '24px'}}>
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