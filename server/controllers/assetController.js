const { getAllAssets, getAssetById, createAsset, updateAsset, deleteAsset, getMyAssets } = require('../services/assetService');

// @desc    Get all assets
// @route   GET /api/assets
// @access  Private/Admin
exports.getAllAssets = async (req, res, next) => {
    try {
        const assets = await getAllAssets();
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
        const asset = await createAsset(req.body);
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
        let asset = await getAssetById(req.params.id);
        if (!asset) {
            return res.status(404).json({ success: false, message: 'Asset not found' });
        }

        if (req.body.assignedTo) {
            req.body.status = 'Assigned';
        }
        if (req.body.assignedTo === null) {
            req.body.status = 'Available';
        }

        asset = await updateAsset(req.params.id, req.body);

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
        const asset = await getAssetById(req.params.id);
        if (!asset) {
            return res.status(404).json({ success: false, message: 'Asset not found' });
        }
        if (asset.status === 'Assigned') {
            return res.status(400).json({ success: false, message: 'Cannot delete an asset that is currently assigned to a user. Please unassign it first.' });
        }
        await deleteAsset(asset);
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
        const myAssets = await getMyAssets(req.user.id);
        res.status(200).json({ success: true, count: myAssets.length, data: myAssets });
    } catch (error) {
        next(error);
    }
};
