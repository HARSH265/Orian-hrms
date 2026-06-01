import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, List, Spin, Alert, Input, Typography, Button, message } from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import { fetchChatDirectory } from '../features/admin/adminThunks';
import { findOrCreateConversation } from '../features/chat/chatThunks';

const { Meta } = Card;
const { Title } = Typography;
const { Search } = Input;

const DirectoryPage = () => {
    const dispatch = useDispatch();
    const [searchTerm, setSearchTerm] = useState('');

    // We get the list of users from the adminSlice, where our new thunk places them.
    const { users: directoryUsers, status, error } = useSelector((state) => state.admin);

    useEffect(() => {
        dispatch(fetchChatDirectory());
    }, [dispatch]);

    const handleStartChat = (recipientId) => {
        dispatch(findOrCreateConversation(recipientId))
            .unwrap()
            .then((conversation) => {
                message.success(`Chat with ${conversation.participants.find(p => p._id !== recipientId)?.name} is ready!`);
                // Future enhancement: Automatically open the chat widget.
            })
            .catch(err => {
                message.error(err || 'Could not start chat.');
            });
    };

    const filteredUsers = directoryUsers.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (status === 'loading') {
        return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
    }

    if (status === 'failed') {
        return <Alert message="Error" description={error} type="error" showIcon />;
    }

    return (
        <Card>
            <Title level={2}>Company Directory</Title>
            <Search
                placeholder="Search for colleagues..."
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ marginBottom: '24px' }}
            />
            <List
                grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4, xl: 5 }}
                dataSource={filteredUsers}
                renderItem={(user) => (
                    <List.Item>
                        <Card
                            hoverable
                            cover={
                                <img
                                    alt={user.name}
                                    src={user.profilePictureUrl || '/default-avatar.png'} // Provide a default avatar
                                    style={{ height: 200, objectFit: 'cover' }}
                                />
                            }
                            actions={[
                                <Button
                                    type="text"
                                    icon={<MessageOutlined />}
                                    key="message"
                                    onClick={() => handleStartChat(user._id)}
                                >
                                    Message
                                </Button>
                            ]}
                        >
                            <Meta
                                title={user.name}
                                description={user.jobTitle || 'N/A'}
                            />
                        </Card>
                    </List.Item>
                )}
                locale={{ emptyText: "No colleagues found." }}
            />
        </Card>
    );
};

export default DirectoryPage;