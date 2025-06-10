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
  // ✅ 기존 코드에서 사용하는 passwordHash 필드
  passwordHash: {
    type: String,
    required: true,
    minlength: 6
  },
  // ✅ 기존 password 필드도 호환성 위해 유지 (선택사항)
  password: {
    type: String,
    minlength: 6
  },
  nickname: {
    type: String,
    trim: true,
    maxlength: 30,
    default: function() { return this.username; }
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  // ✅ 기존 코드에서 사용하는 lastLogin 필드
  lastLogin: {
    type: Date,
    default: Date.now
  },
  
  // ✅ 루틴 데이터 (필수 필드 제거하여 오류 방지)
  routines: [{
    id: { type: String },
    title: { type: String },  // required 제거
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
    startDate: { type: Date },  // required 제거
    endDate: { type: Date },    // 이 필드가 문제였음 - required 제거
    duration: { type: Number },
    fullRoutine: { type: String },
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
  
  // ✅ 캘린더 이벤트 데이터 (기존 코드 호환)
  calendarEvents: [{
    id: { type: String },
    title: { type: String },
    start: { type: Date },
    end: { type: Date },
    backgroundColor: { type: String, default: '#4361ee' },
    borderColor: { type: String, default: '#4361ee' },
    subject: { type: String, default: '' },
    notes: { type: String, default: '' },
    completed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }],
  
  // ✅ 사용자 설정 (기존 코드 호환)
  preferences: {
    theme: { type: String, default: 'light' },
    language: { type: String, default: 'ko' },
    notifications: { type: Boolean, default: true }
  },
  
  // ✅ 통계 데이터 (기존 코드 호환)
  stats: {
    totalRoutines: { type: Number, default: 0 },
    completedEvents: { type: Number, default: 0 },
    totalStudyHours: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: Date.now },  // lastActivity → lastActiveDate로 통일
    lastActivity: { type: Date, default: Date.now }     // 호환성 유지
  }
}, {
  timestamps: true
});

// ✅ 인덱스 설정 (기존 코드 호환)
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ 'routines.id': 1 });
userSchema.index({ 'calendarEvents.id': 1 });
userSchema.index({ 'calendarEvents.start': 1 });

// ✅ 가상 필드 - 총 루틴 수 (기존 코드 호환)
userSchema.virtual('routineCount').get(function() {
  return this.routines ? this.routines.length : 0;
});

// ✅ 가상 필드 - 완료된 이벤트 수 (기존 코드 호환)
userSchema.virtual('completedEventCount').get(function() {
  return this.calendarEvents 
    ? this.calendarEvents.filter(event => event.completed).length 
    : 0;
});

// ✅ 가상 필드 - 오늘의 이벤트 (기존 코드 호환)
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

// ✅ 스키마 메서드 - 루틴 추가 (기존 코드 호환)
userSchema.methods.addRoutine = function(routineData) {
  if (!this.routines) {
    this.routines = [];
  }
  this.routines.push(routineData);
  this.stats.totalRoutines = this.routines.length;
  return this.save();
};

// ✅ 스키마 메서드 - 이벤트 추가 (기존 코드 호환)
userSchema.methods.addEvent = function(eventData) {
  if (!this.calendarEvents) {
    this.calendarEvents = [];
  }
  this.calendarEvents.push(eventData);
  return this.save();
};

// ✅ 스키마 메서드 - 이벤트 완료 처리 (기존 코드 호환)
userSchema.methods.toggleEventCompletion = function(eventId) {
  const event = this.calendarEvents.find(e => e.id === eventId);
  if (event) {
    event.completed = !event.completed;
    event.updatedAt = new Date();
    
    // 통계 업데이트
    this.stats.completedEvents = this.calendarEvents.filter(e => e.completed).length;
    this.stats.lastActivity = new Date();
    this.stats.lastActiveDate = new Date();  // 호환성 위해 둘 다 업데이트
    
    return this.save();
  }
  return Promise.reject(new Error('이벤트를 찾을 수 없습니다'));
};

// ✅ 스키마 메서드 - 통계 업데이트 (기존 코드 호환)
userSchema.methods.updateStats = function() {
  this.stats.totalRoutines = this.routines ? this.routines.length : 0;
  this.stats.completedEvents = this.calendarEvents 
    ? this.calendarEvents.filter(e => e.completed).length 
    : 0;
  this.stats.lastActivity = new Date();
  this.stats.lastActiveDate = new Date();  // 호환성 위해 둘 다 업데이트
  return this.save();
};

// ✅ 미들웨어 - 저장 전 통계 업데이트 (기존 코드 호환)
userSchema.pre('save', function(next) {
  if (this.isModified('routines') || this.isModified('calendarEvents')) {
    this.stats.totalRoutines = this.routines ? this.routines.length : 0;
    this.stats.completedEvents = this.calendarEvents 
      ? this.calendarEvents.filter(e => e.completed).length 
      : 0;
    this.stats.lastActivity = new Date();
    this.stats.lastActiveDate = new Date();  // 호환성 위해 둘 다 업데이트
  }
  next();
});

// ✅ JSON 직렬화 시 민감한 정보 제외 (기존 코드 호환)
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.passwordHash;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);