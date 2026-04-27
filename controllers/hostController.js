const User = require("../models/user");
const Experience = require("../models/Experience");

// ── GET /host/register ───────────────────────────────────────────────────────
const getRegisterHost = (req, res) => {
  res.render("host/register", {
    currentUser: req.session.userId || null,
    error: req.flash("error"),
    success: req.flash("success"),
  });
};

// ── POST /host/register ──────────────────────────────────────────────────────
const postRegisterHost = async (req, res) => {
  try {
    const {
      hostBio, hostCity, hostState, hostCountry,
      hostWhyJoin, hostExpertise,
    } = req.body;

    // hostExpertise can come as array (checkboxes) or string
    const expertiseArray = Array.isArray(hostExpertise)
      ? hostExpertise
      : [hostExpertise].filter(Boolean);

    await User.findByIdAndUpdate(req.session.userId, {
      hostBio,
      hostCity,
      hostState,
      hostCountry,
      hostWhyJoin,
      hostExpertise: expertiseArray,
      hostApplicationStatus: "approved", // auto-approve; change to "pending" if you want admin review
      role: "host",
    });

    // Update session role immediately
    req.session.userRole = "host";

    req.flash("success", "Welcome! You are now a Local Host.");
    res.redirect("/host/dashboard");
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong. Please try again.");
    res.redirect("/host/register");
  }
};

// ── GET /host/dashboard ──────────────────────────────────────────────────────
const getDashboard = async (req, res) => {
  try {
    const hostId = req.session.userId;
    const allExperiences = await Experience.find({ hostId }).sort({ createdAt: -1 });

    const stats = {
      total:    allExperiences.length,
      pending:  allExperiences.filter(e => e.status === "pending").length,
      approved: allExperiences.filter(e => e.status === "approved").length,
      rejected: allExperiences.filter(e => e.status === "rejected").length,
    };

    const host = await User.findById(hostId);

    res.render("host/dashboard", {
      experiences: allExperiences,
      stats,
      host,
      currentUser: hostId,
      error:   req.flash("error"),
      success: req.flash("success"),
    });
  } catch (err) {
    console.error(err);
    res.redirect("/");
  }
};

// ── GET /host/create-experience ──────────────────────────────────────────────
const getCreateExperience = (req, res) => {
  const categories = [
    "Workshop","Food & Cooking","Heritage Walk","Music & Dance",
    "Festival","Mela / Fair","Spiritual","Storytelling",
    "Art & Craft","Guided Tour","Community Event","Other",
  ];
  res.render("host/create", {
    categories,
    currentUser: req.session.userId,
    error:   req.flash("error"),
    success: req.flash("success"),
  });
};

// ── POST /host/create-experience ─────────────────────────────────────────────
const postCreateExperience = async (req, res) => {
  try {
    const host = await User.findById(req.session.userId);
    const {
      title, description, category,
      placeName, city, state, country, address,
      date, time, duration,
      price, isFree, maxGuests,
      languages, highlights,
      images, contactEmail, contactPhone,
      lat, lng,
    } = req.body;

    // Build slug from title
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Make slug unique
    let slug = baseSlug;
    let count = 1;
    while (await Experience.findOne({ slug })) {
      slug = `${baseSlug}-${count++}`;
    }

    const highlightsArray = Array.isArray(highlights)
      ? highlights
      : highlights ? highlights.split("\n").map(h => h.trim()).filter(Boolean) : [];

    const languagesArray = Array.isArray(languages)
      ? languages
      : languages ? languages.split(",").map(l => l.trim()).filter(Boolean) : ["English"];

    const imagesArray = Array.isArray(images)
      ? images
      : images ? images.split(",").map(i => i.trim()).filter(Boolean) : [];

    await Experience.create({
      title,
      slug,
      description,
      category,
      placeName,
      city,
      state,
      country: country || "India",
      address,
      hostId:   host._id,
      hostName: host.name,
      hostBio:  host.hostBio || "",
      contactEmail,
      contactPhone,
      date:     date ? new Date(date) : null,
      time,
      duration,
      price:    isFree === "on" ? 0 : Number(price) || 0,
      isFree:   isFree === "on",
      maxGuests: Number(maxGuests) || 20,
      languages: languagesArray,
      highlights: highlightsArray,
      images:   imagesArray,
      location: { lat: lat || null, lng: lng || null },
      status:   "approved", // auto-approve so it shows immediately
    });

    req.flash("success", "Experience created successfully! It is now live on the site.");
    res.redirect("/host/dashboard");
  } catch (err) {
    console.error("❌ EXPERIENCE CREATE ERROR:", err.message);
    console.error(err);
    req.flash("error", "Failed to create experience: " + err.message);
    res.redirect("/host/create-experience");
  }
};

// ── GET /host/edit-experience/:id ─────────────────────────────────────────────
const getEditExperience = (req, res) => {
  // req.experience is attached by isExperienceOwner middleware
  const categories = [
    "Workshop","Food & Cooking","Heritage Walk","Music & Dance",
    "Festival","Mela / Fair","Spiritual","Storytelling",
    "Art & Craft","Guided Tour","Community Event","Other",
  ];
  res.render("host/edit", {
    experience: req.experience,
    categories,
    currentUser: req.session.userId,
    error:   req.flash("error"),
    success: req.flash("success"),
  });
};

// ── POST /host/edit-experience/:id ───────────────────────────────────────────
const postEditExperience = async (req, res) => {
  try {
    const {
      title, description, category,
      placeName, city, state, country, address,
      date, time, duration,
      price, isFree, maxGuests,
      languages, highlights, images,
      contactEmail, contactPhone, lat, lng,
    } = req.body;

    const highlightsArray = Array.isArray(highlights)
      ? highlights
      : highlights ? highlights.split("\n").map(h => h.trim()).filter(Boolean) : [];

    const languagesArray = Array.isArray(languages)
      ? languages
      : languages ? languages.split(",").map(l => l.trim()).filter(Boolean) : ["English"];

    const imagesArray = Array.isArray(images)
      ? images
      : images ? images.split(",").map(i => i.trim()).filter(Boolean) : [];

    await Experience.findByIdAndUpdate(req.params.id, {
      title,
      description,
      category,
      placeName,
      city,
      state,
      country,
      address,
      date:       date ? new Date(date) : null,
      time,
      duration,
      price:      isFree === "on" ? 0 : Number(price) || 0,
      isFree:     isFree === "on",
      maxGuests:  Number(maxGuests) || 20,
      languages:  languagesArray,
      highlights: highlightsArray,
      images:     imagesArray,
      contactEmail,
      contactPhone,
      location:   { lat: lat || null, lng: lng || null },
      status:     "approved", // keep approved after edit
    });

    req.flash("success", "Experience updated successfully!");
    res.redirect("/host/dashboard");
  } catch (err) {
    console.error(err);
    req.flash("error", "Update failed. Please try again.");
    res.redirect(`/host/edit-experience/${req.params.id}`);
  }
};

// ── POST /host/delete-experience/:id ─────────────────────────────────────────
const deleteExperience = async (req, res) => {
  try {
    await Experience.findByIdAndDelete(req.params.id);
    req.flash("success", "Experience deleted.");
    res.redirect("/host/dashboard");
  } catch (err) {
    console.error(err);
    req.flash("error", "Could not delete experience.");
    res.redirect("/host/dashboard");
  }
};

module.exports = {
  getRegisterHost,
  postRegisterHost,
  getDashboard,
  getCreateExperience,
  postCreateExperience,
  getEditExperience,
  postEditExperience,
  deleteExperience,
};