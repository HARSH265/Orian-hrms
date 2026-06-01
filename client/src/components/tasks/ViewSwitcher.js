import React from 'react';
import { Segmented } from 'antd';
import { UnorderedListOutlined, AppstoreOutlined, BarChartOutlined } from '@ant-design/icons'; // <-- Import new icon

const ViewSwitcher = ({ currentView, onViewChange }) => {
    return (
        <Segmented
            options={[
                { value: 'list', icon: <UnorderedListOutlined />, label: "List" },
                { value: 'board', icon: <AppstoreOutlined />, label: "Board" },
                // --- NEW: Add the Gantt chart option ---
                { value: 'gantt', icon: <BarChartOutlined />, label: "Gantt" },
            ]}
            value={currentView}
            onChange={onViewChange}
        />
    );
};

export default React.memo(ViewSwitcher);