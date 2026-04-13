// ============================================================
// routes/experienceRoutes.js
// ============================================================
const express = require("express");
const router  = express.Router();
const {
  getAllExperiences,
  getExperienceBySlug,
  getExperiencesByCity,
} = require("../controllers/experienceController");

router.get("/",              getAllExperiences);
router.get("/city/:city",    getExperiencesByCity);   // API for place pages
router.get("/:slug",         getExperienceBySlug);

module.exports = router;