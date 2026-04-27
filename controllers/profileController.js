const Review     = require('../models/Review');
const SavedPlace = require('../models/SavedPlace');
const Activity   = require('../models/Activity');
const User       = require('../models/user');

// ── Helper: log an activity silently (never throws) ─────────────────────────
async function logActivity(userId, type, title, description = '', meta = {}) {
  try {
    await Activity.create({ userId, type, title, description, meta });
  } catch (err) {
    console.error('Activity log failed:', err.message);
  }
}

// ── GET /profile ─────────────────────────────────────────────────────────────
exports.renderProfile = async (req, res) => {
  try {
    const userId = req.session.userId;
    const user   = await User.findById(userId);

    // Counts
    const reviewsCount = await Review.countDocuments({ userId });
    const savedCount   = await SavedPlace.countDocuments({ userId });

    // Trips count = unique states the user has reviewed or saved
    const reviewStates = await Review.distinct('state', { userId });
    const savedStates  = await SavedPlace.distinct('state', { userId });
    const allStates    = [...new Set([...reviewStates, ...savedStates])];
    const tripsCount   = allStates.length;

    // Recent activities (last 10)
    const activities = await Activity.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Recent reviews (last 5)
    const recentReviews = await Review.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Recent saved places (last 5)
    const recentSaved = await SavedPlace.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.render('profile', {
      user,
      currentUser: req.session.userId,
      userRole:    req.session.userRole,
      reviewsCount,
      savedCount,
      tripsCount,
      activities,
      recentReviews,
      recentSaved,
    });
  } catch (err) {
    console.error('Profile render error:', err);
    res.redirect('/home');
  }
};

// ── POST /api/save-place — toggle save/unsave ────────────────────────────────
exports.savePlace = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: 'Login required' });

    const { placeId, placeName, state, stateId, city, cityId, image } = req.body;
    if (!placeId || !placeName || !state) {
      return res.status(400).json({ error: 'placeId, placeName, and state are required' });
    }

    // Check if already saved
    const existing = await SavedPlace.findOne({ userId, placeId });

    if (existing) {
      // Unsave
      await SavedPlace.deleteOne({ _id: existing._id });
      await logActivity(userId, 'unsave', `Removed ${placeName}`, `Removed from wishlist`, { placeId, state });
      return res.json({ saved: false, message: `${placeName} removed from saved` });
    }

    // Save
    await SavedPlace.create({ userId, placeId, placeName, state, stateId, city, cityId, image });
    await logActivity(userId, 'save', `Saved ${placeName}`, `Added to your wishlist`, { placeId, state, city });
    res.status(201).json({ saved: true, message: `${placeName} saved!` });
  } catch (err) {
    console.error('Save place error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ── GET /api/saved-places — check which places are saved ─────────────────────
exports.getSavedPlaces = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.json({ savedPlaceIds: [] });

    const saved = await SavedPlace.find({ userId }).select('placeId').lean();
    res.json({ savedPlaceIds: saved.map(s => s.placeId) });
  } catch (err) {
    console.error(err);
    res.json({ savedPlaceIds: [] });
  }
};

// ── GET /api/profile-stats — AJAX endpoint for live updates ──────────────────
exports.getProfileStats = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: 'Login required' });

    const reviewsCount = await Review.countDocuments({ userId });
    const savedCount   = await SavedPlace.countDocuments({ userId });

    const reviewStates = await Review.distinct('state', { userId });
    const savedStates  = await SavedPlace.distinct('state', { userId });
    const tripsCount   = [...new Set([...reviewStates, ...savedStates])].length;

    const activities = await Activity.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json({ reviewsCount, savedCount, tripsCount, activities });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Export the helper so other controllers can use it
exports.logActivity = logActivity;
