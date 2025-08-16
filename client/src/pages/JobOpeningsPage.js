import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { List, Card, Typography, Button, Modal, Form, Input, message, Spin, Empty } from 'antd';
import { fetchAllJobs, submitReferral } from '../features/job/jobThunks';
import FileUpload from '../components/FileUpload'; // <-- 1. IMPORT the FileUpload component

const { Title, Paragraph, Text } = Typography;

const JobOpeningsPage = () => {
    const dispatch = useDispatch();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [form] = Form.useForm();

    // --- 2. NEW: Add state to hold the uploaded resume URL ---
    const [resumeUrl, setResumeUrl] = useState('');

    const { jobs, status } = useSelector((state) => state.job);

    useEffect(() => {
        dispatch(fetchAllJobs());
    }, [dispatch]);

    const showReferralModal = (job) => {
        setSelectedJob(job);
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setSelectedJob(null);
        setResumeUrl(''); // Clear the resume URL when the modal is closed
        form.resetFields();
    };

    // --- 3. UPDATED: onFinish handler to include the resumeUrl ---
    const onFinish = (values) => {
        // Create the final data object, including the URL from our state
        const referralData = { 
            ...values, 
            job: selectedJob._id,
            resumeUrl: resumeUrl // Add the file path to the submission
        };
        
        dispatch(submitReferral(referralData)).unwrap()
            .then(() => {
                message.success('Referral submitted successfully! Thank you.');
                handleCancel();
            })
            .catch((err) => message.error(`Submission failed: ${err}`));
    };

    return (
        <>
            <Card>
                <Title level={2}>Current Job Openings</Title>
                <Paragraph>Interested in a role or know someone who would be a great fit? Submit a referral!</Paragraph>
                
                {status === 'loading' && <Spin />}
                {status === 'succeeded' && jobs.length > 0 ? (
                    <List
                        grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 3 }}
                        dataSource={jobs}
                        renderItem={job => (
                            <List.Item>
                                <Card
                                    title={job.title}
                                    actions={[<Button type="primary" onClick={() => showReferralModal(job)}>Refer a Candidate</Button>]}
                                >
                                    <Text strong>Department:</Text> {job.department?.name}<br />
                                    <Text strong>Location:</Text> {job.location}<br /><br />
                                    <Paragraph ellipsis={{ rows: 4, expandable: true, symbol: 'more' }}>
                                        {job.description}
                                    </Paragraph>
                                </Card>
                            </List.Item>
                        )}
                    />
                ) : status === 'succeeded' && <Empty description="No open positions at the moment. Please check back later." />}
            </Card>

            <Modal
                title={`Refer a Candidate for ${selectedJob?.title}`}
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Form.Item name="candidateName" label="Candidate's Full Name" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="candidateEmail" label="Candidate's Email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
                    <Form.Item name="candidatePhone" label="Candidate's Phone (Optional)"><Input /></Form.Item>
                    
                    {/* --- 4. NEW: The FileUpload component in the form --- */}
                    <Form.Item label="Upload Resume/CV (Optional)">
                        <FileUpload onUploadSuccess={(filePath) => setResumeUrl(filePath)} />
                        {resumeUrl && (
                            <Text type="success" style={{ display: 'block', marginTop: 8 }}>
                                Resume uploaded successfully.
                            </Text>
                        )}
                    </Form.Item>
                    
                    <Form.Item>
                        <Button type="primary" htmlType="submit">Submit Referral</Button>
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default JobOpeningsPage;