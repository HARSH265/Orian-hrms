import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Table, Button, Card, Typography, Modal, Form, Input, message, Select, Space, Popconfirm, Tag } from 'antd';
import { fetchAllJobs, createJob /*, updateJob, deleteJob */ } from '../features/job/jobThunks';
import { fetchAllDepartments } from '../features/department/departmentThunks';

const { Title } = Typography;
const { Option } = Select;

const AdminJobsPage = () => {
    const dispatch = useDispatch();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingJob, setEditingJob] = useState(null);
    const [form] = Form.useForm();
    
    const { jobs, status: jobStatus } = useSelector((state) => state.job);
    const { departments } = useSelector((state) => state.department);

    useEffect(() => {
        dispatch(fetchAllJobs());
        dispatch(fetchAllDepartments());
    }, [dispatch]);

    const showModal = (job = null) => {
        setEditingJob(job);
        form.setFieldsValue(job ? { ...job, department: job.department?._id } : { status: 'Open' });
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingJob(null);
        form.resetFields();
    };

    const onFinish = (values) => {
        // Here you would check if editingJob exists and call updateJob or createJob
        dispatch(createJob(values)).unwrap()
            .then(() => {
                message.success(`Job ${editingJob ? 'updated' : 'created'} successfully!`);
                handleCancel();
            })
            .catch((err) => message.error(err));
    };

    const columns = [
        { title: 'Title', dataIndex: 'title', key: 'title' },
        { title: 'Department', dataIndex: ['department', 'name'], key: 'department' },
        { title: 'Status', dataIndex: 'status', key: 'status', render: status => <Tag color={status === 'Open' ? 'success' : 'default'}>{status}</Tag> },
        { title: 'Posted By', dataIndex: ['postedBy', 'name'], key: 'postedBy' },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button type="link" onClick={() => showModal(record)}>Edit</Button>
                    <Popconfirm title="Are you sure?">
                        <Button type="link" danger>Delete</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <>
            <Card title={<Title level={3}>Manage Job Openings</Title>} extra={<Button type="primary" onClick={() => showModal(null)}>Post New Job</Button>}>
                <Table columns={columns} dataSource={jobs} rowKey="_id" loading={jobStatus === 'loading'} />
            </Card>

            <Modal title={editingJob ? 'Edit Job Opening' : 'Post New Job Opening'} open={isModalVisible} onCancel={handleCancel} footer={null} width={700}>
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Form.Item name="title" label="Job Title" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="department" label="Department" rules={[{ required: true }]}>
                        <Select placeholder="Select a department">{departments.map(d => <Option key={d._id} value={d._id}>{d.name}</Option>)}</Select>
                    </Form.Item>
                   <Form.Item name="location" label="Location Type" rules={[{ required: true }]} initialValue="Remote">
    <Select placeholder="Select a location type">
        <Option value="In Office">In Office</Option>
        <Option value="Remote">Remote</Option>
        <Option value="Hybrid">Hybrid</Option>
    </Select>
</Form.Item>
                    <Form.Item name="status" label="Status" initialValue="Open">
                        <Select><Option value="Open">Open</Option><Option value="On Hold">On Hold</Option><Option value="Closed">Closed</Option></Select>
                    </Form.Item>
                    <Form.Item name="description" label="Job Description" rules={[{ required: true }]}><Input.TextArea rows={10} /></Form.Item>
                    <Form.Item><Button type="primary" htmlType="submit" loading={jobStatus === 'loading'}>Save</Button></Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default AdminJobsPage;