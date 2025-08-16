import React from 'react';
import { Upload, message, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';

// This is a reusable component that takes a callback function.
// When an upload is successful, it calls the callback with the file path.
const FileUpload = ({ onUploadSuccess }) => {
    const { token } = useSelector((state) => state.auth);

    const props = {
        name: 'file', // This MUST match the name in our multer middleware: upload.single('file')
        action: 'http://localhost:5001/api/upload', // The API endpoint for uploads
        headers: {
            Authorization: `Bearer ${token}`, // Send the auth token with the upload request
        },
        multiple: false,
        beforeUpload: (file) => {
            const isJpgOrPngOrPdf = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'application/pdf';
            if (!isJpgOrPngOrPdf) {
                message.error('You can only upload JPG, PNG, or PDF files!');
            }
            const isLt10M = file.size / 1024 / 1024 < 10;
            if (!isLt10M) {
                message.error('File must be smaller than 10MB!');
            }
            return isJpgOrPngOrPdf && isLt10M;
        },
        onChange(info) {
            if (info.file.status === 'uploading') {
                // You can add a loading state here if you want
            }
            if (info.file.status === 'done') {
                message.success(`${info.file.name} file uploaded successfully`);
                // When the upload is finished, call the parent component's function
                // and pass it the URL of the uploaded file.
                if (info.file.response && info.file.response.filePath) {
                    onUploadSuccess(info.file.response.filePath);
                }
            } else if (info.file.status === 'error') {
                message.error(`${info.file.name} file upload failed.`);
            }
        },
    };

    return (
        <Upload {...props}>
            <Button icon={<UploadOutlined />}>Click to Upload</Button>
        </Upload>
    );
};

export default FileUpload;