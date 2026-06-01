import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { List, Button, Card, Typography, Modal, Form, Input, message, Spin, Tag, Descriptions } from 'antd';
import { fetchMyReviews, submitSelfAssessment } from '../../features/review/reviewThunks';

const { Title, Text } = Typography;

const MyReviews = () => {
    const dispatch = useDispatch();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);
    const [form] = Form.useForm();

    const { myReviews, status } = useSelector((state) => state.review);

    useEffect(() => {
        dispatch(fetchMyReviews());
    }, [dispatch]);

    const showModal = (review) => {
        setSelectedReview(review);
        form.setFieldsValue(review.selfAssessment); // Pre-fill with existing data
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setSelectedReview(null);
        form.resetFields();
    };

    const onFinish = (values) => {
        dispatch(submitSelfAssessment({ reviewId: selectedReview._id, selfAssessment: values }))
            .unwrap()
            .then(() => {
                message.success('Self-assessment submitted successfully!');
                handleCancel();
            })
            .catch((err) => message.error(err));
    };

    if (status === 'loading' && myReviews.length === 0) return <Spin />;

    return (
        <>
            <List
                dataSource={myReviews}
                renderItem={review => (
                    <List.Item>
                        <Card style={{ width: '100%' }}>
                            <Descriptions title={review.cycleName} bordered>
                                <Descriptions.Item label="Status">
                                    <Tag color={review.status === 'Complete' ? 'success' : 'processing'}>{review.status}</Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Manager">{review.manager.name}</Descriptions.Item>
                                <Descriptions.Item label="Action">
                                    <Button type="primary" onClick={() => showModal(review)}>
                                        {review.status === 'Pending Self-Assessment' ? 'Complete Self-Assessment' : 'View Review'}
                                    </Button>
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>
                    </List.Item>
                )}
                locale={{ emptyText: "You have no performance reviews assigned to you yet." }}
            />
            
            <Modal
                title={`Self-Assessment for ${selectedReview?.cycleName}`}
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
                width={700}
            >
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Title level={5}>Your Strengths</Title>
                    <Form.Item name="strengths"><Input.TextArea rows={4} /></Form.Item>
                    
                    <Title level={5}>Areas for Improvement</Title>
                    <Form.Item name="areasForImprovement"><Input.TextArea rows={4} /></Form.Item>
                    
                    <Title level={5}>Feedback for your Manager/Company</Title>
                    <Form.Item name="feedback"><Input.TextArea rows={4} /></Form.Item>

                    {selectedReview?.status === 'Pending Self-Assessment' && (
                        <Button type="primary" htmlType="submit" loading={status === 'loading'}>Submit Assessment</Button>
                    )}
                </Form>
            </Modal>
        </>
    );
};

export default MyReviews;