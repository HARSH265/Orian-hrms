import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, message, Alert } from 'antd';
import { MailOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { loginUser } from '../features/auth/authThunks';

const { Title } = Typography;

const LoginPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { status, error, user } = useSelector((state) => state.auth);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState(''); // Store password for the 2FA step
    const [twoFactorRequired, setTwoFactorRequired] = useState(false);

    // This effect is still useful for auto-redirecting an already logged-in user
    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    const onFinish = (values) => {
        // Store credentials in case they are needed for the 2FA step
        if (values.email) setEmail(values.email);
        if (values.password) setPassword(values.password);

        // Construct the payload, ensuring we use stored credentials if this is the 2FA step
        const payload = {
            email: values.email || email,
            password: values.password || password,
            twoFactorCode: values.twoFactorCode,
        };

        dispatch(loginUser(payload))
            .unwrap()
            .then((result) => {
                // The thunk now tells us exactly what to do
                if (result.twoFactorRequired) {
                    setTwoFactorRequired(true);
                } else if (result.loginSuccess) {
                    navigate('/');
                }
            })
            .catch((err) => {
                // The thunk's rejectWithValue will be caught here
                message.error(err || 'An error occurred during login.');
            });
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
            <Card style={{ width: '100%', maxWidth: 400, margin: '0 16px' }}>
                <Title level={2} style={{ textAlign: 'center' }}>Orion HRMS Login</Title>
                
                {twoFactorRequired ? (
                    <Form onFinish={onFinish}>
                        <Alert message="Enter the 6-digit code from your authenticator app." type="info" showIcon style={{ marginBottom: 24 }} />
                        <Form.Item name="twoFactorCode" rules={[{ required: true, message: 'Please enter your 2FA code.' }]}>
                            <Input prefix={<SafetyCertificateOutlined />} placeholder="6-digit code" size="large" autoFocus />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" block loading={status === 'loading'} size="large">Verify</Button>
                        </Form.Item>
                        <Button type="link" onClick={() => setTwoFactorRequired(false)}>Back to login</Button>
                    </Form>
                ) : (
                    <Form onFinish={onFinish}>
                        <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Please input a valid email!' }]}>
                            <Input prefix={<MailOutlined />} placeholder="Email" size="large" />
                        </Form.Item>
                        <Form.Item name="password" rules={[{ required: true, message: 'Please input your password!' }]}>
                            <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
                        </Form.Item>
                        {status === 'failed' && <Alert message={error} type="error" showIcon style={{ marginBottom: 24 }} />}
                        <Form.Item>
                            <Button type="primary" htmlType="submit" block loading={status === 'loading'} size="large">
                                Log In
                            </Button>
                        </Form.Item>
                    </Form>
                )}
            </Card>
        </div>
    );
};

export default LoginPage;