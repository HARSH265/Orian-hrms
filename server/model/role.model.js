// In: server/model/role.model.js

const mongoose = require('mongoose');
const { PERMISSIONS } = require('../config/permissions');

const RoleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Role name is required.'],
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    // --- THE UPGRADE: An array to store the permission keys ---
    permissions: {
        type: [String],
        // This validation ensures only valid permissions from our config file can be saved
        enum: {
            values: Object.values(PERMISSIONS),
            message: '`{VALUE}` is not a valid permission.'
        }
    },
    // --- NEW: A flag to distinguish core roles from custom ones ---
    isSystemRole: {
        type: Boolean,
        default: false // Default to false for all new custom roles
    }
}, { timestamps: true });

// Index for role name
RoleSchema.index({ name: 1 });

module.exports = mongoose.model('Role', RoleSchema);