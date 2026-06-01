// In: client/src/components/tasks/kanban/KanbanCard.js

import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Card, Typography, Avatar, Tooltip, Space, Tag, Progress } from 'antd';
import { PaperClipOutlined, CommentOutlined, ApartmentOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;

const KanbanCard = ({ task, index, onCardClick }) => {

    const calculateSubTaskProgress = () => {
        if (!task.subTasks || task.subTasks.length === 0) {
            return null;
        }
        const doneCount = task.subTasks.filter(st => st.status === 'Done').length;
        const totalCount = task.subTasks.length;
        const percent = Math.round((doneCount / totalCount) * 100);
        return <Progress percent={percent} size="small" />;
    };

    // =======================================================================
    // --- THE FIX: Using a softer, more elegant color palette ---
    const priorityStyles = {
        High: {
            name: "High Priority",
            borderColor: '#ffccc7', // Lighter red border
            backgroundColor: '#fff1f0', // Very light red background
            textColor: '#cf1322' // Dark red text for contrast
        },
        Medium: {
            name: "Medium Priority",
            borderColor: '#ffe7ba',
            backgroundColor: '#fff7e6',
            textColor: '#d46b08'
        },
        Low: {
            name: "Low Priority",
            borderColor: '#bae0ff',
            backgroundColor: '#e6f4ff',
            textColor: '#0958d9'
        }
    };
    // =======================================================================
    
    const currentPriority = priorityStyles[task.priority] || priorityStyles.Medium;

    return (
        <Draggable draggableId={task._id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{
                        userSelect: 'none',
                        marginBottom: '8px',
                        ...provided.draggableProps.style,
                    }}
                >
                    <Card
                        hoverable
                        onClick={() => onCardClick(task._id)}
                        bodyStyle={{ padding: '12px' }}
                        style={{
                            border: '1px solid #e8e8e8',
                            borderRadius: '8px',
                            background: snapshot.isDragging ? '#e6f7ff' : 'white',
                            boxShadow: snapshot.isDragging ? '0px 5px 15px rgba(0,0,0,0.1)' : 'none',
                            transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
                        }}
                    >
                        {/* --- THE FIX: Applying the new styles to the Tag --- */}
                        <Tag 
                            style={{
                                marginBottom: '8px',
                                border: `1px solid ${currentPriority.borderColor}`,
                                backgroundColor: currentPriority.backgroundColor,
                                color: currentPriority.textColor,
                            }}
                        >
                            {currentPriority.name}
                        </Tag>
                        
                        <Paragraph style={{ fontWeight: 500, marginBottom: '12px', wordBreak: 'break-word' }}>
                            {task.title}
                        </Paragraph>

                        {calculateSubTaskProgress()}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                            <Space size="middle">
                                {task.attachments?.length > 0 && <Space size={4}><PaperClipOutlined /><Text type="secondary">{task.attachments.length}</Text></Space>}
                                {task.comments?.length > 0 && <Space size={4}><CommentOutlined /><Text type="secondary">{task.comments.length}</Text></Space>}
                                {task.subTasks?.length > 0 && <Space size={4}><ApartmentOutlined /><Text type="secondary">{task.subTasks.length}</Text></Space>}
                            </Space>
                            <Avatar.Group maxCount={3} size="small">
                                {task.assignees.map(user => (
                                    <Tooltip title={user.name} key={user._id}>
                                        <Avatar src={user.profilePictureUrl}>{user.name.charAt(0)}</Avatar>
                                    </Tooltip>
                                ))}
                            </Avatar.Group>
                        </div>
                    </Card>
                </div>
            )}
        </Draggable>
    );
};

export default KanbanCard;