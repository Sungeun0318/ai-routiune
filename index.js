require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const User = require('./models/User');
const Recommendation = require('./models/Recommendation');

const app = express();

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7일 동안 세션 유지
  }
}));



// 로그인 상태 확인용 (자동 로그인 확인)
app.get('/api/me', (req, res) => {
  if (req.session.userId) {
    return res.json({ ok: true });
  } else {
    return res.status(401).json({ ok: false });
  }
});

// 회원가입
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: '필수 정보 누락' });

  const existing = await User.findOne({ username });
  if (existing)
    return res.status(409).json({ message: '이미 존재하는 사용자입니다.' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ username, passwordHash });
  req.session.userId = user._id;
  res.json({ ok: true });
});

// 로그인
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !await bcrypt.compare(password, user.passwordHash)) {
    return res.status(401).json({ message: '아이디·비밀번호 불일치' });
  }
  req.session.userId = user._id;
  res.json({ ok: true });
});

// 로그아웃
app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ ok: false });
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

function requireLogin(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: '로그인 필요' });
  next();
}

// ChatGPT API로 추천 생성
async function getRecommendation(profile) {
  const prompt = `사용자 정보:
  이름: ${profile.name}
  목표: ${profile.goal}
  가능 시간: ${profile.hours}시간/일
  학습 방법: ${profile.method}
  집중 시간대: ${profile.focusTime}
  관심 분야: ${profile.interests}
  이 정보를 바탕으로 일간 또는 주간 단위의 학습 루틴을 캘린더 형식으로 추천해줘.`;

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }]
    },
    {
      headers: { Authorization: `Bearer ${process.env.AI_API_KEY}` }
    }
  );
  return response.data.choices[0].message.content;
}

// 추천 요청
app.post('/api/recommend', requireLogin, async (req, res) => {
  try {
    const recText = await getRecommendation(req.body);
    await Recommendation.create({
      user: req.session.userId,
      profile: req.body,
      recommendation: recText
    });
    return res.json({ recommendation: recText });
  } catch (err) {
    console.error('🔥 /api/recommend error:', err.response?.data || err);
    const status = err.response?.status || 500;
    const msg = err.response?.data?.error?.message || err.message || '서버 오류가 발생했습니다.';
    return res.status(status).json({ error: msg });
  }
});

// 피드백 저장
app.post('/api/feedback', requireLogin, async (req, res) => {
  const feedback = req.body.feedback;
  await Recommendation.findOneAndUpdate(
    { user: req.session.userId },
    { feedback },
    { sort: { createdAt: -1 } }
  );
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
