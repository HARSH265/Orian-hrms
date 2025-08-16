const Asset = require('../model/asset.model');
const User = require('../model/user'); // We'll need this for validation

// @desc    Get all assets
// @route   GET /api/assets
// @access  Private/Admin
exports.getAllAssets = async (req, res, next) => {
    try {
        const assets = await Asset.find({})
            .populate('assignedTo', 'name email') // Show who the asset is assigned to
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: assets.length, data: assets });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new asset
// @route   POST /api/assets
// @access  Private/Admin
exports.createAsset = async (req, res, next) => {
    try {
        const asset = await Asset.create(req.body);
        res.status(201).json({ success: true, data: asset });
    } catch (error) {
        next(error);
    }
};

// @desc    Update an asset's details
// @route   PUT /api/assets/:id
// @access  Private/Admin
exports.updateAsset = async (req, res, next) => {
    try {
        let asset = await Asset.findById(req.params.id);
        if (!asset) {
            return res.status(404).json({ success: false, message: 'Asset not found' });
        }

        // --- Business Logic for Assignment ---
        // If an employee ID is provided in the body, update status to 'Assigned'
        if (req.body.assignedTo) {
            req.body.status = 'Assigned';
        }
        // If assignedTo is explicitly set to null, update status to 'Available'
        if (req.body.assignedTo === null) {
            req.body.status = 'Available';
        }

        asset = await Asset.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        
        res.status(200).json({ success: true, data: asset });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete an asset
// @route   DELETE /api/assets/:id
// @access  Private/Admin
exports.deleteAsset = async (req, res, next) => {
    try {
        const asset = await Asset.findById(req.params.id);
        if (!asset) {
            return res.status(404).json({ success: false, message: 'Asset not found' });
        }
        // Business Rule: Cannot delete an asset that is currently assigned.
        if (asset.status === 'Assigned') {
            return res.status(400).json({ success: false, message: 'Cannot delete an asset that is currently assigned to a user. Please unassign it first.' });
        }
        await asset.remove();
        res.status(200).json({ success: true, message: 'Asset deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all assets assigned to the logged-in user
// @route   GET /api/assets/my-assets
// @access  Private (Employee)
exports.getMyAssets = async (req, res, next) => {
    try {
        const myAssets = await Asset.find({ assignedTo: req.user.id });
        res.status(200).json({ success: true, count: myAssets.length, data: myAssets });
    } catch (error) {
        next(error);
    }
};