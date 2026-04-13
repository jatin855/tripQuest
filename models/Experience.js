const mongoose = require("mongoose");

const experienceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: [
        "Workshop",
        "Food & Cooking",
        "Heritage Walk",
        "Music & Dance",
        "Festival",
        "Mela / Fair",
        "Spiritual",
        "Storytelling",
        "Art & Craft",
        "Guided Tour",
        "Community Event",
        "Other",
      ],
      required: true,
    },

    // ── Location ─────────────────────────────────────────
    placeName: { type: String, required: true },
    city:      { type: String, required: true },
    state:     { type: String, default: "" },
    country:   { type: String, default: "India" },
    address:   { type: String, default: "" },
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },

    // ── Host Info ─────────────────────────────────────────
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    hostName:  { type: String, required: true },
    hostBio:   { type: String, default: "" },
    contactEmail: { type: String, default: "" },
    contactPhone: { type: String, default: "" },

    // ── Schedule ──────────────────────────────────────────
    date:     { type: Date,   default: null },
    time:     { type: String, default: "" },   // e.g. "10:00 AM"
    duration: { type: String, default: "" },   // e.g. "2 hours"

    // ── Pricing ───────────────────────────────────────────
    isFree: { type: Boolean, default: false },
    price:  { type: Number,  default: 0 },     // 0 if free

    // ── Details ───────────────────────────────────────────
    maxGuests:  { type: Number, default: 20 },
    languages:  { type: [String], default: ["English"] },
    highlights: { type: [String], default: [] },
    images:     { type: [String], default: [] }, // URLs

    // ── Stats ─────────────────────────────────────────────
    rating:       { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },

    // ── Moderation ────────────────────────────────────────
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: { type: String, default: "" },

    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Auto-generate slug from title if not provided
experienceSchema.pre("validate", function (next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
  next();
});

module.exports = mongoose.model("Experience", experienceSchema);