const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  nickname: {
    type: String,
    required: true,
    trim: true,
    maxlength: 30
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  // 루틴 데이터
  routines: [{
    id: { type: String, required: true },
    title: { type: String, required: true },
    subjects: [String],
    routineItems: [{
      subject: String,
      dailyHours: Number,
      selectedDays: [String],
      focusTimeSlots: [String],
      unavailableTimes: [{
        day: String,
        startTime: String,
        endTime: String
      }],
      notes: String
    }],
    startDate: { type: Date, required: true },
    duration: { type: Number, required: true },
    fullRoutine: { type: String, required: true },
    dailyRoutines: [{
      date: String,
      content: String,
      schedules: [{
        title: String,
        startTime: String,
        endTime: String,
        subject: String,
        notes: String
      }]
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }],
  
  // 캘린더 이벤트 데이터
  calendarEvents: [{
    id: { type: String, required: true },
    title: { type: String, required: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    backgroundColor: { type: String, default: '#4361ee' },
    borderColor: { type: String, default: '#4361ee' },
    subject: { type: String, default: '' },
    notes: { type: String, default: '' },
    completed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }],
  
  // 사용자 설정
  preferences: {
    theme: { type: String, default: 'light' },
    language: { type: String, default: 'ko' },
    notifications: { type: Boolean, default: true }
  },
  
  // 통계 데이터
  stats: {
    totalRoutines: { type: Number, default: 0 },
    completedEvents: { type: Number, default: 0 },
    totalStudyHours: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastActivity: { type: Date, default: Date.now }
  }
}, {
  timestamps: true
});

// 인덱스 설정
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ 'routines.id': 1 });
userSchema.index({ 'calendarEvents.id': 1 });
userSchema.index({ 'calendarEvents.start': 1 });

// 가상 필드 - 총 루틴 수
userSchema.virtual('routineCount').get(function() {
  return this.routines ? this.routines.length : 0;
});

// 가상 필드 - 완료된 이벤트 수
userSchema.virtual('completedEventCount').get(function() {
  return this.calendarEvents 
    ? this.calendarEvents.filter(event => event.completed).length 
    : 0;
});

// 가상 필드 - 오늘의 이벤트
userSchema.virtual('todayEvents').get(function() {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  
  return this.calendarEvents 
    ? this.calendarEvents.filter(event => {
        const eventDate = new Date(event.start);
        return eventDate >= todayStart && eventDate < todayEnd;
      })
    : [];
});

// 스키마 메서드 - 루틴 추가
userSchema.methods.addRoutine = function(routineData) {
  if (!this.routines) {
    this.routines = [];
  }
  this.routines.push(routineData);
  this.stats.totalRoutines = this.routines.length;
  return this.save();
};

// 스키마 메서드 - 이벤트 추가
userSchema.methods.addEvent = function(eventData) {
  if (!this.calendarEvents) {
    this.calendarEvents = [];
  }
  this.calendarEvents.push(eventData);
  return this.save();
};

// 스키마 메서드 - 이벤트 완료 처리
userSchema.methods.toggleEventCompletion = function(eventId) {
  const event = this.calendarEvents.find(e => e.id === eventId);
  if (event) {
    event.completed = !event.completed;
    event.updatedAt = new Date();
    
    // 통계 업데이트
    this.stats.completedEvents = this.calendarEvents.filter(e => e.completed).length;
    this.stats.lastActivity = new Date();
    
    return this.save();
  }
  return Promise.reject(new Error('이벤트를 찾을 수 없습니다'));
};

// 스키마 메서드 - 통계 업데이트
userSchema.methods.updateStats = function() {
  this.stats.totalRoutines = this.routines ? this.routines.length : 0;
  this.stats.completedEvents = this.calendarEvents 
    ? this.calendarEvents.filter(e => e.completed).length 
    : 0;
  this.stats.lastActivity = new Date();
  return this.save();
};

// 미들웨어 - 저장 전 통계 업데이트
userSchema.pre('save', function(next) {
  if (this.isModified('routines') || this.isModified('calendarEvents')) {
    this.stats.totalRoutines = this.routines ? this.routines.length : 0;
    this.stats.completedEvents = this.calendarEvents 
      ? this.calendarEvents.filter(e => e.completed).length 
      : 0;
    this.stats.lastActivity = new Date();
  }
  next();
});

// JSON 직렬화 시 민감한 정보 제외
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);