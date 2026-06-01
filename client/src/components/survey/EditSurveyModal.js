import React, { useEffect } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { updateSurvey } from '../../features/survey/surveyThunks';

// --- 1. THIS IS THE FIX: The component now accepts `open` instead of `visible` ---
const EditSurveyModal = ({ open, onCancel, survey }) => {
    const [form] = Form.useForm();
    const dispatch = useDispatch();
    const { status } = useSelector(state => state.survey);

    useEffect(() => {
        if (survey) {
            form.setFieldsValue({
                title: survey.title,
                description: survey.description,
            });
        }
    }, [survey, form]);

    const handleFinish = (values) => {
        dispatch(updateSurvey({ surveyId: survey._id, surveyData: values }))
            .unwrap()
            .then(() => {
                message.success('Survey updated successfully!');
                onCancel();
            })
            .catch(err => message.error(err));
    };

    return (
        <Modal
            title="Edit Survey Details"
            // --- 2. THE `open` PROP IS NOW CORRECTLY PASSED TO THE ANTD MODAL ---
            open={open}
            onCancel={onCancel}
            footer={null}
        >
            <Form form={form} layout="vertical" onFinish={handleFinish}>
                <Form.Item name="title" label="Survey Title" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>
                <Form.Item name="description" label="Description">
                    <Input.TextArea rows={3} />
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={status === 'loading'}>
                        Save Changes
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default EditSurveyModal;