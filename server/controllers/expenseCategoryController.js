const asyncHandler = require('../utils/asyncHandler');
const categoryService = require('../services/expenseCategoryService');

exports.getAllCategories = asyncHandler(async (req, res, next) => {
    try {
        const { activeOnly } = req.query;
        const result = await categoryService.getAllCategories({ activeOnly: activeOnly !== 'false' });
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
});

exports.getCategory = asyncHandler(async (req, res, next) => {
    try {
        const category = await categoryService.getCategoryById(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found.' });
        }
        res.status(200).json({ success: true, data: category });
    } catch (error) {
        next(error);
    }
});

exports.createCategory = asyncHandler(async (req, res, next) => {
    try {
        const { name, description, sortOrder } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: 'Category name is required.' });
        }
        const category = await categoryService.createCategory({ name, description, sortOrder });
        res.status(201).json({ success: true, data: category });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'A category with this name already exists.' });
        }
        next(error);
    }
});

exports.updateCategory = asyncHandler(async (req, res, next) => {
    try {
        const category = await categoryService.updateCategory(req.params.id, req.body);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found.' });
        }
        res.status(200).json({ success: true, data: category });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'A category with this name already exists.' });
        }
        next(error);
    }
});

exports.deleteCategory = asyncHandler(async (req, res, next) => {
    try {
        const category = await categoryService.deleteCategory(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found.' });
        }
        res.status(200).json({ success: true, message: 'Category archived.' });
    } catch (error) {
        next(error);
    }
});
