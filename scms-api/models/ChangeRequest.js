const mongoose = require('mongoose');

const changeRequestSchema = new mongoose.Schema({
  cr_number: { type: String, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    required: true, 
    enum: ['Normal', 'Standard', 'Emergency'] 
  },
  priority: { 
    type: String, 
    enum: ['Low', 'Medium', 'High'] 
  },
  impact_scope: String,
  status: { 
    type: String, 
    default: 'Draft' // Satisfies SE-8: "Saved with status Draft"
  },
  // This field will store links to uploaded files (e.g., S3 or Google Drive URLs)
  attachments: [{ type: String }],
  
  // This links the CR to the user who created it
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('ChangeRequest', changeRequestSchema);