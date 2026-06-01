// In: client/src/pages/AdminOrgChartEditorPage.js

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ReactFlow, {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Spin, message, Modal, Alert, Button, Typography } from 'antd';
import { fetchAllUsers, updateUser } from '../features/admin/adminThunks';
import OrgChartNode from '../components/org-chart/OrgChartNode';

const { Title, Text } = Typography;

const getLayoutedElements = (users) => {
    if (!users || users.length === 0) return { nodes: [], edges: [] };

    const nodes = [];
    const edges = [];
    const userMap = new Map(users.map(u => [u._id, { ...u, children: [] }]));
    
    users.forEach(user => {
        const managerId = user.manager?._id; 
        if (managerId && userMap.has(managerId)) {
            userMap.get(managerId).children.push(user._id);
        }
    });

    const positionNodes = (userId, x = 0, y = 0) => {
        const user = userMap.get(userId);
        if (!user || nodes.some(n => n.id === userId)) return;
        
        nodes.push({ 
            id: user._id, 
            type: 'orgNode',
            data: { 
                label: user.name, 
                jobTitle: user.jobTitle,
                department: user.department,
                profilePictureUrl: user.profilePictureUrl
            }, 
            position: { x, y } 
        });

        const childY = y + 200;
        const totalWidth = (user.children.length - 1) * 250;
        let childX = x - totalWidth / 2;
        
        user.children.forEach((childId) => {
            positionNodes(childId, childX, childY);
            edges.push({ id: `e-${user._id}-${childId}`, source: user._id, target: childId, type: 'smoothstep' });
            childX += 250;
        });
    };

    const rootUsers = users.filter(u => !u.manager);
    let currentX = 0;
    rootUsers.forEach((rootUser) => {
        positionNodes(rootUser._id, currentX, 0);
        currentX += 600;
    });
    
    return { nodes, edges };
};

const nodeTypes = { orgNode: OrgChartNode };

const AdminOrgChartEditorPage = () => {
  const dispatch = useDispatch();
  const { users, status, error } = useSelector((state) => state.admin);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({ employee: null, newManager: null });

  useEffect(() => { dispatch(fetchAllUsers()); }, [dispatch]);

  useEffect(() => {
    if (users.length > 0) {
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(users);
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
    }
  }, [users, setNodes, setEdges]);
  
  const onConnect = useCallback((params) => {
    const { source: newManagerId, target: employeeId } = params;
    const employee = users.find(u => String(u._id) === String(employeeId));
    const newManager = users.find(u => String(u._id) === String(newManagerId));

    if (!employee || !newManager) return;

    const currentManagerId = employee.manager ? String(employee.manager._id) : null;
    if (String(newManagerId) === String(employeeId) || currentManagerId === String(newManagerId)) {
      return;
    }

    setModalContent({ employee, newManager });
    setIsModalVisible(true);
  }, [users]);

  const handleModalOk = () => {
    const { employee, newManager } = modalContent;
    if (!employee || !newManager) return;

    setEdges((currentEdges) => {
      const edgesWithoutOldConnection = currentEdges.filter(
        (edge) => String(edge.target) !== String(employee._id)
      );
      const newEdge = {
        id: `e-${String(newManager._id)}-${String(employee._id)}`,
        source: String(newManager._id),
        target: String(employee._id),
        type: 'smoothstep',
      };
      return [...edgesWithoutOldConnection, newEdge];
    });

    dispatch(updateUser({ userId: employee._id, userData: { manager: newManager._id } }))
      .unwrap()
      .then(() => {
        message.success('Organizational chart updated successfully!');
        dispatch(fetchAllUsers()); // Re-fetch to confirm server state
      })
      .catch((err) => {
        message.error(err || 'Failed to update manager.');
        dispatch(fetchAllUsers()); // Revert to server state on error
      })
      .finally(() => {
        setIsModalVisible(false);
      });
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
  };

  if (status === 'loading' && nodes.length === 0) {
    return <Spin size="large" style={{ display: 'block', marginTop: '50px' }} />;
  }
  if (status === 'failed' && nodes.length === 0) {
    return <Alert message="Error" description={error} type="error" showIcon />;
  }

  return (
    <div style={{ height: '80vh', width: '100%', padding: '1rem', background: '#f8f9fa' }}>
      <Title level={3}>Interactive Organization Chart</Title>
      <Text type="secondary">Drag from a manager's connection point to an employee's to reassign.</Text>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Controls />
          <Background variant="dots" />
        </ReactFlow>
      </ReactFlowProvider>
      <Modal
        title="Confirm Manager Change"
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText="Confirm"
        cancelText="Cancel"
        confirmLoading={status === 'loading'}
      >
        {modalContent.employee && modalContent.newManager && (
          <p>Are you sure you want to make <strong>{modalContent.newManager.name}</strong> the new manager of <strong>{modalContent.employee.name}</strong>?</p>
        )}
      </Modal>
    </div>
  );
};

export default AdminOrgChartEditorPage;