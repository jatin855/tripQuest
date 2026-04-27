const express = require('express');
const router = express.Router();
const { isLoggedIn, isAdmin } = require('../middleware/auth');
const {
  getApplications,
  approveApplication,
  rejectApplication
} = require('../controllers/marketplaceAdminController');

// View all shop applications
router.get('/',            isLoggedIn, isAdmin, getApplications);

// Approve application
router.post('/approve/:id', isLoggedIn, isAdmin, approveApplication);

// Reject application
router.post('/reject/:id',  isLoggedIn, isAdmin, rejectApplication);

module.exports = router;
