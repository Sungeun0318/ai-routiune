const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  profile: {
    name: String,
    goal: String,
    method: String,
    hours: String,
    focusTime: String,
    interests: String
  },
  recommendation: { type: String, required: true },
  feedback: String,
  events: [{ 
    title: String,
    start: String,
    end: String,
    description: String,
    color: String
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Recommendation', recommendationSchema);