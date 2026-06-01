const mongoose = require('mongoose');
const encryptionPlugin = require('../utils/encryptionPlugin');
const bcrypt = require('bcrypt');

const EmploymentHistorySchema = new mongoose.Schema({
    jobTitle: { type: String },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    employmentType: { type: String },
    effectiveDate: { type: Date, default: Date.now },
    notes: { type: String } // e.g., "Promotion", "Internal Transfer"
});

const UserSchema = new mongoose.Schema({
    // --- Core Info ---
    name: { type: String, required: [true, 'Please add a name'] },
    email: { type: String, required: [true, 'Please add an email'], unique: true, match: [ /^\S+@\S+\.\S+$/, 'Please add a valid email'] },
    password: { type: String, required: [true, 'Please add a password'], minlength: 6, select: false },
    systemRole: { // Renamed from 'role'
        type: String, 
        enum: ['employee', 'manager', 'hr', 'super-admin'], 
        default: 'employee' 
    },
     roles: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role'
    }],
isActive: { type: Boolean, default: true },
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },

    // Employment Details (Managed by HR/Admin)
    employmentInfo: {
        employeeId: { type: String, unique: true, sparse: true }, // sparse allows multiple nulls
        hireDate: { type: Date },
        employmentType: { 
            type: String, 
            enum: ['Full-time', 'Part-time', 'Contractor', 'Intern'] 
        },
        workLocation: { type: String },
    },
    
    // Personal Details (Can have a mix of admin-managed and self-service fields)
    personalInfo: {
        dateOfBirth: { type: Date },
        gender: { type: String, enum: ['Male', 'Female', 'Other', 'Prefer not to say'] },
        nationality: { type: String },
        maritalStatus: { type: String, enum: ['Single', 'Married', 'Divorced', 'Widowed'] }
    },

    // --- Existing Fields ---
    jobTitle: { type: String, default: '' },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    employmentHistory: [EmploymentHistorySchema],

    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    emergencyContact: {
        name: { type: String, default: '' },
        phone: { type: String, default: '' },
        relation: { type: String, default: '' }
    },
    profilePictureUrl: { type: String, default: 'default_avatar.png' },
    
    needsWelcomeWizard: { type: Boolean, default: true },
    skills: [
        {
            skill: { // A reference to a document in our 'skills' collection
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Skill',
            },
            proficiency: { // How well the user rates themselves
                type: String,
                enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
                default: 'Intermediate',
            },
            endorsements: [{ // An array of users who have endorsed this skill
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            }]
        }
    ],

     twoFactorAuth: {
        secret: { type: String }, // The secret key for TOTP
        tempSecret: { type: String }, // Temporary secret during setup
        isEnabled: { type: Boolean, default: false }
    },

    
    isActive: { type: Boolean, default: true }, 

}, { timestamps: true });

// Indexes for frequent queries
UserSchema.index({ systemRole: 1 });
UserSchema.index({ department: 1 });
UserSchema.index({ manager: 1 });
UserSchema.index({ name: 'text' });

// Attach encryption plugin for 2FA secrets
if (process.env.ENCRYPTION_SECRET_KEY) {
    UserSchema.plugin(encryptionPlugin, {
        secret: process.env.ENCRYPTION_SECRET_KEY,
        encryptedFields: ['twoFactorAuth.secret', 'twoFactorAuth.tempSecret']
    });
}

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