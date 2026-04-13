// routes/adminRoutes.js
const express = require("express");
const router  = express.Router();
const { isLoggedIn, isAdmin } = require("../middleware/auth");
const {
  getAdminExperiences,
  approveExperience,
  rejectExperience,
  toggleFeature,
} = require("../controllers/adminController");

router.get ("/"                       , isLoggedIn, isAdmin, getAdminExperiences);
router.post("/:id/approve"            , isLoggedIn, isAdmin, approveExperience);
router.post("/:id/reject"             , isLoggedIn, isAdmin, rejectExperience);
router.post("/:id/feature"            , isLoggedIn, isAdmin, toggleFeature);

module.exports = router;