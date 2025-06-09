// 1. 모듈 및 DB 연결
require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const mongoose = require('mongoose');
const cors = require('cors');

// 라우트 파일들
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const scheduleRouter = require('./routes/schedule');
const calendarRouter = require('./routes/calendar');
const profileRouter = require('./routes/profile');
const routinesRouter = require('./routes/routines');

const app = express();

// MongoDB 연결
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// 2. CORS 설정 (가장 먼저)
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// 3. 미들웨어 설정
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 4. 세션 설정
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-here',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7일
    secure: false, // 개발환경에서는 false
    sameSite: 'lax'
  }
}));

// 5. 정적 파일 서빙 (CSS, JS, 이미지 등)
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    // CSS 파일에 대한 MIME 타입 설정
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
    // JavaScript 파일에 대한 MIME 타입 설정
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
    // CORS 헤더 추가
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));

// 6. API 라우트 설정
app.use('/api', authRoutes);           // 인증 관련 (/api/login, /api/register, etc.)
app.use('/api', apiRoutes);            // 기존 API (/api/recommend, /api/user-stats)
app.use('/api/schedule', scheduleRouter); // 스케줄 관련
app.use('/api/calendar', calendarRouter); // 캘린더 관련 (/api/calendar/events)
app.use('/api/profile', profileRouter);   // 프로필 관련 (/api/profile)
app.use('/api/routines', routinesRouter); // 루틴 관련 (/api/routines)

// 7. CSS 파일 라우트 추가 (문제 해결용)
app.get('/css/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'public', 'css', filename);
  
  res.setHeader('Content-Type', 'text/css');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('CSS 파일 로딩 오류:', filename, err);
      res.status(404).send('CSS 파일을 찾을 수 없습니다.');
    }
  });
});

// 8. API 경로가 아닌 경우에만 index.html 반환 (SPA 라우팅)
app.get(/^\/(?!api|css|js|images).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 9. 404 에러 핸들링 (API 전용)
app.use('/api/*', (req, res) => {
  console.error('❌ API 엔드포인트를 찾을 수 없음:', req.originalUrl);
  res.status(404).json({ 
    error: 'API 엔드포인트를 찾을 수 없습니다',
    path: req.originalUrl 
  });
});

// 10. 전역 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  
  // 개발환경에서는 자세한 에러, 프로덕션에서는 간단한 메시지
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ 
      error: '서버 내부 오류가 발생했습니다'
    });
  } else {
    res.status(500).json({ 
      error: '서버 내부 오류가 발생했습니다',
      message: err.message,
      stack: err.stack
    });
  }
});

// 11. 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 서버가 http://localhost:${PORT} 에서 실행 중입니다`);
  console.log(`📁 사용 가능한 API 라우트:`);
  console.log(`   - /api/auth (로그인/회원가입)`);
  console.log(`   - /api/profile (프로필 관리)`);
  console.log(`   - /api/calendar (캘린더 이벤트)`);
  console.log(`   - /api/routines (루틴 관리)`);
  console.log(`   - /api/schedule (오늘의 일정)`);
  console.log(`   - /api/recommend (AI 루틴 생성)`);
  console.log(`📌 정적 파일 경로: ${path.join(__dirname, 'public')}`);
});