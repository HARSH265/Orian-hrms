import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { List, Button, Card, Typography, Modal, Form, Input, message, Spin, Descriptions, Divider } from 'antd';
import { fetchTeamReviews, submitManagerReview } from '../../features/review/reviewThunks';
import StatusTag from '../common/StatusTag';

const { Title, Text, Paragraph } = Typography;

const TeamReviews = () => {
    const dispatch = useDispatch();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);
    const [form] = Form.useForm();

    const { teamReviews, status } = useSelector((state) => state.review);

    useEffect(() => {
        dispatch(fetchTeamReviews());
    }, [dispatch]);

    const showModal = (review) => {
        setSelectedReview(review);
        form.setFieldsValue(review.managerReview);
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setSelectedReview(null);
        form.resetFields();
    };

    const onFinish = (values) => {
        dispatch(submitManagerReview({ reviewId: selectedReview._id, managerReview: values }))
            .unwrap()
            .then(() => {
                message.success('Manager review submitted successfully!');
                handleCancel();
            })
            .catch((err) => message.error(err));
    };

    if (status === 'loading' && teamReviews.length === 0) return <Spin />;

    return (
        <>
            <List
                dataSource={teamReviews}
                renderItem={review => (
                    <List.Item>
                        <Card style={{ width: '100%' }}>
                             <Descriptions title={`${review.employee.name} - ${review.cycleName}`} bordered>
                                <Descriptions.Item label="Status">
                                    <StatusTag status={review.status} />
                                </Descriptions.Item>
                                <Descriptions.Item label="Self-Assessment Submitted">
                                    {review.employeeSubmitDate ? new Date(review.employeeSubmitDate).toLocaleDateString() : 'Pending'}
                                </Descriptions.Item>
                                <Descriptions.Item label="Action">
                                    <Button 
                                        type="primary" 
                                        onClick={() => showModal(review)}
                                        disabled={review.status === 'Pending Self-Assessment'}
                                    >
                                        {review.status === 'Pending Manager Review' ? 'Complete Manager Review' : 'View Review'}
                                    </Button>
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>
                    </List.Item>
                )}
                 locale={{ emptyText: "You have no performance reviews to conduct." }}
            />
            
            <Modal
                title={`Manager Review for ${selectedReview?.employee?.name}`}
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
                width={800}
            >
                <Title level={4}>Employee Self-Assessment</Title>
                <Card bordered>
                    <Title level={5}>Strengths</Title>
                    <Paragraph>{selectedReview?.selfAssessment?.strengths || <Text type="secondary">Not provided.</Text>}</Paragraph>
                    <Title level={5}>Areas for Improvement</Title>
                    <Paragraph>{selectedReview?.selfAssessment?.areasForImprovement || <Text type="secondary">Not provided.</Text>}</Paragraph>
                    <Title level={5}>Feedback</Title>
                    <Paragraph>{selectedReview?.selfAssessment?.feedback || <Text type="secondary">Not provided.</Text>}</Paragraph>
                </Card>

                <Divider />

                <Title level={4}>Manager's Review</Title>
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Title level={5}>Overall Performance Feedback</Title>
                    <Form.Item name="overallPerformance"><Input.TextArea rows={4} /></Form.Item>
                    
                    <Title level={5}>Goals for Next Cycle</Title>
                    <Form.Item name="goalsForNextCycle"><Input.TextArea rows={4} /></Form.Item>
                    
                    <Title level={5}>Constructive Feedback for Employee</Title>
                    <Form.Item name="managerFeedback"><Input.TextArea rows={4} /></Form.Item>

                    {selectedReview?.status === 'Pending Manager Review' && (
                        <Button type="primary" htmlType="submit" loading={status === 'loading'}>Submit Final Review</Button>
                    )}
                </Form>
            </Modal>
        </>
    );
};

export default TeamReviews;