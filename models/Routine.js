const mongoose = require('mongoose');

const RoutineSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: String,
  routineItems: Array,
  startDate: String,
  duration: Number,
  fullRoutine: String,
  dailyRoutines: Array,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Routine', RoutineSchema);