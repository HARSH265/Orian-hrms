const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    // Who performed the action?
    actor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // What action did they perform?
    action: {
        type: String,
        required: true,
        // Example: 'USER_LOGIN', 'LEAVE_APPROVED', 'DOCUMENT_UPLOADED', 'SETTINGS_UPDATED'
    },
    // What entity was affected? (Optional)
    target: {
        type: {
            id: mongoose.Schema.Types.ObjectId,
            type: String, // e.g., 'User', 'Leave', 'Document'
        },
    },
    // Any extra details we want to store
    details: {
        type: mongoose.Schema.Types.Mixed, // Can be an object with before/after states
    },
    // Where did the action originate from?
    ipAddress: {
        type: String,
    },
}, { 
    timestamps: true,
    // Use a Capped Collection for performance. It's a fixed-size collection that
    // automatically overwrites the oldest entries when it's full.
    // This prevents the log from growing indefinitely.
    capped: { size: 10485760, max: 10000 } // 10MB, max 10,000 documents
});

module.exports = mongoose.model('AuditLog', auditLogSchema);