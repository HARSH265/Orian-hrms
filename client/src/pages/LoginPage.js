// src/pages/LoginPage.js
import React, { useEffect } from 'react';
import { Form, Input, Button, Alert, Card, Typography } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../features/auth/authThunks';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const LoginPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    // Select state from the Redux store
    const { status, error, token } = useSelector((state) => state.auth);

    const onFinish = (values) => {
        dispatch(loginUser(values));
    };

    // Redirect on successful login
    useEffect(() => {
        if (token) {
            navigate('/');
        }
    }, [token, navigate]);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <Card style={{ width: 400 }}>
                <Title level={2} style={{ textAlign: 'center' }}>Orion Login</Title>
                <Form name="login" onFinish={onFinish} layout="vertical">
                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[{ required: true, type: 'email', message: 'Please input a valid email!' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        label="Password"
                        name="password"
                        rules={[{ required: true, message: 'Please input your password!' }]}
                    >
                        <Input.Password />
                    </Form.Item>

                    {error && <Alert message={error} type="error" showIcon style={{ marginBottom: '24px' }} />}

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={status === 'loading'} block>
                            Log In
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default LoginPage;