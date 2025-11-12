const express = require('express');
const ChangeRequest = require('../models/ChangeRequest');
const authMiddleware = require('../middleware/authMiddleware'); // Import standard auth
const roleAuth = require('../middleware/roleAuth');
const router = express.Router();

// ** THE FIX IS HERE **
// This new function finds the highest number, so it's safe
// if you delete a CR.
async function generateCrNumber() {
  const year = new Date().getFullYear();
  const yearRegex = new RegExp(`^CR-${year}`);

  const lastCR = await ChangeRequest.findOne({ cr_number: yearRegex })
                                    .sort({ cr_number: -1 }); // Sort descending

  let nextNum = 1;

  if (lastCR) {
    const lastNum = parseInt(lastCR.cr_number.split('-')[2], 10);
    nextNum = lastNum + 1;
  }
  
  const nextId = nextNum.toString().padStart(4, '0');
  return `CR-${year}-${nextId}`; // Format: CR-YYYY-XXXX
}

// --- POST /api/change-requests (SE-8: Submit Draft) ---
router.post(
  '/', 
  [authMiddleware, roleAuth(['Developer'])],
  async (req, res) => {
    const { title, description, category, priority, impact_scope, attachments } = req.body;
    
    try {
      const cr_number = await generateCrNumber(); // Uses the new, fixed function
      
      const newCR = new ChangeRequest({
        title,
        description,
        category,
        priority,
        impact_scope,
        attachments: attachments ? [attachments] : [],
        cr_number,
        createdBy: req.user.id, 
        status: 'Draft'
      });
      
      await newCR.save();
      
      res.status(201).json(newCR); 
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create change request' });
    }
  }
);

// --- GET /api/change-requests (SE-9: View My CRs) ---
router.get('/', authMiddleware, async (req, res) => {
  try {
    let query = {}; 
    const userRole = req.user.role;

    if (userRole === 'Developer') {
      query.createdBy = req.user.id;
    }
    
    const crs = await ChangeRequest.find(query).sort({ createdAt: -1 });
    res.json({ changeRequests: crs });

  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch change requests' });
  }
});

// We should also add the PUT and DELETE routes from my previous message
// to pass all your test cases.

// --- PUT /api/change-requests/:id (Update a Draft) ---
router.put(
  '/:id', 
  [authMiddleware, roleAuth(['Developer'])],
  async (req, res) => {
    const { status, title, description, category, priority, impact_scope, attachments } = req.body;
    
    try {
      let cr = await ChangeRequest.findById(req.params.id);
      if (!cr) {
        return res.status(404).json({ message: 'CR not found' });
      }
      if (cr.createdBy.toString() !== req.user.id) {
         return res.status(403).json({ message: 'Forbidden: You are not the creator of this CR.' });
      }
      if (cr.status !== 'Draft') {
         return res.status(403).json({ message: 'Forbidden: This CR is already under review and cannot be edited.' });
      }

      cr.title = title || cr.title;
      cr.description = description || cr.description;
      cr.category = category || cr.category;
      cr.priority = priority || cr.priority;
      cr.impact_scope = impact_scope || cr.impact_scope;
      cr.attachments = attachments ? [attachments] : cr.attachments;
      if (status) {
        cr.status = status;
      }

      const updatedCR = await cr.save();
      res.json(updatedCR);

    } catch (error) {
      console.error('Error updating CR:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// --- DELETE /api/change-requests/:id (Delete a Draft) ---
router.delete(
  '/:id',
  [authMiddleware, roleAuth(['Developer'])],
  async (req, res) => {
    try {
      const cr = await ChangeRequest.findById(req.params.id);
      if (!cr) {
        return res.status(404).json({ message: 'CR not found' });
      }
      if (cr.createdBy.toString() !== req.user.id) {
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
  }
);

module.exports = router;