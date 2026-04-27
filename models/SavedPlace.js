const mongoose = require('mongoose');

const savedPlaceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  placeId: {
    type: String,
    required: true,
    trim: true,
  },
  placeName: {
    type: String,
    required: true,
    trim: true,
  },
  state: {
    type: String,
    required: true,
    trim: true,
  },
  stateId: {
    type: String,
    trim: true,
  },
  city: {
    type: String,
    trim: true,
  },
  cityId: {
    type: String,
    trim: true,
  },
  image: {
    type: String,
    default: '',
  },
}, { timestamps: true });

// Prevent duplicate saves — same user can't save the same place twice
savedPlaceSchema.index({ userId: 1, placeId: 1 }, { unique: true });

module.exports = mongoose.model('SavedPlace', savedPlaceSchema);
