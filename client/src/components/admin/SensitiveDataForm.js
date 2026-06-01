import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Form, Input, Button, Spin, Alert, message, InputNumber, Row, Col } from 'antd';
import { fetchSensitiveData, updateSensitiveData } from '../../features/admin/adminThunks';
import { clearSensitiveData } from '../../features/admin/adminSlice';

const SensitiveDataForm = ({ userId, onFinished }) => {
    const dispatch = useDispatch();
    const [form] = Form.useForm();
    const { sensitiveData, status, error } = useSelector(state => state.admin);

    useEffect(() => {
        if (userId) {
            dispatch(fetchSensitiveData(userId));
        }
        // Cleanup function to clear data when the component unmounts
        return () => {
            dispatch(clearSensitiveData());
        }
    }, [userId, dispatch]);

    useEffect(() => {
        // When sensitiveData is fetched, populate the form
        if (sensitiveData) {
            form.setFieldsValue({
                salary: sensitiveData.salary,
                nationalId: sensitiveData.nationalId,
                bankName: sensitiveData.bankInfo?.bankName,
                accountNumber: sensitiveData.bankInfo?.accountNumber,
                routingNumber: sensitiveData.bankInfo?.routingNumber,
            });
        }
    }, [sensitiveData, form]);

    const onFinish = (values) => {
        const formattedData = {
            salary: values.salary,
            nationalId: values.nationalId,
            bankInfo: {
                bankName: values.bankName,
                accountNumber: values.accountNumber,
                routingNumber: values.routingNumber,
            }
        };
        dispatch(updateSensitiveData({ userId, sensitiveData: formattedData }))
            .unwrap()
            .then(() => {
                message.success('Sensitive data updated successfully.');
                onFinished(); // Close the modal
            })
            .catch(err => message.error(err));
    };

    if (status === 'loading' && !sensitiveData) {
        return <div style={{ textAlign: 'center', padding: '50px' }}><Spin /></div>;
    }

    if (status === 'failed' && error) {
        return <Alert message="Error" description={error} type="error" showIcon />;
    }

    return (
        <Form form={form} layout="vertical" onFinish={onFinish}>
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item name="salary" label="Annual Salary">
                        <InputNumber style={{ width: '100%' }} prefix="$" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="nationalId" label="National ID / SSN">
                        <Input />
                    </Form.Item>
                </Col>
            </Row>
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item name="bankName" label="Bank Name">
                        <Input />
                    </Form.Item>
                </Col>
                <Col span={12}>
                     <Form.Item name="routingNumber" label="Routing / SWIFT Code">
                        <Input />
                    </Form.Item>
                </Col>
            </Row>
             <Form.Item name="accountNumber" label="Bank Account Number">
                <Input />
            </Form.Item>
            
            <Form.Item>
                <Button type="primary" htmlType="submit" loading={status === 'loading'}>
                    Save Sensitive Data
                </Button>
            </Form.Item>
        </Form>
    );
};

export default SensitiveDataForm;