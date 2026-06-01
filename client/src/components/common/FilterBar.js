import React from 'react';
import { Row, Col, Input, Select } from 'antd';

const FilterBar = ({
    onSearch,
    onStatusChange,
    onPriorityChange,
    onSortChange,
    searchPlaceholder = 'Search...',
    statusOptions = [],
    priorityOptions = [],
    sortOptions = [],
    defaultSort,
}) => {
    return (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }} aria-label="Task filters">
            <Col xs={24} sm={12}>
                <Input.Search
                    placeholder={searchPlaceholder}
                    onChange={(e) => onSearch(e.target.value)}
                    allowClear
                />
            </Col>
            {statusOptions.length > 0 && (
                <Col xs={12} sm={6}>
                    <Select
                        placeholder="Filter by Status"
                        onChange={onStatusChange}
                        allowClear
                        style={{ width: '100%' }}
                        options={statusOptions}
                    />
                </Col>
            )}
            {priorityOptions.length > 0 && (
                <Col xs={12} sm={6}>
                    <Select
                        placeholder="Filter by Priority"
                        onChange={onPriorityChange}
                        allowClear
                        style={{ width: '100%' }}
                        options={priorityOptions}
                    />
                </Col>
            )}
            {sortOptions.length > 0 && (
                <Col xs={12} sm={6}>
                    <Select
                        placeholder="Sort by"
                        defaultValue={defaultSort}
                        onChange={onSortChange}
                        style={{ width: '100%' }}
                        options={sortOptions}
                    />
                </Col>
            )}
        </Row>
    );
};

export default FilterBar;
