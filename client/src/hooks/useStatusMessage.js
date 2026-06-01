import { useCallback } from 'react';
import { message } from 'antd';

const useStatusMessage = () => {
    const handleDispatch = useCallback((dispatchPromise) => {
        return dispatchPromise
            .unwrap()
            .then((result) => {
                message.success('Operation successful');
                return result;
            })
            .catch((error) => {
                message.error(error || 'Operation failed');
                throw error;
            });
    }, []);

    return { handleDispatch };
};

export default useStatusMessage;
