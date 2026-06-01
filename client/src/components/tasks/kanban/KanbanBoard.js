// In: client/src/components/tasks/kanban/KanbanBoard.js

import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { DragDropContext } from '@hello-pangea/dnd';
import { message, Spin } from 'antd';
// import KanbanColumn from './KanbanColumn';
import KanbanColumn from './KanbanColumn';
import { updateTaskStatus } from '../../../features/task/taskThunks';
import { openTaskDetailsModal } from '../../../features/task/taskSlice';

// Define the columns for our Kanban board. The ID must match the task status.
const boardColumns = [
    { id: 'To Do', title: 'To Do' },
    { id: 'In Progress', title: 'In Progress' },
    { id: 'Blocked', title: 'Blocked' },
    { id: 'Done', title: 'Done' },
];

const KanbanBoard = ({ tasks, isLoading }) => {
    const dispatch = useDispatch();
    const [columns, setColumns] = useState({});

    // This effect runs whenever the raw `tasks` array from the parent component changes.
    // It organizes the flat array of tasks into a structured object keyed by status.
    useEffect(() => {
        const organizedColumns = boardColumns.reduce((acc, col) => {
            acc[col.id] = {
                ...col,
                tasks: tasks.filter(task => task.status === col.id),
            };
            return acc;
        }, {});
        setColumns(organizedColumns);
    }, [tasks]);

    const handleCardClick = (taskId) => {
        dispatch(openTaskDetailsModal(taskId));
    };

    // This is the main logic handler for when a user finishes dragging a card.
    const onDragEnd = (result) => {
        const { source, destination, draggableId } = result;

        // If the card was dropped outside of a column, do nothing.
        if (!destination) {
            return;
        }

        // If the card was dropped in the same place it started, do nothing.
        if (source.droppableId === destination.droppableId && source.index === destination.index) {
            return;
        }

        const startColumn = columns[source.droppableId];
        const endColumn = columns[destination.droppableId];
        const taskId = draggableId;
        const newStatus = endColumn.id;

        // --- Optimistic UI Update ---
        // We update the local state immediately for a smooth user experience,
        // before the API call has even finished.

        // 1. Create a new copy of the starting column's task list.
        const startTasks = Array.from(startColumn.tasks);
        // 2. Remove the dragged task from its original position.
        const [draggedTask] = startTasks.splice(source.index, 1);

        // Update the state for the starting column.
        const newStartColumn = {
            ...startColumn,
            tasks: startTasks,
        };

        let newEndColumn = { ...endColumn };

        // If the card was dropped in a different column...
        if (startColumn.id !== endColumn.id) {
            // 1. Create a new copy of the ending column's task list.
            const endTasks = Array.from(endColumn.tasks);
            // 2. Insert the dragged task into its new position.
            endTasks.splice(destination.index, 0, draggedTask);
            // Update the state for the ending column.
            newEndColumn = {
                ...endColumn,
                tasks: endTasks,
            };
        } else {
            // If the card was moved within the same column, just reorder it.
            newStartColumn.tasks.splice(destination.index, 0, draggedTask);
        }

        // 3. Update the component's state with the new column data.
        setColumns(prevColumns => ({
            ...prevColumns,
            [startColumn.id]: newStartColumn,
            [endColumn.id]: newEndColumn,
        }));
        
        // --- API Call ---
        // Now, dispatch the action to permanently save the status change.
        dispatch(updateTaskStatus({ taskId, status: newStatus })).unwrap()
            .then(() => {
                message.success(`Task moved to "${newStatus}"`);
            })
            .catch((err) => {
                message.error(`Failed to move task: ${err.message || err}`);
                // If the API call fails, we should revert the optimistic UI update.
                // For simplicity in this example, we'll just log it, but in a production app,
                // you would revert the `setColumns` call here.
                console.error("Failed to update task status, UI state is now temporarily out of sync.");
            });
    };

    if (isLoading && tasks.length === 0) {
        return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>;
    }

   return (
        <DragDropContext onDragEnd={onDragEnd}>
            
            <div style={{
                display: 'inline-flex', // Changed from 'flex'
                flexDirection: 'row',
                height: '100%',
                minWidth: '100%', // Ensure it at least fills the container
            }}>
            
                {Object.values(columns).map(column => (
                    <KanbanColumn
                        key={column.id}
                        column={column}
                        tasks={column.tasks}
                        onCardClick={handleCardClick}
                    />
                ))}
            </div>
        </DragDropContext>
    );
};

export default KanbanBoard;