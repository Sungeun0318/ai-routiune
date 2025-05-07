const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  },
  settings: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    language: {
      type: String,
      enum: ['ko', 'en'],
      default: 'ko'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);