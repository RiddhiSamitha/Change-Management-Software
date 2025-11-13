const mongoose = require('mongoose');

const ChangeRequestSchema = new mongoose.Schema(
  {
    // (SE-7) Unique, Human-Readable ID
    cr_number: {
      type: String,
      required: true,
      unique: true,
    },
    // (CR-01) Core Fields
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [10, 'Title must be at least 10 characters'],
      maxlength: [500, 'Title cannot be more than 500 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters'],
    },
    // (CR-03) Category
    category: {
      type: String,
      required: true,
      enum: ['Normal', 'Standard', 'Emergency'],
      default: 'Normal',
    },
    // (CR-05) Additional Details
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    impact_scope: {
      type: String,
      trim: true,
    },
    implementationDate: {
      type: Date
    },
    affectedSystems: [{
      type: String
    }],
    // (CR-04) Attachments
    attachments: [
      {
        filename: String,
        url: String,
        uploadedAt: Date
      }
    ],
    // (CR-01, SE-12) Status
    status: {
      type: String,
      enum: ['Draft', 'Pending', 'Approved', 'Rejected', 'In Progress', 'Closed'],
      default: 'Draft',
    },
    // (CR-08, DASH-01.4) User Associations
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // (SE-12.2) Submission Tracking
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    submittedAt: {
      type: Date,
    },

    // --- (SE-13, SE-14) APPROVAL/REJECTION WORKFLOW ---
    // NEW: Single field to track who reviewed (approved OR rejected)
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    // NEW: Single timestamp for when review happened
    reviewedAt: {
      type: Date,
      default: null
    },
    // Store the reviewer's comment (for both approve and reject)
    reviewerComment: {
      type: String,
      trim: true,
      default: ''
    },

    // DEPRECATED: Keep for backward compatibility but use approvedBy instead
    approvalDate: {
      type: Date,
    },
    approvalComment: {
      type: String,
      trim: true,
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionDate: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    // --- END OF APPROVAL FIELDS ---

    // (SE-16) Timeline/History tracking
    timeline: [{
      action: {
        type: String,
        enum: ['Created', 'Submitted', 'Approved', 'Rejected', 'Updated', 'Closed', 'Reopened']
      },
      performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      comment: String
    }]
  },
  {
    // (CR-07) Timestamps
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Add indexes for better query performance
ChangeRequestSchema.index({ status: 1, createdBy: 1 });
ChangeRequestSchema.index({ cr_number: 1 });
ChangeRequestSchema.index({ approvedBy: 1 });

// Virtual to get reviewer email easily
ChangeRequestSchema.virtual('reviewerEmail').get(function() {
  return this.approvedBy?.email || null;
});

// Ensure virtuals are included when converting to JSON
ChangeRequestSchema.set('toJSON', { virtuals: true });
ChangeRequestSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ChangeRequest', ChangeRequestSchema);