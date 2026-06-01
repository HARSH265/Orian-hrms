import React, { useEffect, useState } from 'react';
import { Modal, Form, Select, Input, Button, message } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { createKudos } from '../../features/kudos/kudosThunks';

const { Option } = Select;
const { TextArea } = Input;

const GiveKudosModal = ({ visible, onCancel }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const { allUsers } = useSelector((state) => state.directory); // Assuming you have an `allUsers` array in your directory slice
  const { status: kudosStatus, error } = useSelector((state) => state.kudos);
  const { user: currentUser } = useSelector((state) => state.auth);

  // Example company values. You can make this dynamic later.
  const companyValues = ['Teamwork', 'Innovation', 'Customer Focus', 'Integrity', 'Ownership'];

  const handleFinish = (values) => {
    dispatch(createKudos(values))
      .unwrap()
      .then(() => {
        message.success('Kudos sent successfully!');
        form.resetFields();
        onCancel();
      })
      .catch((err) => {
        // Error is already in the slice, but you can show a message here if you want.
        message.error(err || 'Failed to send kudos.');
      });
  };
  
  const filteredUsers = allUsers.filter(user => user._id !== currentUser?._id);

  return (
    <Modal
      title="Give Kudos"
      open={visible}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ message: '', companyValue: null }}
      >
        <Form.Item
          name="recipientId"
          label="Recipient"
          rules={[{ required: true, message: 'Please select a recipient.' }]}
        >
          <Select
            showSearch
            placeholder="Select a person"
            optionFilterProp="children"
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {filteredUsers.map((user) => (
              <Option key={user._id} value={user._id}>
                {user.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="message"
          label="Message"
          rules={[{ required: true, message: 'Please write a message.' }, { max: 280, message: 'Message cannot exceed 280 characters.' }]}
        >
          <TextArea rows={4} placeholder="Why are you giving them kudos?" />
        </Form.Item>

        <Form.Item
          name="companyValue"
          label="Company Value (Optional)"
        >
          <Select placeholder="Select a company value" allowClear>
            {companyValues.map((value) => (
              <Option key={value} value={value}>
                {value}
              </Option>
            ))}
          </Select>
        </Form.Item>
        
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={kudosStatus === 'loading'}>
            Send Kudos
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default GiveKudosModal;