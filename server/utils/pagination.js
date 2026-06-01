/**
 * Parse pagination params from query string
 * @param {object} query - req.query
 * @param {object} defaults - { page: 1, limit: 20, maxLimit: 100 }
 * @returns {{ page, limit, skip }}
 */
const parsePagination = (query = {}, defaults = {}) => {
    const { page: rawPage = 1, limit: rawLimit = defaults.limit || 20 } = query;
    const page = Math.max(1, parseInt(rawPage) || 1);
    const limit = Math.min(Math.max(parseInt(rawLimit) || defaults.limit || 20, 1), defaults.maxLimit || 100);
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};

/**
 * Build pagination response
 */
const buildPagination = (total, page, limit) => ({
    total,
    page,
    pages: Math.ceil(total / limit),
    limit,
});

module.exports = { parsePagination, buildPagination };