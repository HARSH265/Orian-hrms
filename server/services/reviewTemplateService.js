const ReviewTemplate = require('../model/reviewTemplate.model');

const err = (msg, s) => { const e = new Error(msg); e.status = s; return e; };

const getAll = async () => {
    return ReviewTemplate.find({ isActive: true }).populate('createdBy', 'name').sort({ name: 1 });
};

const getById = async (id) => {
    const t = await ReviewTemplate.findById(id).populate('createdBy', 'name');
    if (!t) throw err('Template not found.', 404);
    return t;
};

const create = async (data, userId) => {
    const t = await ReviewTemplate.create({ ...data, createdBy: userId });
    return t.populate('createdBy', 'name');
};

const update = async (id, data) => {
    const t = await ReviewTemplate.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!t) throw err('Template not found.', 404);
    return t;
};

const remove = async (id) => {
    const t = await ReviewTemplate.findByIdAndDelete(id);
    if (!t) throw err('Template not found.', 404);
    return { message: 'Template deleted.' };
};

module.exports = { getAll, getById, create, update, remove };
