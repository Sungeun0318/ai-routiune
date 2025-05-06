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
  saveUninitialized: false
}));

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: '필수 정보 누락' });
  if (await User.findOne({ username })) return res.status(409).json({ message: '이미 존재하는 사용자' });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ username, passwordHash });
  req.session.userId = user._id;
  res.json({ ok: true });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !await bcrypt.compare(password, user.passwordHash)) {
    return res.status(401).json({ message: '아이디·비밀번호 불일치' });
  }
  req.session.userId = user._id;
  res.json({ ok: true });
});

app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ ok: false });
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

app.get('/check-login', (req, res) => {
  res.json({ loggedIn: !!req.session.userId });
});

function requireLogin(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: '로그인 필요' });
  next();
}

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
    { model: 'gpt-3.5-turbo', messages: [{ role: 'user', content: prompt }] },
    { headers: { Authorization: `Bearer ${process.env.AI_API_KEY}` } }
  );
  return response.data.choices[0].message.content;
}

app.post('/api/recommend', requireLogin, async (req, res) => {
  try {
    const profile = req.body;
    const recText = await getRecommendation(profile);
    await Recommendation.create({ user: req.session.userId, profile, recommendation: recText });
    res.json({ recommendation: recText });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '추천 실패' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
