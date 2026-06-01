const mongoose = require('mongoose');

const SkillSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a skill name'],
        trim: true,
        unique: true,
    },
    category: {
        type: String,
        trim: true,
        required: [true, 'Please add a skill category'],
    },
    createdBy: { // Auditing: who created this skill in the library
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    isArchived: { // For soft deletes
        type: Boolean,
        default: false,
    }
}, { timestamps: true });

module.exports = mongoose.model('Skill', SkillSchema);