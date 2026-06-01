export const extractErrorMessage = (error) => {
    if (error.response?.data?.message) return error.response.data.message;
    if (error.message) return error.message;
    if (typeof error === 'string') return error;
    return 'An unexpected error occurred';
};
