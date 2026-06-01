// In: client/src/components/LeaveDetailsModal.js

import React from 'react';
import { Modal, Descriptions, Typography, Button } from 'antd';
import { PaperClipOutlined } from '@ant-design/icons';
import StatusTag from './common/StatusTag';

const { Text, Link } = Typography;

const LeaveDetailsModal = ({ isOpen, onCancel, leaveDetails }) => {
    if (!leaveDetails) return null;

    return (
        <Modal
            title="Leave Request Details"
            open={isOpen}
            onCancel={onCancel}
            footer={[
                <Button key="close" onClick={onCancel}>
                    Close
                </Button>
            ]}
        >
            <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="Leave Type">{leaveDetails.leavePolicy?.name}</Descriptions.Item>
                <Descriptions.Item label="Dates">
                    {`${new Date(leaveDetails.startDate).toLocaleDateString()} - ${new Date(leaveDetails.endDate).toLocaleDateString()}`}
                </Descriptions.Item>
                <Descriptions.Item label="Reason">{leaveDetails.reason}</Descriptions.Item>
                <Descriptions.Item label="Status"><StatusTag status={leaveDetails.status} /></Descriptions.Item>
                
                {/* Conditionally show manager's notes */}
                {(leaveDetails.status === 'Approved' || leaveDetails.status === 'Denied') && (
                    <Descriptions.Item label="Manager's Notes">
                        {leaveDetails.managerNotes || <Text type="secondary">No notes provided.</Text>}
                    </Descriptions.Item>
                )}

                {/* Conditionally show who took the action */}
                {leaveDetails.approvedBy && (
                     <Descriptions.Item label={leaveDetails.status === 'Denied' ? "Denied By" : "Approved By"}>
                        {leaveDetails.approvedBy.name}
                    </Descriptions.Item>
                )}

                {/* Conditionally show attachments */}
                {leaveDetails.attachments && leaveDetails.attachments.length > 0 && (
                    <Descriptions.Item label="Attachment">
                        <Link href={leaveDetails.attachments[0].filePath} target="_blank" rel="noopener noreferrer">
                            <PaperClipOutlined /> {leaveDetails.attachments[0].fileName}
                        </Link>
                    </Descriptions.Item>
                )}
            </Descriptions>
        </Modal>
    );
};

export default LeaveDetailsModal;