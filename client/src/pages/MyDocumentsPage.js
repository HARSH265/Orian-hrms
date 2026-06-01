import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { List, Card, Typography, Spin, Button, message, Tag, Empty, Tooltip } from 'antd';
import { CheckCircleOutlined, DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
import { fetchMyDocuments, acknowledgeDocument } from '../features/document/documentThunks';
import { format } from 'date-fns/format';

const { Title, Text, Paragraph } = Typography;

const MyDocumentsPage = () => {
    const dispatch = useDispatch();
    const { employeeDocuments, status } = useSelector(state => state.document);
    const { user } = useSelector(state => state.auth);

    useEffect(() => {
        dispatch(fetchMyDocuments());
    }, [dispatch]);

    const handleAcknowledge = (docId) => {
        dispatch(acknowledgeDocument(docId))
            .unwrap()
            .then(() => message.success('Document acknowledged.'))
            .catch((err) => message.error(err));
    };

    const renderActions = (doc) => {
        const hasAcknowledged = doc.acknowledgedBy.some(ack => ack.user === user?._id);
        const actions = [
            // --- REVERTED CODE: Button is now disabled ---
            <Tooltip key="view-doc" title="Viewing is temporarily unavailable while we resolve an issue.">
                <Button icon={<DownloadOutlined />} disabled>View/Download</Button>
            </Tooltip>
        ];

        if (doc.acknowledgementRequired) {
            if (hasAcknowledged) {
                actions.push(
                    <Tag key="ack-tag" icon={<CheckCircleOutlined />} color="success">
                        You acknowledged this
                    </Tag>
                );
            } else {
                actions.push(
                    <Button key="ack-btn" type="primary" onClick={() => handleAcknowledge(doc._id)} loading={status === 'loading'}>
                        Acknowledge
                    </Button>
                );
            }
        }
        return actions;
    };

    return (
        <div>
            <Title level={2}>Company Documents & Policies</Title>
            <Paragraph type="secondary">Here you can find important company documents. Some may require your acknowledgement.</Paragraph>

            {employeeDocuments.length > 0 ? (
                <List
                    grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 3 }}
                    dataSource={employeeDocuments}
                    renderItem={doc => (
                        <List.Item>
                            <Card
                                title={<span><FileTextOutlined style={{ marginRight: 8 }} />{doc.title}</span>}
                                actions={renderActions(doc)}
                            >
                                <Card.Meta
                                    description={doc.description}
                                />
                                <div style={{ marginTop: 16, fontSize: '12px', color: '#888' }}>
                                    <Text type="secondary">Category: {doc.category}</Text><br/>
                                    <Text type="secondary">Last Updated: {format(new Date(doc.updatedAt), 'MMM d, yyyy')}</Text>
                                </div>
                            </Card>
                        </List.Item>
                    )}
                />
            ) : (
                <Empty description="No company documents have been uploaded yet." style={{ marginTop: 48 }} />
            )}
        </div>
    );
};

export default MyDocumentsPage;