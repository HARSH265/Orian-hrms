const ExpenseCategory = require('../model/expenseCategory.model');
const logger = require('../utils/logger');

const getAllCategories = async ({ page, limit, activeOnly } = {}) => {
    const query = activeOnly ? { isActive: true } : {};
    const categories = await ExpenseCategory.find(query).sort({ sortOrder: 1, name: 1 }).lean();
    return { data: categories };
};

const getCategoryById = async (id) => {
    const category = await ExpenseCategory.findById(id).lean();
    return category;
};

const createCategory = async (data) => {
    const category = await ExpenseCategory.create(data);
    return category;
};

const updateCategory = async (id, data) => {
    const category = await ExpenseCategory.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
    }).lean();
    return category;
};

const deleteCategory = async (id) => {
    const category = await ExpenseCategory.findByIdAndUpdate(id, { isActive: false }, { new: true }).lean();
    return category;
};

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
};
