const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");

// Render the reviews page (public — guests can browse, login required to submit)
router.get("/", reviewController.renderReviewsPage);

// API: Submit a review (no strict auth — controller pulls user from session if available)
router.post("/submit", reviewController.submitReview);

// API: Get reviews by state & city (public)
router.get("/fetch", reviewController.getReviews);

module.exports = router;