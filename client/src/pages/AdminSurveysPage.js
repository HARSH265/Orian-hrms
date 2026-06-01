import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Table, Typography, Tag, Space, Modal, Popconfirm, message } from 'antd';
import { PlusOutlined, EyeOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { fetchAllSurveys, closeSurvey } from '../features/survey/surveyThunks';
import { fetchAllUsers } from '../features/admin/adminThunks';
import SurveyBuilder from '../components/survey/SurveyBuilder';
import EditSurveyModal from '../components/survey/EditSurveyModal';
import { format } from 'date-fns/format';
import { Link } from 'react-router-dom';

const { Title } = Typography;

const AdminSurveysPage = () => {
    const dispatch = useDispatch();
    const { surveys, status } = useSelector(state => state.survey);
    const [isBuilderVisible, setIsBuilderVisible] = useState(false);
    
    // --- 1. REQUIRED STATE FOR THE EDIT MODAL ---
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editingSurvey, setEditingSurvey] = useState(null);

    useEffect(() => {
        dispatch(fetchAllSurveys());
        dispatch(fetchAllUsers());
    }, [dispatch]);

    const handleCloseSurvey = (surveyId) => {
        dispatch(closeSurvey(surveyId))
            .unwrap()
            .then(() => message.success('Survey has been closed.'))
            .catch((err) => message.error(err));
    };
    
    // --- 2. HANDLER FUNCTION TO OPEN THE MODAL ---
    const handleEditClick = (survey) => {
        setEditingSurvey(survey);
        setIsEditModalVisible(true);
    };

    const columns = [
        { title: 'Title', dataIndex: 'title', key: 'title' },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: status => {
                const color = status === 'active' ? 'green' : status === 'closed' ? 'volcano' : 'geekblue';
                return <Tag color={color}>{status.toUpperCase()}</Tag>;
            },
        },
        { title: 'Recipients', dataIndex: 'recipients', key: 'recipients', render: r => r.length },
        { title: 'Created', dataIndex: 'createdAt', key: 'createdAt', render: date => format(new Date(date), 'MMM d, yyyy') },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space size="middle">
                    <Link to={`/admin/surveys/${record._id}/results`}>
                        <Button icon={<EyeOutlined />}>Results</Button>
                    </Link>
                    {/* --- 3. THE BUTTON WITH THE onClick HANDLER --- */}
                    {record.status !== 'closed' && (
                        <Button icon={<EditOutlined />} onClick={() => handleEditClick(record)}>Edit</Button>
                    )}
                    {record.status === 'active' && (
                        <Popconfirm
                            title="Close this survey?"
                            description="Respondents will no longer be able to submit answers. This cannot be undone."
                            onConfirm={() => handleCloseSurvey(record._id)}
                            okText="Yes, close it"
                            cancelText="No"
                        >
                            <Button icon={<DeleteOutlined />} danger>Close</Button>
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ];

    const handleSurveyCreated = () => {
        setIsBuilderVisible(false);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={2}>Survey Management</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsBuilderVisible(true)}>
                    Create Survey
                </Button>
            </div>
            
            <Table
                columns={columns}
                dataSource={surveys}
                rowKey="_id"
                loading={status === 'loading'}
            />

            <Modal
                title="Create New Survey"
                open={isBuilderVisible}
                onCancel={() => setIsBuilderVisible(false)}
                footer={null}
                width={800}
            >
                {isBuilderVisible && (
                    <SurveyBuilder 
                        onSurveyCreated={handleSurveyCreated}
                        onCancel={() => setIsBuilderVisible(false)}
                    />
                )}
            </Modal>

            {/* --- 4. THE EDIT MODAL RENDERED IN THE COMPONENT --- */}
            {/* It's important that this component is present and its `open` prop is tied to the state */}
            {editingSurvey && (
                <EditSurveyModal 
                    open={isEditModalVisible}
                    onCancel={() => setIsEditModalVisible(false)}
                    survey={editingSurvey}
                />
            )}
        </div>
    );
};

export default AdminSurveysPage;