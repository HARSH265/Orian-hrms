import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import { Spin, Alert, Typography, Button, Card, Row, Col, Statistic } from 'antd';
import { ArrowLeftOutlined, TeamOutlined, CheckSquareOutlined } from '@ant-design/icons';
import { fetchSurveyResults, fetchSurveyById } from '../features/survey/surveyThunks';
import SurveyResults from '../components/survey/SurveyResults';

const { Title, Text } = Typography;

const SurveyResultsPage = () => {
    const { surveyId } = useParams();
    const dispatch = useDispatch();
    const { surveyResults, currentSurvey, status, error } = useSelector(state => state.survey);

    useEffect(() => {
        if (surveyId) {
            dispatch(fetchSurveyResults(surveyId));
            dispatch(fetchSurveyById(surveyId));
        }
    }, [surveyId, dispatch]);

    if (status === 'loading' && (!surveyResults || !currentSurvey)) {
        return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>;
    }
    
    if (status === 'failed' && error) {
        return <Alert message="Error" description={error} type="error" />;
    }

    return (
        <div>
             <Link to="/admin/surveys">
                <Button type="text" icon={<ArrowLeftOutlined />} style={{ marginBottom: 16 }}>
                    Back to All Surveys
                </Button>
            </Link>
            
            <Card style={{ marginBottom: 24 }}>
                <Title level={2} style={{ marginTop: 0 }}>{currentSurvey?.title}</Title>
                <Text type="secondary">{currentSurvey?.description}</Text>
                <Row gutter={16} style={{ marginTop: 24 }}>
                    <Col span={12}>
                        <Statistic 
                            title="Total Recipients" 
                            value={currentSurvey?.recipients.length} 
                            prefix={<TeamOutlined />} 
                        />
                    </Col>
                    <Col span={12}>
                        <Statistic 
                            title="Responses Received" 
                            value={surveyResults?.totalResponses} 
                            prefix={<CheckSquareOutlined />} 
                        />
                    </Col>
                </Row>
            </Card>
            
            {surveyResults ? <SurveyResults surveyResults={surveyResults} /> : <Spin />}
        </div>
    );
};

export default SurveyResultsPage;