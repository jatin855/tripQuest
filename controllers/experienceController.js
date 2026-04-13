const Experience = require("../models/Experience");

// ── GET /experiences ─────────────────────────────────────────────────────────
const getAllExperiences = async (req, res) => {
  try {
    const { category, city, pricing, when } = req.query;
    const filter = { status: "approved" };

    if (category) filter.category = category;
    if (city)     filter.city = new RegExp(city, "i");
    if (pricing === "free")  filter.isFree = true;
    if (pricing === "paid")  filter.isFree = false;
    if (when === "upcoming") filter.date = { $gte: new Date() };

    const experiences = await Experience.find(filter).sort({ createdAt: -1 });

    const categories = [
      "Workshop","Food & Cooking","Heritage Walk","Music & Dance",
      "Festival","Mela / Fair","Spiritual","Storytelling",
      "Art & Craft","Guided Tour","Community Event","Other",
    ];

    res.render("experiences/index", {
      experiences,
      categories,
      filters: req.query,
      currentUser: req.session.userId || null,
    });
  } catch (err) {
    console.error(err);
    res.redirect("/");
  }
};

// ── GET /experiences/:slug ───────────────────────────────────────────────────
const getExperienceBySlug = async (req, res) => {
  try {
    const experience = await Experience.findOne({
      slug: req.params.slug,
      status: "approved",
    }).populate("hostId", "name email profileImage");

    if (!experience) {
      req.flash("error", "Experience not found.");
      return res.redirect("/experiences");
    }

    // Related experiences in same city
    const related = await Experience.find({
      city: experience.city,
      status: "approved",
      _id: { $ne: experience._id },
    }).limit(3);

    res.render("experiences/show", {
      experience,
      related,
      currentUser: req.session.userId || null,
    });
  } catch (err) {
    console.error(err);
    res.redirect("/experiences");
  }
};

// ── API: experiences by city (for place pages like /place/varanasi) ──────────
const getExperiencesByCity = async (req, res) => {
  try {
    const { city } = req.params;
    const experiences = await Experience.find({
      city: new RegExp(city, "i"),
      status: "approved",
    })
      .limit(6)
      .sort({ isFeatured: -1, createdAt: -1 });

    res.json({ success: true, experiences });
  } catch (err) {
    res.json({ success: false, experiences: [] });
  }
};

module.exports = {
  getAllExperiences,
  getExperienceBySlug,
  getExperiencesByCity,
};