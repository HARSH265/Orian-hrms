import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { List, Card, Typography, Spin, Button, Empty } from 'antd';
import { Link } from 'react-router-dom';
import { fetchMyAssignedSurveys } from '../features/survey/surveyThunks';
import { format } from 'date-fns/format';

const { Title, Text } = Typography;

const MySurveysPage = () => {
    const dispatch = useDispatch();
    const { mySurveys, status } = useSelector(state => state.survey);

    useEffect(() => {
        dispatch(fetchMyAssignedSurveys());
    }, [dispatch]);

    if (status === 'loading') {
        return <Spin />;
    }

    return (
        <div>
            <Title level={2}>My Surveys</Title>
            <Text type="secondary">Please complete the surveys assigned to you.</Text>
            
            {mySurveys.length > 0 ? (
                <List
                    grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 3 }}
                    dataSource={mySurveys}
                    renderItem={survey => (
                        <List.Item>
                            <Card
                                title={survey.title}
                                actions={[
                                    <Link to={`/surveys/${survey._id}`}>
                                        <Button type="primary">Take Survey</Button>
                                    </Link>
                                ]}
                            >
                                <Text>Created on: {format(new Date(survey.createdAt), 'MMM d, yyyy')}</Text>
                            </Card>
                        </List.Item>
                    )}
                />
            ) : (
                <Empty description="You have no pending surveys. Great job!" style={{ marginTop: '48px' }}/>
            )}
        </div>
    );
};

export default MySurveysPage;