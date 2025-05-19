const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/User');

// 로그인 상태 확인
router.get('/me', async (req, res) => {new Promise((resolve, reject) => {
  

})
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

// 회원가입
router.post('/register', async (req, res) => {
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

// 로그인
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const user = await User.findOne({ username });
    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      return res.status(401).json({ message: '아이디 또는 비밀번호가 일치하지 않습니다' });
    }
    
    // 로그인 시간 업데이트
    user.lastLogin = new Date();
    await user.save();
    
    req.session.userId = user._id;
    res.json({ ok: true, user: { username: user.username } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: '로그인 중 오류가 발생했습니다' });
  }
});

// 로그아웃
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ ok: false, error: '로그아웃 중 오류가 발생했습니다' });
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

module.exports = router;