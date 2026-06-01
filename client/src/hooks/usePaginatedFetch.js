import { useState, useCallback } from 'react';

const usePaginatedFetch = (fetchThunk, defaultParams = {}) => {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sortBy, setSortBy] = useState('createdAt');
    const [order, setOrder] = useState('desc');
    const [filters, setFilters] = useState({});

    const fetchData = useCallback((dispatch) => {
        dispatch(fetchThunk({ page, limit, sortBy, order, filters, ...defaultParams }));
    }, [page, limit, sortBy, order, filters, fetchThunk, defaultParams]);

    return { page, setPage, limit, setLimit, sortBy, setSortBy, order, setOrder, filters, setFilters, fetchData };
};

export default usePaginatedFetch;
