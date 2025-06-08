const mongoose = require('mongoose');

const RoutineSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String },
  subjects: [String],
  fullRoutine: { type: String },
  dailyRoutines: { type: Array },
  startDate: { type: Date },
  duration: { type: Number },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Routine', RoutineSchema);