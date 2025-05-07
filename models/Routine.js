const mongoose = require('mongoose');

const routineSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 1,
    max: 31
  },
  routineItems: [{
    subject: {
      type: String,
      required: true
    },
    dailyHours: {
      type: Number,
      required: true,
      min: 0.5,
      max: 12
    },
    focusTime: {
      type: String,
      enum: ['morning', 'forenoon', 'afternoon', 'evening', 'night'],
      required: true
    },
    unavailableTimes: {
      type: String
    },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    },
    selectedDays: [{
      type: String,
      enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
    }],
    notes: {
      type: String
    }
  }],
  fullRoutine: {
    type: String
  },
  dailyRoutines: [{
    day: {
      type: Number,
      required: true
    },
    date: {
      type: String
    },
    content: {
      type: String
    },
    schedules: [{
      startTime: {
        type: String,
        required: true
      },
      endTime: {
        type: String,
        required: true
      },
      title: {
        type: String,
        required: true
      },
      subject: {
        type: String
      },
      notes: {
        type: String
      }
    }]
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Routine', routineSchema);