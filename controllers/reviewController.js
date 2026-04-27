const Review = require("../models/Review");
const User   = require("../models/user");
const { logActivity } = require("./profileController");

// ── GET /reviews — render the reviews page ──────────────────────────────────
exports.renderReviewsPage = async (req, res) => {
  try {
    let user = null;
    if (req.session && req.session.userId) {
      user = await User.findById(req.session.userId);
    }
    res.render("reviews", {
      user,
      currentUser: req.session.userId || null,
      userRole:    req.session.userRole || null,
    });
  } catch (err) {
    console.error("Error rendering reviews page:", err);
    res.redirect("/home");
  }
};

// ── POST /reviews/submit — submit a review ──────────────────────────────────
exports.submitReview = async (req, res) => {
  try {
    const { state, city, rating, reviewText } = req.body;

    // Pull username from the logged-in session user
    let username = req.body.username || "Anonymous";
    let userId   = null;

    if (req.session && req.session.userId) {
      const user = await User.findById(req.session.userId);
      if (user) {
        username = user.name || username;
        userId   = user._id;
      }
    }

    if (!state || !city || !rating || !reviewText) {
      return res.status(400).json({ error: "All fields are required." });
    }

    if (reviewText.trim().length < 10) {
      return res.status(400).json({ error: "Review must be at least 10 characters." });
    }

    const review = new Review({
      username,
      userId,
      state,
      city,
      rating: parseInt(rating),
      reviewText: reviewText.trim(),
    });

    await review.save();

    // Auto-log activity for the profile feed
    if (userId) {
      await logActivity(
        userId,
        'review',
        `Reviewed ${city}`,
        `You gave ${city}, ${state} a ${rating}★ rating`,
        { state, city, rating: parseInt(rating), reviewId: review._id }
      );
    }

    res.status(201).json({ message: "Review submitted successfully!", review });
  } catch (err) {
    console.error("Error submitting review:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};


// ── GET /reviews/fetch?state=&city= — fetch reviews for a place ─────────────
exports.getReviews = async (req, res) => {
  try {
    const { state, city } = req.query;

    if (!state || !city) {
      return res.status(400).json({ error: "State and city are required." });
    }

    const reviews = await Review.find({ state, city })
      .sort({ createdAt: -1 })
      .lean();

    // Compute aggregate stats
    let avgRating = 0;
    const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    if (reviews.length > 0) {
      let total = 0;
      reviews.forEach((r) => {
        total += r.rating;
        ratingCounts[r.rating] = (ratingCounts[r.rating] || 0) + 1;
      });
      avgRating = (total / reviews.length).toFixed(1);
    }

    res.status(200).json({
      reviews,
      stats: {
        totalReviews: reviews.length,
        avgRating: parseFloat(avgRating),
        ratingCounts,
      },
    });
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};
