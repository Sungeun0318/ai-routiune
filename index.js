require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const User = require('./models/User');
const Recommendation = require('./models/Recommendation');
const cors = require('cors');
const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Middleware

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors({
  origin: '*',  // 모든 출처 허용 (개발 환경에서만 사용)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7-day session
  }
}));

// Authentication check middleware
const requireLogin = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: '로그인이 필요합니다' });
  next();
};

// Auto-login check


app.get('/api/me', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ ok: false });
  }
  
  try {
    const user = await User.findById(req.session.userId, { passwordHash: 0 });
    if (!user) {
      return res.status(401).json({ ok: false });
    }
    return res.json({ ok: true, user: { username: user.username } });
  } catch (err) {
    console.error('Auto-login check error:', err);
    return res.status(500).json({ ok: false, error: '서버 오류가 발생했습니다' });
  }
});

// Register
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: '사용자명과 비밀번호를 입력해주세요' });

  try {
    const existing = await User.findOne({ username });
    if (existing)
      return res.status(409).json({ message: '이미 존재하는 사용자입니다' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, passwordHash });
    req.session.userId = user._id;
    res.json({ ok: true });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: '회원가입 중 오류가 발생했습니다' });
  }
});

// Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const user = await User.findOne({ username });
    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      return res.status(401).json({ message: '아이디 또는 비밀번호가 일치하지 않습니다' });
    }
    
    req.session.userId = user._id;
    res.json({ ok: true, user: { username: user.username } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: '로그인 중 오류가 발생했습니다' });
  }
});

// Logout
app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ ok: false, error: '로그아웃 중 오류가 발생했습니다' });
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

// Generate recommendation using Hugging Face API
async function getRecommendation(profile) {
  try {
    const prompt = `사용자 정보:
이름: ${profile.name}
목표: ${profile.goal}
가능 시간: ${profile.hours}시간/일
학습 방법: ${profile.method}
집중 시간대: ${profile.focusTime}
관심 분야: ${profile.interests}

위 정보를 바탕으로 해당 사용자에게 최적화된 일간 또는 주간 단위의 자세한 학습 루틴을 추천해주세요. 
각 시간대별로 구체적인 활동을 제안하고, 집중 시간대와 관심 분야를 적극 활용한 루틴을 제공해주세요.
캘린더 형식에 적합하게 시간대별로 구분되고 일관된 형식으로 제공해주세요.`;

    // Call Hugging Face API
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/meta-llama/Llama-2-70b-chat-hf',
      { inputs: prompt },
      {
        headers: {
          'Authorization': `Bearer ${process.env.HF_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Extract the generated text from the response
    let recommendation = '';
    if (response.data && response.data[0]) {
      recommendation = response.data[0].generated_text || '';
      
      // Clean up the response - remove the prompt from the start if present
      if (recommendation.includes(prompt)) {
        recommendation = recommendation.substring(prompt.length).trim();
      }
    }
    
    return recommendation || '추천 루틴을 생성하는 중 오류가 발생했습니다';
  } catch (error) {
    console.error('Hugging Face API Error:', error.response?.data || error.message);
    if (error.response?.status === 429) {
      return '현재 많은 요청으로 인해 잠시 후에 다시 시도해주세요.';
    }
    return '추천 루틴을 생성하는 중 오류가 발생했습니다. 다시 시도해주세요.';
  }
}

// Get recommendation
app.post('/api/recommend', requireLogin, async (req, res) => {
  try {
    const recText = await getRecommendation(req.body);
    
    // Store recommendation in database
    await Recommendation.create({
      user: req.session.userId,
      profile: req.body,
      recommendation: recText,
      createdAt: new Date()
    });
    
    return res.json({ recommendation: recText });
  } catch (err) {
    console.error('Recommendation error:', err.response?.data || err);
    const status = err.response?.status || 500;
    const msg = err.response?.data?.error?.message || err.message || '서버 오류가 발생했습니다';
    return res.status(status).json({ error: msg });
  }
});

// Get user's recommendation history
app.get('/api/recommendations', requireLogin, async (req, res) => {
  try {
    const recommendations = await Recommendation.find(
      { user: req.session.userId },
      { recommendation: 0 } // Exclude the full text to keep response size smaller
    ).sort({ createdAt: -1 });
    
    res.json({ recommendations });
  } catch (err) {
    console.error('Error fetching recommendation history:', err);
    res.status(500).json({ error: '추천 기록을 불러오는 중 오류가 발생했습니다' });
  }
});

// Get a specific recommendation by ID
app.get('/api/recommendations/:id', requireLogin, async (req, res) => {
  try {
    const recommendation = await Recommendation.findOne({
      _id: req.params.id,
      user: req.session.userId
    });
    
    if (!recommendation) {
      return res.status(404).json({ error: '해당 추천을 찾을 수 없습니다' });
    }
    
    res.json({ recommendation });
  } catch (err) {
    console.error('Error fetching recommendation:', err);
    res.status(500).json({ error: '추천을 불러오는 중 오류가 발생했습니다' });
  }
});

// Save feedback
app.post('/api/feedback', requireLogin, async (req, res) => {
  const { feedback, recommendationId } = req.body;
  
  if (!feedback) {
    return res.status(400).json({ error: '피드백 내용을 입력해주세요' });
  }
  
  try {
    let query = { user: req.session.userId };
    
    // If recommendationId is provided, update that specific recommendation
    if (recommendationId) {
      query._id = recommendationId;
    } else {
      // Otherwise, update the most recent recommendation
      query = { ...query };
    }
    
    const result = await Recommendation.findOneAndUpdate(
      query,
      { feedback, updatedAt: new Date() },
      { sort: { createdAt: -1 }, new: true }
    );
    
    if (!result) {
      return res.status(404).json({ error: '업데이트할 추천을 찾을 수 없습니다' });
    }
    
    res.json({ ok: true, recommendation: result });
  } catch (err) {
    console.error('Feedback error:', err);
    res.status(500).json({ error: '피드백 저장 중 오류가 발생했습니다' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 서버가 http://localhost:${PORT} 에서 실행 중입니다`));