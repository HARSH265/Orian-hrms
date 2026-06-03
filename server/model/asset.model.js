const mongoose = require('mongoose');

const AssetSchema = new mongoose.Schema({
    name: { type: String, required: [true, 'Please add an asset name'], trim: true },
    assetType: { type: String, required: true, enum: ['Hardware', 'Software', 'License', 'Other'] },
    serialNumber: { type: String, trim: true, unique: true, sparse: true },
    purchaseDate: { type: Date },
    warrantyEndDate: { type: Date },
    status: { type: String, required: true, enum: ['Available', 'Assigned', 'In Repair', 'Retired'], default: 'Available' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    notes: { type: String, trim: true },

    // Maintenance
    maintenanceLastDate: { type: Date },
    maintenanceNextDate: { type: Date },

    // License tracking
    licenseKey: { type: String, trim: true },
    seatsTotal: { type: Number, default: 0 },
    seatsUsed: { type: Number, default: 0 },
    licenseExpiryDate: { type: Date },

    // Depreciation
    purchasePrice: { type: Number, default: 0 },
    salvageValue: { type: Number, default: 0 },

    // Location & custody
    location: { type: String, trim: true },
    custodian: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // Attachments
    attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
}, { timestamps: true });

AssetSchema.index({ assignedTo: 1 });
AssetSchema.index({ status: 1 });
AssetSchema.index({ assetType: 1 });
AssetSchema.index({ maintenanceNextDate: 1 });
AssetSchema.index({ licenseExpiryDate: 1 });

module.exports = mongoose.model('Asset', AssetSchema);
