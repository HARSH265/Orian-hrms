import React from 'react';
import { Form, Input, Button, Radio, Rate, Typography, message } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { submitSurveyResponse } from '../../features/survey/surveyThunks'; 
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

const SurveyTaker = ({ survey }) => {
    const [form] = Form.useForm();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { status } = useSelector(state => state.survey);

    const onFinish = (values) => {
        const formattedAnswers = survey.questions.map(q => ({
            questionId: q._id,
            answerValue: values[q._id] || null,
        }));
        
        // --- THIS IS THE FIX: Corrected survey._._id to survey._id ---
        dispatch(submitSurveyResponse({ surveyId: survey._id, answers: formattedAnswers }))
            .unwrap()
            .then(() => {
                message.success('Thank you for your response!');
                navigate('/surveys');
            })
            .catch(err => message.error(err));
    };

    const renderQuestionInput = (question) => {
        switch (question.questionType) {
            case 'text':
                return <Input.TextArea rows={3} />;
            case 'multiple-choice':
                return (
                    <Radio.Group>
                        {question.options.map((option, index) => (
                            <Radio key={index} value={option}>{option}</Radio>
                        ))}
                    </Radio.Group>
                );
            case 'rating-scale':
                return <Rate allowHalf defaultValue={2.5} />;
            default:
                return null;
        }
    };

    return (
        <div>
            <Title level={2}>{survey.title}</Title>
            <Paragraph>{survey.description}</Paragraph>
            <Form form={form} layout="vertical" onFinish={onFinish}>
                {survey.questions.map((question, index) => (
                    <Form.Item
                        key={question._id}
                        name={question._id}
                        label={`${index + 1}. ${question.questionText}`}
                        rules={[{ required: true, message: 'This field is required' }]}
                    >
                        {renderQuestionInput(question)}
                    </Form.Item>
                ))}
                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={status === 'loading'}>
                        Submit Response
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export default SurveyTaker;