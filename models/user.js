// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//     name: {
//         type: String,
//         required: true,
//         trim: true                  // removes accidental leading/trailing spaces
//     },
//     email: {
//         type: String,
//         required: true,
//         unique: true,
//         trim: true,
//         lowercase: true             // stores email as lowercase to avoid case duplicates
//     },
//     password: {
//         type: String,
//         required: true
//     },
//     image: {
//         type: String,
//         default: ""
//     }
// }, { timestamps: true });           // adds createdAt and updatedAt fields automatically

// module.exports = mongoose.model('User', userSchema);
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['traveler', 'host', 'admin', 'shopowner'],
    default: 'traveler'
  },
  isHostVerified: { type: Boolean, default: false },
  hostBio: { type: String },
  hostCity: { type: String },
  hostState: { type: String },
  hostCountry: { type: String },
  hostExpertise: [{ type: String }],
  hostApplicationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', null],
    default: null
  },
  profileImage: { type: String, default: '/images/default-host.jpg' },
  shopApplicationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', null],
    default: null
  },
  shopName: { type: String, default: '' }
}, { timestamps: true });

// NOTE: Password is hashed manually in app.js before create/update calls.
// Pre-save hook removed to prevent double-hashing.

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);