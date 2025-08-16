const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
    // --- Core Info ---
    name: { type: String, required: [true, 'Please add a name'] },
    email: { type: String, required: [true, 'Please add an email'], unique: true, match: [ /^\S+@\S+\.\S+$/, 'Please add a valid email'] },
    password: { type: String, required: [true, 'Please add a password'], minlength: 6, select: false },
    role: { type: String, enum: ['employee', 'manager', 'hr', 'super-admin'], default: 'employee' },
    jobTitle: { type: String, default: '' },
   department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department', // This tells Mongoose to link to the 'Department' model
    default: null,
},
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // CRITICAL for Org Chart

    // --- Employee-Editable Profile Info ---
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    emergencyContact: {
        name: { type: String, default: '' },
        phone: { type: String, default: '' },
        relation: { type: String, default: '' }
    },
    profilePictureUrl: { type: String, default: 'default_avatar.png' },
     needsWelcomeWizard: {
        type: Boolean,
        default: true,
    },

    
    isActive: { type: Boolean, default: true }, 

}, { timestamps: true });

// password hashing
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// compare password
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);