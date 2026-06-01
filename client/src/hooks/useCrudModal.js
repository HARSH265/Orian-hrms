import { useState } from 'react';

const useCrudModal = () => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const showModal = (item = null) => {
        setEditingItem(item);
        setIsModalVisible(true);
    };

    const hideModal = () => {
        setIsModalVisible(false);
        setEditingItem(null);
    };

    return { isModalVisible, editingItem, showModal, hideModal };
};

export default useCrudModal;
