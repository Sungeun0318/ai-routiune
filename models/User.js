const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  email: {
    type: String,
    trim: true
  },
  displayName: {
    type: String,
    trim: true
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  // 캘린더 이벤트들
  calendarEvents: [{
    id: String,
    title: String,
    start: String,
    end: String,
    backgroundColor: String,
    borderColor: String,
    subject: String,
    notes: String,
    completed: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: Date
  }],
  // 생성된 루틴들
  routines: [{
    id: String,
    title: String,
    subjects: [String],
    routineItems: [{
      subjectType: String,
      subject: String,
      dailyHours: Number,
      selectedDays: [String],
      focusTimeByDay: Object,
      unavailableTimeByDay: Object,
      notes: String
    }],
    startDate: String,
    duration: Number,
    fullRoutine: String,
    dailyRoutines: [Object],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // 통계
  stats: {
    routineCount: {
      type: Number,
      default: 0
    },
    completedCount: {
      type: Number,
      default: 0
    }
  }
});

// 패스워드 비교 메소드
UserSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.passwordHash);
};

// 완료된 일정 수 계산 메소드
UserSchema.methods.getCompletedCount = function() {
  if (!this.calendarEvents) return 0;
  return this.calendarEvents.filter(event => event.completed).length;
};

// 통계 업데이트 메소드
UserSchema.methods.updateStats = function() {
  this.stats.routineCount = this.routines ? this.routines.length : 0;
  this.stats.completedCount = this.getCompletedCount();
};

// 저장 전 통계 자동 업데이트
UserSchema.pre('save', function(next) {
  this.updateStats();
  next();
});

module.exports = mongoose.model('User', UserSchema);