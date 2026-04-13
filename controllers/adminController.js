const Experience = require("../models/Experience");
const User = require("../models/user");

// ── GET /admin/experiences ───────────────────────────────────────────────────
const getAdminExperiences = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const experiences = await Experience.find(filter)
      .populate("hostId", "name email")
      .sort({ createdAt: -1 });

    const counts = {
      all:      await Experience.countDocuments({}),
      pending:  await Experience.countDocuments({ status: "pending" }),
      approved: await Experience.countDocuments({ status: "approved" }),
      rejected: await Experience.countDocuments({ status: "rejected" }),
    };

    res.render("admin/experiences", {
      experiences,
      counts,
      activeFilter: status || "all",
      currentUser: req.session.userId,
      error:   req.flash("error"),
      success: req.flash("success"),
    });
  } catch (err) {
    console.error(err);
    res.redirect("/");
  }
};

// ── POST /admin/experiences/:id/approve ──────────────────────────────────────
const approveExperience = async (req, res) => {
  try {
    await Experience.findByIdAndUpdate(req.params.id, {
      status: "approved",
      rejectionReason: "",
    });
    req.flash("success", "Experience approved and is now live.");
    res.redirect("/admin/experiences?status=pending");
  } catch (err) {
    console.error(err);
    req.flash("error", "Could not approve experience.");
    res.redirect("/admin/experiences");
  }
};

// ── POST /admin/experiences/:id/reject ───────────────────────────────────────
const rejectExperience = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    await Experience.findByIdAndUpdate(req.params.id, {
      status: "rejected",
      rejectionReason: rejectionReason || "Did not meet platform guidelines.",
    });
    req.flash("success", "Experience rejected.");
    res.redirect("/admin/experiences?status=pending");
  } catch (err) {
    console.error(err);
    req.flash("error", "Could not reject experience.");
    res.redirect("/admin/experiences");
  }
};

// ── POST /admin/experiences/:id/feature ──────────────────────────────────────
const toggleFeature = async (req, res) => {
  try {
    const exp = await Experience.findById(req.params.id);
    await Experience.findByIdAndUpdate(req.params.id, {
      isFeatured: !exp.isFeatured,
    });
    req.flash("success", `Experience ${exp.isFeatured ? "unfeatured" : "featured"}.`);
    res.redirect("/admin/experiences");
  } catch (err) {
    req.flash("error", "Could not update feature status.");
    res.redirect("/admin/experiences");
  }
};

module.exports = {
  getAdminExperiences,
  approveExperience,
  rejectExperience,
  toggleFeature,
};