import React from 'react'; 
import { useDispatch, useSelector } from 'react-redux';
import { Steps, Button, Form, Input, message, Card, Typography, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { updateProfile, completeWelcomeWizard } from '../features/auth/authThunks'; // <-- Corrected import path

const { Title, Text, Paragraph } = Typography;

// --- 2. RECEIVE currentStep and setCurrentStep AS PROPS ---
const WelcomeWizardPage = ({ currentStep, setCurrentStep }) => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    // const [currentStep, setCurrentStep] = useState(0); // <-- 3. THIS LINE IS DELETED
    const [form] = Form.useForm();

    const handleDetailsSubmit = (values) => {
        dispatch(updateProfile(values))
            .unwrap()
            .then(() => {
                message.success('Details updated!');
                // 4. This now calls the function passed down from WizardGuard
                setCurrentStep(1);
            })
            .catch((error) => {
                message.error(`Failed to update details: ${error || 'Unknown error'}`);
            });
    };
    
    const handlePhotoSubmit = () => {
        message.success('Profile photo updated!');
        setCurrentStep(2);
    };

    const handleFinishWizard = () => {
        dispatch(completeWelcomeWizard());
    };

    const steps = [
        {
            title: 'Confirm Details',
            content: (
                <div>
                    <Paragraph>Welcome to Orion! Let's get your profile set up. Please confirm or update your contact information.</Paragraph>
                    <Form form={form} layout="vertical" onFinish={handleDetailsSubmit} initialValues={{ phone: user.phone, address: user.address }}>
                        <Form.Item name="phone" label="Phone Number"><Input /></Form.Item>
                        <Form.Item name="address" label="Address"><Input.TextArea rows={3} /></Form.Item>
                        <Button type="primary" htmlType="submit">Next</Button>
                    </Form>
                </div>
            ),
        },
        {
            title: 'Profile Photo',
            content: (
                <div>
                    <Paragraph>A great profile photo helps your colleagues get to know you. Please upload one.</Paragraph>
                    <Upload>
                        <Button icon={<UploadOutlined />}>Click to Upload</Button>
                    </Upload>
                    <div style={{ marginTop: 24 }}>
                        <Button onClick={() => setCurrentStep(0)}>Back</Button>
                        <Button type="primary" onClick={handlePhotoSubmit} style={{ marginLeft: 8 }}>Next</Button>
                    </div>
                </div>
            ),
        },
        {
            title: 'Meet Your Team',
            content: (
                <div>
                    <Paragraph>You're all set! Here's a quick look at your team.</Paragraph>
                    {user.manager ? (
                        <Text>Your direct manager is <Text strong>{user.manager.name}</Text>.</Text>
                    ) : (
                        <Text>Your manager information will be updated shortly.</Text>
                    )}
                    <div style={{ marginTop: 24 }}>
                        <Button onClick={() => setCurrentStep(1)}>Back</Button>
                        <Button type="primary" onClick={handleFinishWizard} style={{ marginLeft: 8 }}>Finish & Go to Dashboard</Button>
                    </div>
                </div>
            ),
        },
    ];

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
            <Card style={{ width: 600 }}>
                <Title level={2} style={{ textAlign: 'center' }}>Welcome to Orion!</Title>
                <Steps current={currentStep} items={steps.map(s => ({ title: s.title }))} />
                <div style={{ marginTop: 24, padding: 24, background: '#fafafa', border: '1px dashed #e9e9e9', borderRadius: 2 }}>
                    {steps[currentStep].content}
                </div>
            </Card>
        </div>
    );
};

export default WelcomeWizardPage;