const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
    title: 
    { 
        type: String, 
        required: [true, 'Please add a job title'], 
        trim: true
        
     },
    department: 
    { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Department', 
        required: true
        
     },
  location: {
    type: String,
    required: [true, 'Please specify the job location type'],
    enum: ['In Office', 'Remote', 'Hybrid'], // This is the list of allowed values
    default: 'Remote',
},
    description: 
    { 
        type: String, 
        required: [true, 'Please add a job description']
        
     },
    status: {
         type: String, 
        enum: ['Open', 'Closed', 'On Hold'], 
        default: 'Open'
        
     },
    postedBy: {
         type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true
        
     },
}, { timestamps: true });

module.exports = mongoose.model('Job', JobSchema);