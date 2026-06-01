import React from 'react';
import { Card, Avatar, Typography, Tag, Tooltip } from 'antd';
import { UserOutlined, ArrowRightOutlined } from '@ant-design/icons';
// --- THIS IS THE FIX ---
import dayjs from 'dayjs';

const { Text, Paragraph } = Typography;

const KudosCard = ({ kudos }) => {
  const { sender, recipient, message, companyValue, createdAt } = kudos;

  return (
    <Card 
      style={{ marginBottom: 16, borderLeft: '4px solid #1890ff' }}
      bodyStyle={{ padding: '16px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title={sender.name}>
            <Avatar src={sender.profilePictureUrl} icon={<UserOutlined />} />
          </Tooltip>
          <ArrowRightOutlined style={{ margin: '0 12px', color: 'rgba(0,0,0,0.45)' }} />
          <Tooltip title={recipient.name}>
            <Avatar src={recipient.profilePictureUrl} icon={<UserOutlined />} />
          </Tooltip>
          <Text strong style={{ marginLeft: 12 }}>{recipient.name}</Text>
        </div>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {dayjs(createdAt).format('MMM D, YYYY')}
        </Text>
      </div>

      <Paragraph>"{message}"</Paragraph>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        {companyValue && <Tag color="blue">{companyValue}</Tag>}
        <Text type="secondary" style={{ fontSize: '12px', marginLeft: 'auto' }}>
          From: {sender.name}
        </Text>
      </div>
    </Card>
  );
};

export default React.memo(KudosCard);