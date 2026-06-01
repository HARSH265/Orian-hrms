// In: client/src/components/tasks/kanban/KanbanColumn.js

import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Typography, Badge } from 'antd';
import KanbanCard from './KanbanCard';

const { Title, Text } = Typography;

const KanbanColumn = ({ column, tasks, onCardClick }) => {
    return (
        // Main column container
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            background: '#f7f8fa', // A softer, more modern background color
            border: '1px solid #e9eaf0',
            borderRadius: '12px', // Softer, more rounded corners
            width: '320px', // Slightly wider for better spacing
            minWidth: '320px',
            margin: '0 8px',
            height: '100%',
        }}>
            {/* Column Header */}
            <div style={{ padding: '16px', borderBottom: '1px solid #e9eaf0', display: 'flex', alignItems: 'center' }}>
                <Title level={5} style={{ margin: 0, marginRight: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#5e6c84' }}>
                    {column.title}
                </Title>
                <Badge 
                    count={tasks.length} 
                    style={{ backgroundColor: '#dfe1e6', color: '#5e6c84', fontWeight: 'bold' }} 
                />
            </div>
            
            {/* Droppable Area for Cards */}
            <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        style={{
                            padding: '12px',
                            background: snapshot.isDraggingOver ? '#e6f7ff' : 'transparent', // More subtle drop highlight
                            flexGrow: 1,
                            minHeight: '100px',
                            overflowY: 'auto',
                            transition: 'background-color 0.2s ease',
                        }}
                    >
                        {tasks.map((task, index) => (
                            <KanbanCard key={task._id} task={task} index={index} onCardClick={onCardClick} />
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
};

export default KanbanColumn;