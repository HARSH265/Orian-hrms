// In: client/src/components/tasks/gantt/GanttView.js

import React, { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { Typography, Empty, Popover, Tag } from 'antd';
import { openTaskDetailsModal } from '../../../features/task/taskSlice';
import './GanttView.css';

const { Text, Link } = Typography;

const daysBetween = (date1, date2) => (date2 - date1) / (1000 * 60 * 60 * 24);

const GanttView = ({ tasks }) => {
    const dispatch = useDispatch();

    const { ganttTasks, timeframe, months, todayOffset } = useMemo(() => {
        const validTasks = tasks.filter(t => t.createdAt && t.dueDate && new Date(t.dueDate) > new Date(t.createdAt));
        if (validTasks.length === 0) {
            return { ganttTasks: [], timeframe: null, months: [], todayOffset: null };
        }

        let minDate = new Date(validTasks[0].createdAt);
        let maxDate = new Date(validTasks[0].dueDate);

        validTasks.forEach(task => {
            const start = new Date(task.createdAt);
            const end = new Date(task.dueDate);
            if (start < minDate) minDate = start;
            if (end > maxDate) maxDate = end;
        });

        minDate.setDate(minDate.getDate() - 7);
        maxDate.setDate(maxDate.getDate() + 7);
        const totalDays = daysBetween(minDate, maxDate);

        const processedTasks = validTasks.map(task => {
            const offsetDays = daysBetween(minDate, new Date(task.createdAt));
            const durationDays = daysBetween(new Date(task.createdAt), new Date(task.dueDate));
            const progress = task.status === 'Done' ? 100 : (task.status === 'In Progress' ? 50 : 0);
            return {
                ...task,
                left: (offsetDays / totalDays) * 100,
                width: (durationDays / totalDays) * 100,
                progress: progress,
            };
        });
        
        const monthMarkers = [];
        let currentDate = new Date(minDate);
        currentDate.setDate(1);
        while (currentDate <= maxDate) {
            monthMarkers.push(new Date(currentDate));
            currentDate.setMonth(currentDate.getMonth() + 1);
        }

        const todayPosition = daysBetween(minDate, new Date());
        const calculatedTodayOffset = (todayPosition / totalDays) * 100;

        return { 
            ganttTasks: processedTasks, 
            timeframe: { start: minDate, end: maxDate }, 
            months: monthMarkers,
            todayOffset: calculatedTodayOffset
        };
    }, [tasks]);

    const handleTaskClick = (taskId) => {
        dispatch(openTaskDetailsModal(taskId));
    };

    if (ganttTasks.length === 0) {
        return (
            <div style={{ height: 'calc(100vh - 340px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Empty description="No tasks with valid start and end dates to display." />
            </div>
        );
    }

    const totalDays = daysBetween(timeframe.start, timeframe.end);

    const GanttBar = ({ task }) => (
        <Popover
            placement="top"
            title={<Text strong>{task.title}</Text>}
            content={
                <div>
                    <p><strong>Status:</strong> <Tag>{task.status}</Tag></p>
                    <p><strong>Duration:</strong> {`${new Date(task.createdAt).toLocaleDateString()} - ${new Date(task.dueDate).toLocaleDateString()}`}</p>
                    <p><strong>Assignees:</strong> {task.assignees.map(a => a.name).join(', ')}</p>
                </div>
            }
        >
            <div
                className="gantt-bar-wrapper"
                style={{ left: `${task.left}%`, width: `${task.width}%` }}
                onClick={() => handleTaskClick(task._id)}
            >
                <div
                    className={`gantt-bar-progress gantt-priority-${task.priority?.toLowerCase()}`}
                    style={{ width: `${task.progress}%` }}
                />
            </div>
        </Popover>
    );

    return (
        <div className="gantt-container">
            <div className="gantt-header">
                <div className="gantt-header-side">Task Name</div>
                <div className="gantt-header-main">
                    {months.map((month, index) => {
                        const offsetDays = daysBetween(timeframe.start, month);
                        const left = (offsetDays / totalDays) * 100;
                        return (
                            <div key={index} className="gantt-month-marker" style={{ left: `${left}%` }}>
                                {month.toLocaleDateString('default', { month: 'short', year: 'numeric' })}
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="gantt-body">
                {todayOffset >= 0 && todayOffset <= 100 && (
                    <div className="gantt-today-marker" style={{ left: `${todayOffset}%` }} />
                )}
                {ganttTasks.map(task => (
                    <div key={task._id} className="gantt-row">
                        <div className="gantt-row-side">
                            <Link onClick={() => handleTaskClick(task._id)} ellipsis>{task.title}</Link>
                        </div>
                        <div className="gantt-row-main">
                            <GanttBar task={task} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GanttView;