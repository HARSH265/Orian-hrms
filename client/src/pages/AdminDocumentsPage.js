import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Table, Typography, Tag, Space, Popconfirm, message, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { fetchAllDocuments, softDeleteDocument } from '../features/document/documentThunks';
import UploadDocumentModal from '../components/document/UploadDocumentModal';
import { format } from 'date-fns/format';

const { Title } = Typography;

const AdminDocumentsPage = () => {
    const dispatch = useDispatch();
    const { adminDocuments, status } = useSelector(state => state.document);
    const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);

    useEffect(() => {
        dispatch(fetchAllDocuments());
    }, [dispatch]);

    const handleDelete = (documentId) => {
        dispatch(softDeleteDocument(documentId))
            .unwrap()
            .then(() => message.success('Document archived.'))
            .catch((err) => message.error(err));
    };

    const columns = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            render: (text) => (
                // --- REVERTED CODE: Link is now disabled ---
                <Tooltip title="Viewing is temporarily unavailable while we resolve an issue.">
                    <span style={{ color: 'rgba(0, 0, 0, 0.45)', cursor: 'not-allowed' }}>{text}</span>
                </Tooltip>
            )
        },
        { title: 'Category', dataIndex: 'category', key: 'category' },
        {
            title: 'Status',
            dataIndex: 'isActive',
            key: 'isActive',
            render: isActive => (
                <Tag color={isActive ? 'green' : 'volcano'}>{isActive ? 'ACTIVE' : 'ARCHIVED'}</Tag>
            )
        },
        {
            title: 'Acknowledged',
            key: 'acknowledgements',
            render: (_, record) => `${record.acknowledgedBy.length} user(s)`
        },
        { title: 'Uploaded By', dataIndex: ['uploadedBy', 'name'], key: 'uploadedBy' },
        { title: 'Date Uploaded', dataIndex: 'createdAt', key: 'createdAt', render: date => format(new Date(date), 'MMM d, yyyy') },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                record.isActive && (
                    <Popconfirm
                        title="Archive this document?"
                        description="Users will no longer see it. This can be changed later."
                        onConfirm={() => handleDelete(record._id)}
                        okText="Yes, Archive"
                        cancelText="No"
                    >
                        <Button icon={<DeleteOutlined />} danger>Archive</Button>
                    </Popconfirm>
                )
            ),
        },
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={2}>Document Management</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsUploadModalVisible(true)}>
                    Upload Document
                </Button>
            </div>
            
            <Table
                columns={columns}
                dataSource={adminDocuments}
                rowKey="_id"
                loading={status === 'loading'}
            />

            <UploadDocumentModal
                open={isUploadModalVisible}
                onCancel={() => setIsUploadModalVisible(false)}
            />
        </div>
    );
};

export default AdminDocumentsPage;