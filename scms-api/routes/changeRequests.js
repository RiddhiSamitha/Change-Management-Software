const express = require('express');
const ChangeRequest = require('../models/ChangeRequest');
const Counter = require('../models/Counter');
const authMiddleware = require('../middleware/authMiddleware');
const roleAuth = require('../middleware/roleAuth');
const router = express.Router();

// Helper function to check if user can approve CRs
function canApprove(userRole) {
  const approverRoles = [
    'Technical Lead',
    'Change Manager', 
    'Release Manager',
    'System Administrator',
    'Reviewer',  // Backward compatibility
    'Admin'      // Backward compatibility
  ];
  return approverRoles.includes(userRole);
}

// Helper function to check if user is developer-level
function isDeveloperRole(userRole) {
  const developerRoles = [
    'Developer',
    'QA Engineer',
    'DevOps Engineer'
  ];
  return developerRoles.includes(userRole);
}

async function generateCrNumber() {
  const year = new Date().getFullYear();
  const counterId = `cr_number_${year}`;
  const counter = await Counter.findByIdAndUpdate(
    counterId,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const nextId = counter.seq.toString().padStart(4, '0');
  return `CR-${year}-${nextId}`;
}

// CREATE - Developer-level roles can create CRs
router.post('/', [authMiddleware, roleAuth(['Developer', 'QA Engineer', 'DevOps Engineer'])], async (req, res) => {
  const { title, description, category, priority, impact_scope, attachments } = req.body;
  
  try {
    const cr_number = await generateCrNumber();
    
    // Handle attachments - normalize to array format
    let attachmentsArray = [];
    if (attachments) {
      if (Array.isArray(attachments)) {
        attachmentsArray = attachments.filter(a => a && a.trim());
      } else if (typeof attachments === 'string' && attachments.trim()) {
        attachmentsArray = [attachments.trim()];
      }
    }
    
    const newCR = new ChangeRequest({
      title, 
      description, 
      category, 
      priority, 
      impact_scope,
      attachments: attachmentsArray,
      cr_number,
      createdBy: req.user.id,
      status: 'Draft'
    });
    
    await newCR.save();
    
    // Populate creator info before returning
    const populatedCR = await ChangeRequest.findById(newCR._id)
      .populate('createdBy', 'email role');
    
    res.status(201).json(populatedCR);
  } catch (error) {
    console.error('Error creating CR:', error);
    if (error.code === 11000) {
      return res.status(500).json({ error: 'Failed to generate unique CR ID. Please try again.' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create change request' });
  }
});

// GET ALL - UPDATED: Better filtering logic for reviewers
router.get('/', authMiddleware, async (req, res) => {
  try {
    let query = {};
    const userRole = req.user.role;
    
    // Developer-level roles only see their own CRs
    if (isDeveloperRole(userRole)) {
      query.createdBy = req.user.id;
    }
    // Approvers/Reviewers see all CRs EXCEPT Draft status
    else if (canApprove(userRole)) {
      query.status = { $ne: 'Draft' }; // Exclude Draft CRs
    }
    // Default: see all CRs (for any other roles like Admin)
    
    const crs = await ChangeRequest.find(query)
      .populate('createdBy', 'email role')
      .populate('submittedBy', 'email role')
      .populate('approvedBy', 'email role')
      .populate('rejectedBy', 'email role')
      .sort({ updatedAt: -1 });
    
    res.json({ changeRequests: crs });
  } catch (error) {
    console.error('Error fetching CRs:', error);
    res.status(500).json({ error: 'Failed to fetch change requests' });
  }
});

// GET ONE - With proper access control
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const cr = await ChangeRequest.findById(req.params.id)
      .populate('createdBy', 'email role')
      .populate('submittedBy', 'email role')
      .populate('approvedBy', 'email role')
      .populate('rejectedBy', 'email role');

    if (!cr) {
      return res.status(404).json({ message: 'CR not found' });
    }

    // Access control: Developer-level roles can only view their own CRs
    if (isDeveloperRole(req.user.role)) {
      if (!cr.createdBy) {
        console.error(`CR ${req.params.id} has no createdBy field`);
        return res.status(500).json({ message: 'Data integrity error: CR has no creator' });
      }
      if (cr.createdBy._id.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden: You do not have permission to view this CR.' });
      }
    }
    // Approvers can view any CR (no additional check needed)

    res.json({ changeRequest: cr });
  } catch (error) {
    console.error('Error fetching single CR:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid CR ID format' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// UPDATE - Only creator can update Draft CRs
router.put('/:id', [authMiddleware, roleAuth(['Developer', 'QA Engineer', 'DevOps Engineer'])], async (req, res) => {
  const { title, description, category, priority, impact_scope, attachments } = req.body;
  
  try {
    let cr = await ChangeRequest.findById(req.params.id);
    
    if (!cr) {
      return res.status(404).json({ message: 'CR not found' });
    }

    if (!cr.createdBy || cr.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You are not the creator of this CR.' });
    }
    
    if (cr.status !== 'Draft') {
      return res.status(403).json({ message: 'Forbidden: This CR is already under review and cannot be edited.' });
    }

    // Update fields
    cr.title = title || cr.title;
    cr.description = description || cr.description;
    cr.category = category || cr.category;
    cr.priority = priority || cr.priority;
    cr.impact_scope = impact_scope || cr.impact_scope;
    
    // Handle attachments - normalize to array format
    if (attachments !== undefined) {
      if (Array.isArray(attachments)) {
        cr.attachments = attachments.filter(a => a && a.trim());
      } else if (typeof attachments === 'string' && attachments.trim()) {
        cr.attachments = [attachments.trim()];
      } else {
        cr.attachments = [];
      }
    }

    const updatedCR = await cr.save();
    
    // Populate before returning
    const populatedCR = await ChangeRequest.findById(updatedCR._id)
      .populate('createdBy', 'email role');
    
    res.json(populatedCR);
  } catch (error) {
    console.error('Error updating CR:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// SUBMIT FOR APPROVAL - Change status from Draft to Pending
router.put('/:id/submit', [authMiddleware, roleAuth(['Developer', 'QA Engineer', 'DevOps Engineer'])], async (req, res) => {
  try {
    let cr = await ChangeRequest.findById(req.params.id);
    
    if (!cr) {
      return res.status(404).json({ message: 'CR not found' });
    }

    if (!cr.createdBy || cr.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You are not the creator of this CR.' });
    }
    
    if (cr.status !== 'Draft') {
      return res.status(400).json({ message: 'This CR has already been submitted.' });
    }

    cr.status = 'Pending';
    cr.submittedBy = req.user.id;
    cr.submittedAt = new Date();

    await cr.save();
    
    // Populate before returning
    const populatedCR = await ChangeRequest.findById(cr._id)
      .populate('createdBy', 'email role')
      .populate('submittedBy', 'email role');
    
    res.json(populatedCR);
  } catch (error) {
    console.error('Error submitting CR:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// APPROVE - Only approvers can approve Pending CRs
// UPDATED: Accept comment from request body
router.put('/:id/approve', [authMiddleware], async (req, res) => {
  try {
    // Check if user has approval permissions
    if (!canApprove(req.user.role)) {
      return res.status(403).json({ 
        message: 'Forbidden: Your role does not have approval permissions.' 
      });
    }
    
    const { comment } = req.body;
    
    let cr = await ChangeRequest.findById(req.params.id);
    
    if (!cr) {
      return res.status(404).json({ message: 'CR not found' });
    }
    
    if (cr.status !== 'Pending') {
      return res.status(400).json({ message: 'This CR is not pending approval.' });
    }
    
    cr.status = 'Approved';
    cr.approvedBy = req.user.id;
    cr.approvalDate = new Date();
    
    // Store approval comment if provided
    if (comment && comment.trim()) {
      cr.approvalComment = comment.trim();
    }
    
    await cr.save();
    
    const populatedCR = await ChangeRequest.findById(cr._id)
      .populate('createdBy', 'email role')
      .populate('submittedBy', 'email role')
      .populate('approvedBy', 'email role')
      .populate('rejectedBy', 'email role');
    
    res.json(populatedCR);
  } catch (error) {
    console.error('Error approving CR:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// REJECT - Only approvers can reject Pending CRs
// UPDATED: Accept both 'reason' and 'comment' for flexibility
router.put('/:id/reject', [authMiddleware], async (req, res) => {
  const { reason, comment } = req.body;
  
  // Accept either 'reason' or 'comment'
  const rejectionText = reason || comment;
  
  if (!rejectionText || !rejectionText.trim()) {
    return res.status(400).json({ message: 'A rejection reason is required.' });
  }
  
  try {
    // Check if user has approval permissions (same roles can reject)
    if (!canApprove(req.user.role)) {
      return res.status(403).json({ 
        message: 'Forbidden: Your role does not have rejection permissions.' 
      });
    }
    
    let cr = await ChangeRequest.findById(req.params.id);
    
    if (!cr) {
      return res.status(404).json({ message: 'CR not found' });
    }
    
    if (cr.status !== 'Pending') {
      return res.status(400).json({ message: 'This CR is not pending rejection.' });
    }
    
    cr.status = 'Rejected';
    cr.rejectedBy = req.user.id;
    cr.rejectionDate = new Date();
    cr.rejectionReason = rejectionText.trim();
    
    await cr.save();
    
    const populatedCR = await ChangeRequest.findById(cr._id)
      .populate('createdBy', 'email role')
      .populate('submittedBy', 'email role')
      .populate('approvedBy', 'email role')
      .populate('rejectedBy', 'email role');
    
    res.json(populatedCR);
  } catch (error) {
    console.error('Error rejecting CR:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE - Only creator can delete Draft CRs
router.delete('/:id', [authMiddleware, roleAuth(['Developer', 'QA Engineer', 'DevOps Engineer'])], async (req, res) => {
  try {
    const cr = await ChangeRequest.findById(req.params.id);
    
    if (!cr) {
      return res.status(404).json({ message: 'CR not found' });
    }

    if (!cr.createdBy || cr.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You are not the creator of this CR.' });
    }
    
    if (cr.status !== 'Draft') {
      return res.status(403).json({ message: 'Forbidden: Cannot delete a CR that is already under review.' });
    }

    await cr.deleteOne();
    res.json({ message: 'CR deleted successfully' });
  } catch (error) {
    console.error('Error deleting CR:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;