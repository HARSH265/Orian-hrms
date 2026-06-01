import React, { useState } from 'react';
import { Modal, Form, Input, Button, Checkbox, message } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { uploadDocument } from '../../features/document/documentThunks';
import FileUpload from '../FileUpload'; // Reusing our existing FileUpload component

const UploadDocumentModal = ({ open, onCancel }) => {
    const [form] = Form.useForm();
    const dispatch = useDispatch();
    const { status } = useSelector(state => state.document);
    const [fileUrl, setFileUrl] = useState(null);

    const handleFinish = (values) => {
        if (!fileUrl) {
            message.error('Please upload a file first.');
            return;
        }
        const documentData = { ...values, fileUrl };
        dispatch(uploadDocument(documentData))
            .unwrap()
            .then(() => {
                message.success('Document uploaded successfully!');
                form.resetFields();
                setFileUrl(null);
                onCancel();
            })
            .catch(err => message.error(err));
    };

    const handleUploadSuccess = (url) => {
        setFileUrl(url);
        message.success('File is ready to be saved with details.');
    };

    return (
        <Modal
            title="Upload New Document"
            open={open}
            onCancel={onCancel}
            footer={null}
        >
            <Form form={form} layout="vertical" onFinish={handleFinish}>
                <Form.Item label="Upload File" required>
                    <FileUpload onUploadSuccess={handleUploadSuccess} />
                    {fileUrl && <span style={{ color: 'green', marginLeft: '10px' }}>File uploaded!</span>}
                </Form.Item>
                <Form.Item name="title" label="Document Title" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>
                <Form.Item name="description" label="Description">
                    <Input.TextArea rows={2} />
                </Form.Item>
                <Form.Item name="category" label="Category" initialValue="General">
                    <Input />
                </Form.Item>
                <Form.Item name="acknowledgementRequired" valuePropName="checked">
                    <Checkbox>Require employees to acknowledge this document</Checkbox>
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={status === 'loading'}>
                        Save Document
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default UploadDocumentModal;