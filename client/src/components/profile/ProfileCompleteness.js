import React, { useMemo } from 'react';
import { Card, Progress, Typography, List, Button } from 'antd';
import { Link } from 'react-router-dom'; // Assuming you might link to edit sections later
import { CheckCircleOutlined, ArrowRightOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const ProfileCompleteness = ({ user }) => {
    
    // useMemo will efficiently recalculate the progress only when the user object changes.
    const { percentage, suggestions } = useMemo(() => {
        if (!user) return { percentage: 0, suggestions: [] };

        const checks = [
            { key: 'profilePicture', weight: 15, isComplete: user.profilePictureUrl && user.profilePictureUrl !== 'default_avatar.png', suggestion: 'Upload a profile picture' },
            { key: 'phone', weight: 15, isComplete: !!user.phone, suggestion: 'Add your phone number' },
            { key: 'address', weight: 15, isComplete: !!user.address, suggestion: 'Add your address' },
            { key: 'jobTitle', weight: 10, isComplete: !!user.jobTitle, suggestion: 'Confirm your job title' },
            { key: 'emergencyContact', weight: 15, isComplete: !!user.emergencyContact?.name && !!user.emergencyContact?.phone, suggestion: 'Add an emergency contact' },
            { key: 'skills', weight: 15, isComplete: user.skills && user.skills.length > 0, suggestion: 'Add at least one skill' },
            { key: 'personalInfo', weight: 15, isComplete: !!user.personalInfo?.dateOfBirth, suggestion: 'Add your date of birth' },
        ];

        let totalScore = 0;
        const incompleteSuggestions = [];

        checks.forEach(check => {
            if (check.isComplete) {
                totalScore += check.weight;
            } else {
                incompleteSuggestions.push(check);
            }
        });

        // Get the top 3 suggestions to keep the list clean
        const topSuggestions = incompleteSuggestions.slice(0, 3);

        return { percentage: totalScore, suggestions: topSuggestions };
    }, [user]);

    return (
        <Card>
            <Title level={5} style={{ marginBottom: '16px' }}>Profile Completeness</Title>
            <Progress 
                percent={percentage} 
                strokeColor={{ from: '#108ee9', to: '#87d068' }} // Gradient color
            />
            {percentage < 100 ? (
                <div style={{ marginTop: '20px' }}>
                    <Text strong>Complete your profile to unlock its full potential!</Text>
                    <List
                        size="small"
                        dataSource={suggestions}
                        renderItem={(item) => (
                            <List.Item>
                                <Text type="secondary">{item.suggestion}</Text>
                            </List.Item>
                        )}
                        style={{ marginTop: '8px' }}
                    />
                </div>
            ) : (
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <CheckCircleOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                    <Text strong style={{ display: 'block', marginTop: '8px' }}>Your profile is 100% complete!</Text>
                </div>
            )}
        </Card>
    );
};

export default ProfileCompleteness;