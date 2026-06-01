const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a department name'],
        trim: true, // Removes whitespace from both ends
        unique: true, // No two departments can have the same name
    },
    description: {
        type: String,
        trim: true,
        default: '', // A default empty string
    },
     manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // This links to the User model
        default: null,
    },
    // We could add more fields later, like 'headOfDepartment' (ref: 'User')
}, { timestamps: true });

// Index for department name
DepartmentSchema.index({ name: 1 });

module.exports = mongoose.model('Department', DepartmentSchema);