import React from 'react';
import { Input, InputNumber, DatePicker, Select } from 'antd';

const CustomFieldInput = ({ field, value, onChange }) => {
    switch (field.fieldType) {
        case 'Text':
            return <Input value={value} onChange={e => onChange(e.target.value)} />;
        case 'Number':
            return <InputNumber value={value} onChange={onChange} style={{ width: '100%' }} />;
        case 'Date':
            return <DatePicker value={value} onChange={onChange} style={{ width: '100%' }} />;
        case 'Select':
            return (
                <Select value={value} onChange={onChange} style={{ width: '100%' }}
                    options={field.options?.map(opt => ({ label: opt, value: opt })) || []}
                />
            );
        case 'MultiSelect':
            return (
                <Select mode="multiple" value={value} onChange={onChange} style={{ width: '100%' }}
                    options={field.options?.map(opt => ({ label: opt, value: opt })) || []}
                />
            );
        default:
            return <Input value={value} onChange={e => onChange(e.target.value)} />;
    }
};

export default CustomFieldInput;
