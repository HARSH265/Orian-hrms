import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Table, Typography, Card, Select, message } from 'antd';
import { fetchAllReferrals, updateReferralStatus } from '../features/job/jobThunks';

const { Title } = Typography;
const { Option } = Select;

const AdminReferralsPage = () => {
    const dispatch = useDispatch();
    const { referrals, status } = useSelector((state) => state.referral);

    useEffect(() => {
        dispatch(fetchAllReferrals());
    }, [dispatch]);

    const handleStatusChange = (referralId, newStatus) => {
        dispatch(updateReferralStatus({ referralId, status: newStatus })).unwrap()
            .then(() => message.success('Referral status updated.'))
            .catch((err) => message.error(err));
    };

    const columns = [
        { title: 'Candidate Name', dataIndex: 'candidateName', key: 'candidateName' },
        { title: 'Candidate Email', dataIndex: 'candidateEmail', key: 'candidateEmail' },
        { title: 'Referred for', dataIndex: ['job', 'title'], key: 'job' },
        { title: 'Referred by', dataIndex: ['referredBy', 'name'], key: 'referredBy' },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status, record) => (
                <Select defaultValue={status} style={{ width: 140 }} onChange={(value) => handleStatusChange(record._id, value)}>
                    <Option value="Submitted">Submitted</Option>
                    <Option value="In Review">In Review</Option>
                    <Option value="Interviewing">Interviewing</Option>
                    <Option value="Hired">Hired</Option>
                    <Option value="Not a Fit">Not a Fit</Option>
                </Select>
            ),
        },
    ];

    return (
        <Card title={<Title level={3}>Candidate Referrals</Title>}>
            <Table columns={columns} dataSource={referrals} rowKey="_id" loading={status === 'loading'} />
        </Card>
    );
};

export default AdminReferralsPage;