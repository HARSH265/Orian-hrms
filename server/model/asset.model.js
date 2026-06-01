const mongoose = require('mongoose');

const AssetSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add an asset name (e.g., MacBook Pro 14")'],
        trim: true,
    },
    assetType: {
        type: String,
        required: true,
        enum: ['Hardware', 'Software', 'Other'], // A category for the asset
    },
    serialNumber: {
        type: String,
        trim: true,
        unique: true,
        sparse: true, // Allows multiple documents to have a null serial number, but unique if it exists
    },
    purchaseDate: {
        type: Date,
    },
    warrantyEndDate: {
        type: Date,
    },
    status: {
        type: String,
        required: true,
        enum: ['Available', 'Assigned', 'In Repair', 'Retired'],
        default: 'Available',
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null, // Null if the asset is 'Available'
    },
    notes: {
        type: String,
        trim: true,
    }
}, { timestamps: true });

AssetSchema.index({ assignedTo: 1 });

module.exports = mongoose.model('Asset', AssetSchema);