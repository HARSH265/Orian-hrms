import React from 'react';
import { Form, Input, Button, Select, Checkbox, Space, Card, message, Row, Col } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { createSurvey } from '../../features/survey/surveyThunks';

const { Option } = Select;

const SurveyBuilder = ({ onSurveyCreated, onCancel }) => {
    const [form] = Form.useForm();
    const dispatch = useDispatch();
    const { allUsers } = useSelector(state => state.directory);
    const { status } = useSelector(state => state.survey);

    const onFinish = (values) => {
        if (!values.questions || values.questions.length === 0) {
            message.error('A survey must have at least one question.');
            return;
        }
        dispatch(createSurvey(values)).unwrap()
            .then(() => {
                message.success('Survey created successfully!');
                onSurveyCreated();
            })
            .catch(err => message.error(err));
    };

    return (
        <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
            <Row gutter={16}>
                <Col span={18}>
                    <Form.Item name="title" label="Survey Title" rules={[{ required: true }]}>
                        <Input placeholder="e.g., Quarterly Employee Satisfaction" />
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item name="isAnonymous" label="Anonymous?" valuePropName="checked">
                        <Checkbox>Anonymous Responses</Checkbox>
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item name="description" label="Description">
                <Input.TextArea rows={2} placeholder="A brief description of the survey's purpose." />
            </Form.Item>
            
            <Form.Item name="recipients" label="Recipients" rules={[{ required: true }]}>
                <Select mode="multiple" placeholder="Select employees to send this survey to" showSearch filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} options={allUsers.map(user => ({ label: user.name, value: user._id }))} />
            </Form.Item>

            <Form.List name="questions">
                {(fields, { add, remove }) => (
                    <>
                        {fields.map(({ key, name, ...restField }) => (
                            <Card key={key} style={{ marginBottom: 16 }} bodyStyle={{ padding: '16px' }}>
                                <Form.Item {...restField} name={[name, 'questionText']} label={`Question ${key + 1}`} rules={[{ required: true, message: 'Question text is required' }]}>
                                    <Input placeholder="What is your question?" />
                                </Form.Item>
                                <Form.Item {...restField} name={[name, 'questionType']} initialValue="text" rules={[{ required: true }]}>
                                    <Select style={{ width: 180 }}>
                                        <Option value="text">Text Answer</Option>
                                        <Option value="multiple-choice">Multiple Choice</Option>
                                        <Option value="rating-scale">Rating Scale (1-5)</Option>
                                    </Select>
                                </Form.Item>
                                
                                <Form.Item noStyle shouldUpdate>
                                {() => form.getFieldValue(['questions', name, 'questionType']) === 'multiple-choice' && (
                                    <Form.List name={[name, 'options']}>
                                        {(optionFields, { add: addOption, remove: removeOption }) => (
                                            <>
                                                {optionFields.map(({ key: optionKey, name: optionName, ...restOptionField }) => (
                                                    <Space key={optionKey} style={{ display: 'flex' }} align="baseline">
                                                        <Form.Item {...restOptionField} name={[optionName]} rules={[{ required: true, message: 'Option is required' }]}>
                                                            <Input placeholder={`Option ${optionKey + 1}`} />
                                                        </Form.Item>
                                                        <MinusCircleOutlined onClick={() => removeOption(optionName)} />
                                                    </Space>
                                                ))}
                                                <Form.Item>
                                                    <Button type="dashed" onClick={() => addOption()} block icon={<PlusOutlined />}>Add Option</Button>
                                                </Form.Item>
                                            </>
                                        )}
                                    </Form.List>
                                )}
                                </Form.Item>
                                <Button type="link" danger onClick={() => remove(name)}>Remove Question</Button>
                            </Card>
                        ))}
                        <Form.Item>
                            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Add Question</Button>
                        </Form.Item>
                    </>
                )}
            </Form.List>

            <Form.Item>
                <Space>
                    <Button type="primary" htmlType="submit" loading={status === 'loading'}>Create Survey</Button>
                    <Button onClick={onCancel}>Cancel</Button>
                </Space>
            </Form.Item>
        </Form>
    );
};

export default SurveyBuilder;