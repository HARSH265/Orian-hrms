import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Button, Typography, Spin, Alert, Modal, Input, message, Popconfirm, Steps, Col, Row } from 'antd';
import { generate2FASecret, verify2FACode, disable2FA } from '../../features/auth/authThunks';
import { clear2FASetup } from '../../features/auth/authSlice';

const { Title, Text, Paragraph } = Typography;

const TwoFactorAuthManager = () => {
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    // Destructure one level deeper to get the specific state for the setup process
    const { qrCode, secret, status: setupStatus, error: setupError } = useSelector(state => state.auth.twoFactorSetup);
    const [isSetupModalVisible, setIsSetupModalVisible] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');

    const handleEnableClick = () => {
        setIsSetupModalVisible(true);
        dispatch(generate2FASecret());
    };

  const handleVerify = () => {
    dispatch(verify2FACode(verificationCode.trim()))
      .unwrap()
      .then(() => {
        message.success('Two-Factor Authentication enabled!');
        setIsSetupModalVisible(false);
        setVerificationCode('');
        dispatch(clear2FASetup());
      })
      .catch((err) => {
        message.error(err || 'Verification failed. Please check the code and try again.');
      });
  };

    const handleDisable = () => {
        dispatch(disable2FA())
            .unwrap()
            .then(() => message.success('Two-Factor Authentication disabled.'))
            .catch((err) => message.error(err));
    };

  const handleCancelSetup = () => {
      setIsSetupModalVisible(false);
      setVerificationCode('');
      dispatch(clear2FASetup());
      // Optionally, call a new endpoint to clear temp secret server-side
    };

    // --- THIS IS THE KEY FIX ---
    // We define the content for the modal here, making it easier to manage loading states.
    const renderModalContent = () => {
        if (setupStatus === 'loading' && !qrCode) {
            return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>;
        }

        if (setupStatus === 'failed' && !qrCode) {
            return <Alert message={setupError || 'Failed to generate QR code. Please close and try again.'} type="error" />;
        }

        // Once the QR code is generated, show the full setup steps.
        if (qrCode) {
            return (
                <Steps direction="vertical">
                    <Steps.Step
                        title="Scan the QR Code"
                        status="process"
                        description={
                            <Row justify="center" style={{ margin: '20px 0' }}>
                                <Col>
                                    <img src={qrCode} alt="2FA QR Code" />
                                    <Paragraph style={{ textAlign: 'center', marginTop: '10px' }}>
                                        Can't scan? Enter this key manually:
                                        <br />
                                        <Text code copyable>{secret}</Text>
                                    </Paragraph>
                                </Col>
                            </Row>
                        }
                    />
                    <Steps.Step
                        title="Enter Verification Code"
                        status="process"
                        description={
                            <>
                                <Paragraph>Enter the 6-digit code from your authenticator app below to complete the setup.</Paragraph>
                                <Input
                                    placeholder="123456"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.trim())}
                                    style={{ marginTop: '10px', maxWidth: '200px' }}
                                    maxLength={6}
                                />
                                {setupStatus === 'failed' && <Alert message={setupError} type="error" style={{marginTop: '10px'}}/>}
                            </>
                        }
                    />
                </Steps>
            );
        }
        
        return null; // Should not be reached, but good for safety
    };

    return (
        <Card>
            <Title level={4}>Two-Factor Authentication (2FA)</Title>
            {user?.twoFactorAuth?.isEnabled ? (
                <>
                    <Paragraph><Text strong style={{ color: 'green' }}>Status: Enabled</Text></Paragraph>
                    <Popconfirm
                        title="Disable 2FA?"
                        description="This will remove the extra layer of security from your account."
                        onConfirm={handleDisable}
                        okText="Yes, Disable"
                        cancelText="Cancel"
                    >
                        <Button danger>Disable 2FA</Button>
                    </Popconfirm>
                </>
            ) : (
                <>
                    <Paragraph><Text strong>Status: Disabled</Text></Paragraph>
                    <Button type="primary" onClick={handleEnableClick}>Enable 2FA</Button>
                </>
            )}

            <Modal
                title="Set Up Two-Factor Authentication"
                open={isSetupModalVisible}
                onCancel={handleCancelSetup}
                footer={[
                    <Button key="back" onClick={handleCancelSetup}>
                        Cancel
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        loading={setupStatus === 'loading'}
                        onClick={handleVerify}
                        disabled={!verificationCode || verificationCode.length !== 6}
                    >
                        Verify & Enable
                    </Button>,
                ]}
            >
                {renderModalContent()}
            </Modal>
        </Card>
    );
};

export default TwoFactorAuthManager;