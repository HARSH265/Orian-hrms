const Asset = require('../model/asset.model');
const logger = require('../utils/logger');

const getAllAssets = async () => {
    const assets = await Asset.find({})
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 });
    return assets;
};

const getAssetById = async (id) => {
    const asset = await Asset.findById(id);
    return asset;
};

const createAsset = async (data) => {
    const asset = await Asset.create(data);
    return asset;
};

const updateAsset = async (id, data) => {
    const asset = await Asset.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
    });
    return asset;
};

const deleteAsset = async (asset) => {
    await asset.remove();
};

const getMyAssets = async (userId) => {
    const myAssets = await Asset.find({ assignedTo: userId });
    return myAssets;
};

module.exports = {
    getAllAssets,
    getAssetById,
    createAsset,
    updateAsset,
    deleteAsset,
    getMyAssets,
};
