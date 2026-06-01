import React, { useState } from 'react';
import { Upload, message, Button, Space, Typography, Spin } from 'antd';
import { UploadOutlined, PaperClipOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import api from '../services/api';

const { Text } = Typography;

const FileUpload = ({ onUploadSuccess, onRemove, disabled = false }) => {
    const { token } = useSelector((state) => state.auth);
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [fileInfo, setFileInfo] = useState(null);

    const handleRemove = async () => {
        if (!fileInfo || !fileInfo.public_id) {
            return;
        }

        setIsDeleting(true);
        try {
            await api.delete('/upload', { data: { public_id: fileInfo.public_id } });
            message.success('File removed successfully.');
            setFileInfo(null);
            if (onRemove) onRemove();
        } catch (error) {
            message.error('Could not remove the file. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    const props = {
        name: 'file',
        action: '/api/upload',
        headers: { Authorization: `Bearer ${token}` },
        multiple: false,
        showUploadList: false,

        beforeUpload: (file) => {
            setIsUploading(true);
            const isAllowedType = ['image/jpeg', 'image/png', 'application/pdf'].includes(file.type);
            if (!isAllowedType) {
                message.error('You can only upload JPG, PNG, or PDF files!');
                setIsUploading(false);
            }
            const isLt10M = file.size / 1024 / 1024 < 10;
            if (!isLt10M) {
                message.error('File must be smaller than 10MB!');
                setIsUploading(false);
            }
            return isAllowedType && isLt10M;
        },

        onChange(info) {
            if (info.file.status === 'done') {
                setIsUploading(false);

                if (info.file.response && info.file.response.success) {
                    message.success(`${info.file.name} file uploaded successfully`);
                    const { filePath, public_id } = info.file.response;
                    
                    if (!public_id) {
                        message.error("Upload succeeded, but an error occurred. Please try again.");
                        return;
                    }

                    setFileInfo({ name: info.file.name, url: filePath, public_id: public_id });
                    onUploadSuccess(filePath);
                } else {
                    message.error(info.file.response?.message || 'Upload failed.');
                }
            } else if (info.file.status === 'error') {
                setIsUploading(false);
                message.error(`${info.file.name} file upload failed.`);
            }
        },
    };

    if (fileInfo) {
        return (
            <div style={{ border: '1px solid #d9d9d9', borderRadius: '6px', padding: '8px 12px' }}>
                <Space>
                    {isDeleting ? <Spin size="small" /> : <PaperClipOutlined />}
                    <Text>{fileInfo.name}</Text>
                    <Button 
                        type="text" 
                        danger 
                        icon={<CloseCircleOutlined />} 
                        onClick={handleRemove}
                        disabled={disabled || isDeleting}
                        loading={isDeleting}
                    />
                </Space>
            </div>
        );
    }

    return (
        <Upload {...props} disabled={disabled || !token}>
            <Button icon={<UploadOutlined />} loading={isUploading} disabled={disabled || !token}>
                {isUploading ? 'Uploading...' : 'Click to Upload'}
            </Button>
        </Upload>
    );
};

export default FileUpload;