import React from 'react';
import { Card, Typography, List, Statistic, Progress, Empty, Space, Avatar } from 'antd';
import { BarChartOutlined, MessageOutlined, StarOutlined, CommentOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const SurveyResults = ({ surveyResults }) => {
    const { totalResponses, results } = surveyResults;

    const renderResult = (resultItem) => {
        switch (resultItem.questionType) {
            case 'text':
                
                return (
                    <List
                        dataSource={resultItem.results.answers}
                        renderItem={item => (
                            <List.Item>
                                <List.Item.Meta
                                    avatar={<Avatar icon={<CommentOutlined />} />}
                                    description={<Paragraph style={{ margin: 0 }}>"{item}"</Paragraph>}
                                />
                            </List.Item>
                        )}
                        locale={{ emptyText: "No text responses."}}
                    />
                );
            case 'multiple-choice':
                const options = Object.entries(resultItem.results.options);
                return (
                    <List
                        dataSource={options}
                        renderItem={([option, count]) => {
                            const percentage = totalResponses > 0 ? ((count / totalResponses) * 100).toFixed(1) : 0;
                            return (
                                <List.Item>
                                    <div style={{ width: '100%' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <Text>{option}</Text>
                                            <Text strong>{count} vote(s)</Text>
                                        </div>
                                         <Progress percent={percentage} format={(percent) => `${percent}%`} />
                                    </div>
                                </List.Item>
                            );
                        }}
                    />
                );
            case 'rating-scale':
                return (
                    <Statistic 
                        title="Average Rating" 
                        value={resultItem.results.average} 
                        precision={2} 
                        suffix="/ 5"
                        valueStyle={{ color: '#faad14' }}
                        prefix={<StarOutlined />}
                    />
                );
            default:
                return null;
        }
    };

    if (totalResponses === 0) {
        return <Empty description="No responses have been submitted for this survey yet." />;
    }

    return (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
            {results.map((resultItem, index) => (
                <Card key={resultItem.questionId} bordered={false} style={{ background: '#f9f9f9' }}>
                    <Title level={5} type="secondary">{index + 1}. {resultItem.questionText}</Title>
                    {renderResult(resultItem)}
                </Card>
            ))}
        </Space>
    );
};

export default SurveyResults;