import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Table, Button, Modal, Form, Input, InputNumber, message, Typography, Space, Popconfirm, Switch } from 'antd';
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '../features/expense/expenseCategoryThunks';

const { Title } = Typography;

const AdminExpenseCategoriesPage = () => {
  const dispatch = useDispatch();
  const { categories, status } = useSelector((state) => state.expenseCategories);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleCreate = () => {
    setEditingCategory(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingCategory(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteCategory(id)).unwrap();
      message.success('Category archived.');
    } catch (err) {
      message.error(`Failed: ${err}`);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingCategory) {
        await dispatch(updateCategory({ id: editingCategory._id, ...values })).unwrap();
        message.success('Category updated.');
      } else {
        await dispatch(createCategory(values)).unwrap();
        message.success('Category created.');
      }
      setModalOpen(false);
      setEditingCategory(null);
    } catch (err) {
      if (err?.message) message.error(err.message);
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Description', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: 'Sort Order', dataIndex: 'sortOrder', key: 'sortOrder', width: 100 },
    {
      title: 'Active', dataIndex: 'isActive', key: 'isActive', width: 100,
      render: (val) => (val !== false ? 'Yes' : 'No'),
    },
    {
      title: 'Actions', key: 'actions', width: 200,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => handleEdit(record)}>Edit</Button>
          <Popconfirm title="Archive this category?" onConfirm={() => handleDelete(record._id)}>
            <Button size="small" danger>Archive</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card title={<Title level={3}>Expense Categories</Title>}
      extra={<Button type="primary" onClick={handleCreate}>Add Category</Button>}
    >
      <Table columns={columns} dataSource={categories} rowKey="_id" loading={status === 'loading'} scroll={{ x: true }} />
      <Modal
        title={editingCategory ? 'Edit Category' : 'New Category'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => { setModalOpen(false); setEditingCategory(null); }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please enter a name' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="sortOrder" label="Sort Order">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default AdminExpenseCategoriesPage;
