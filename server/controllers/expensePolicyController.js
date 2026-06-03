const asyncHandler = require('../utils/asyncHandler');
const policyService = require('../services/expensePolicyService');

exports.getAllPolicies = asyncHandler(async (req, res, next) => {
    try {
        const policies = await policyService.getAllPolicies();
        res.status(200).json({ success: true, data: policies });
    } catch (error) {
        next(error);
    }
});

exports.createPolicy = asyncHandler(async (req, res, next) => {
    try {
        const policy = await policyService.createPolicy(req.body);
        res.status(201).json({ success: true, data: policy });
    } catch (error) {
        next(error);
    }
});

exports.updatePolicy = asyncHandler(async (req, res, next) => {
    try {
        const policy = await policyService.updatePolicy(req.params.id, req.body);
        if (!policy) return res.status(404).json({ success: false, message: 'Policy not found.' });
        res.status(200).json({ success: true, data: policy });
    } catch (error) {
        next(error);
    }
});

exports.deletePolicy = asyncHandler(async (req, res, next) => {
    try {
        const policy = await policyService.deletePolicy(req.params.id);
        if (!policy) return res.status(404).json({ success: false, message: 'Policy not found.' });
        res.status(200).json({ success: true, message: 'Policy archived.' });
    } catch (error) {
        next(error);
    }
});
