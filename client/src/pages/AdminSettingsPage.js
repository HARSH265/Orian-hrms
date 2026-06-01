// In: client/src/pages/AdminSettingsPage.js

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Form, Input, Button, message, Card, Spin, Typography, Avatar, Col, Row, Divider , Space, Select } from 'antd'; // Import Divider
import { SaveOutlined, SettingOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom'; // Import Link
import { fetchSettings, updateSettings } from '../features/settings/settingsThunks';
import { fetchChecklistTemplates } from '../features/checklist/checklistThunks'; 
import FileUpload from '../components/FileUpload';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const AdminSettingsPage = () => {
    const dispatch = useDispatch();
    const [form] = Form.useForm();
    const { settings, status } = useSelector(state => state.settings);
    const { templates: checklistTemplates } = useSelector(state => state.checklist);

    const [logoUrl, setLogoUrl] = useState('');

    useEffect(() => {
        dispatch(fetchSettings());
         dispatch(fetchChecklistTemplates());
    }, [dispatch]);

     useEffect(() => {
        if (settings) {
            form.setFieldsValue({
                companyName: settings.companyName,
                defaultCurrency: settings.defaultCurrency,
                offboardingTemplateId: settings.offboardingTemplateId, // <-- SET NEW FIELD
            });
            setLogoUrl(settings.companyLogoUrl || '');
        }
    }, [settings, form]);

     const onFinish = (values) => {
        const settingsData = { ...values, companyLogoUrl: logoUrl };
        dispatch(updateSettings(settingsData))
            .unwrap()
            .then(() => message.success('Settings updated successfully!'))
            .catch((err) => message.error(err));
    };

    const handleLogoUploadSuccess = (url) => {
        setLogoUrl(url);
        message.success('Logo uploaded. Click "Save Changes" to apply it.');
    };

    if (status === 'loading' && !settings) {
        return <Spin />;
    }

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card>
                <Title level={2}>Branding & General Settings</Title>
                <Text type="secondary">Manage application-wide settings. Only visible to Super Admins.</Text>
                <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 24 }}>
                    <Row gutter={24}>
                        <Col xs={24} md={12}>
                            <Form.Item name="companyName" label="Company Name" rules={[{ required: true }]}>
                                <Input placeholder="Your Company Inc." />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="defaultCurrency" label="Default Currency (e.g., USD, EUR)">
                                <Input placeholder="USD" />
                            </Form.Item>
                        </Col>
                        <Col xs={24}>
                            <Form.Item label="Company Logo">
                                <Row align="middle" gutter={16}>
                                    <Col>
                                        <Avatar shape="square" size={64} src={logoUrl} style={{ border: '1px solid #d9d9d9', padding: '4px' }}>
                                            {settings?.companyName?.charAt(0)}
                                        </Avatar>
                                    </Col>
                                    <Col>
                                        <FileUpload onUploadSuccess={handleLogoUploadSuccess} />
                                    </Col>
                                </Row>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Divider/>

                     <Title level={4}>Automations</Title>
                    <Row gutter={24}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="offboardingTemplateId"
                                label="Default Offboarding Checklist"
                                help="This checklist will be automatically assigned when an employee is deactivated."
                            >
                                <Select allowClear placeholder="Select an offboarding template">
                                    {checklistTemplates.map(template => (
                                        <Option key={template._id} value={template._id}>
                                            {template.name}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    
                    <Divider />


                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={status === 'loading'} icon={<SaveOutlined />}>
                            Save Changes
                        </Button>
                    </Form.Item>
                </Form>
            </Card>

            {/* ======================================================================= */}
            {/* --- NEW: Card linking to the Custom Fields page --- */}
            <Card>
                <Row align="middle" gutter={24}>
                    <Col>
                        <Avatar size="large" icon={<SettingOutlined />} style={{ backgroundColor: '#1890ff' }} />
                    </Col>
                    <Col flex="auto">
                        <Title level={4}>Custom Fields</Title>
                        <Paragraph type="secondary">
                            Extend the application by creating custom fields for modules like Task Management to capture additional, company-specific information.
                        </Paragraph>
                    </Col>
                    <Col>
                        <Link to="/admin/settings/custom-fields">
                            <Button>Manage Custom Fields</Button>
                        </Link>
                    </Col>
                </Row>
            </Card>
            {/* ======================================================================= */}
        </Space>
    );
};

export default AdminSettingsPage;