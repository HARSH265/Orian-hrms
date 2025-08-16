const Department = require('../model/department.model');

// @desc    Create a new department
// @route   POST /api/departments
// @access  Private/Admin
exports.createDepartment = async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const department = await Department.create({ name, description });
        res.status(201).json({ success: true, data: department });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
exports.getAllDepartments = async (req, res, next) => {
    try {
        const departments = await Department.find({})
            .populate('manager', 'name') // <-- ADD THIS LINE
            .sort({ name: 1 });
        res.status(200).json({ success: true, count: departments.length, data: departments });
    } catch (error) {
        next(error);
    }
};

// @desc    Update a department
// @route   PUT /api/departments/:id
// @access  Private/Admin
exports.updateDepartment = async (req, res, next) => {
    try {
        const department = await Department.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!department) {
            return res.status(404).json({ success: false, message: 'Department not found' });
        }
        res.status(200).json({ success: true, data: department });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a department
// @route   DELETE /api/departments/:id
// @access  Private/Admin
exports.deleteDepartment = async (req, res, next) => {
    try {
        const department = await Department.findByIdAndDelete(req.params.id);

        if (!department) {
            return res.status(404).json({ success: false, message: 'Department not found' });
        }
        // Note: In a real system, we'd need to handle what happens to users in this department.
        // For now, a simple delete is fine.
        res.status(200).json({ success: true, message: 'Department deleted' });
    } catch (error) {
        next(error);
    }
};