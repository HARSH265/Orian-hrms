const mongoose = require('mongoose');

const ReferralSchema = new mongoose.Schema({
    job: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Job', 
        required: true 
        
    },
    candidateName: { 
        type: String, 
        required: [true, 'Please add the candidate\'s name'], 
        trim: true 
        
    },
    candidateEmail: { 
        type: String, 
        required: [true, 'Please add the candidate\'s email'], 
        trim: true 
        
    },
    candidatePhone: { 
        type: String, 
        trim: true 
        
    },
    referredBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
        
    },
    status: { 
        type: String, 
        enum: ['Submitted', 'In Review', 'Interviewing', 'Hired', 'Not a Fit'], 
        default: 'Submitted' 
        
    },
     resumeUrl: {
        type: String,
        default: null, 
    },
}, { timestamps: true });

module.exports = mongoose.model('Referral', ReferralSchema);