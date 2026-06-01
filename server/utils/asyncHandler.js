/**
 * Wrap an async Express route handler and forward any error to `next`.
 * Usage: `module.exports = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);`
 */
module.exports = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
