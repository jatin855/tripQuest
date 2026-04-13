const mongoose = require("mongoose");

const festivalSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    description: { type: String, required: true },
    city:        { type: String, required: true },
    state:       { type: String, default: "" },
    country:     { type: String, default: "India" },
    startDate:   { type: Date, required: true },
    endDate:     { type: Date, required: true },
    image:       { type: String, default: "" },
    category: {
      type: String,
      enum: ["Religious", "Cultural", "Music", "Food", "Art", "Folk", "Other"],
      default: "Cultural",
    },
    isApproved:  { type: Boolean, default: false },
    isFeatured:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Festival", festivalSchema);