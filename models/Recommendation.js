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
  feedback: String, // 사용자가 나중에 피드백 남길 수 있도록 추가
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Recommendation', recommendationSchema);
