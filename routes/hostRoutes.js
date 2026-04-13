// routes/hostRoutes.js
const express = require("express");
const router  = express.Router();
const { isLoggedIn, isHost, isExperienceOwner } = require("../middleware/auth");
const {
  getRegisterHost,
  postRegisterHost,
  getDashboard,
  getCreateExperience,
  postCreateExperience,
  getEditExperience,
  postEditExperience,
  deleteExperience,
} = require("../controllers/hostController");

// Become a host
router.get ("/register",                  isLoggedIn,                            getRegisterHost);
router.post("/register",                  isLoggedIn,                            postRegisterHost);

// Dashboard
router.get ("/dashboard",                 isLoggedIn, isHost,                    getDashboard);

// Create experience
router.get ("/create-experience",         isLoggedIn, isHost,                    getCreateExperience);
router.post("/create-experience",         isLoggedIn, isHost,                    postCreateExperience);

// Edit experience
router.get ("/edit-experience/:id",       isLoggedIn, isHost, isExperienceOwner, getEditExperience);
router.post("/edit-experience/:id",       isLoggedIn, isHost, isExperienceOwner, postEditExperience);

// Delete experience
router.post("/delete-experience/:id",     isLoggedIn, isHost, isExperienceOwner, deleteExperience);

module.exports = router;