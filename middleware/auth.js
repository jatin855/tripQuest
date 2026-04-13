const Experience = require("../models/Experience");

// ── 1. Must be logged in ─────────────────────────────────────────────────────
const isLoggedIn = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  req.session.returnTo = req.originalUrl;
  req.flash("error", "Please log in to continue.");
  res.redirect("/login");
};

// ── 2. Must be a Host or Admin ───────────────────────────────────────────────
const isHost = (req, res, next) => {
  if (
    req.session &&
    req.session.userId &&
    (req.session.userRole === "host" || req.session.userRole === "admin")
  ) {
    return next();
  }
  req.flash("error", "You must be a registered host to access this page.");
  res.redirect("/host/register");
};

// ── 3. Must be Admin ─────────────────────────────────────────────────────────
const isAdmin = (req, res, next) => {
  if (req.session && req.session.userRole === "admin") {
    return next();
  }
  req.flash("error", "Admin access only.");
  res.redirect("/");
};

// ── 4. Must own the experience (or be admin) ─────────────────────────────────
const isExperienceOwner = async (req, res, next) => {
  try {
    const experience = await Experience.findById(req.params.id);
    if (!experience) {
      req.flash("error", "Experience not found.");
      return res.redirect("/host/dashboard");
    }
    const isOwner = experience.hostId.toString() === req.session.userId;
    const isAdminUser = req.session.userRole === "admin";
    if (isOwner || isAdminUser) {
      req.experience = experience; // attach to request for reuse
      return next();
    }
    req.flash("error", "You do not have permission to do that.");
    res.redirect("/host/dashboard");
  } catch (err) {
    console.error(err);
    res.redirect("/host/dashboard");
  }
};

module.exports = { isLoggedIn, isHost, isAdmin, isExperienceOwner };