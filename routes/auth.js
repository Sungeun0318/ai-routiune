const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/User');

// 로그인 상태 확인
router.get('/me', async (req, res) => {
  console.log('📋 /me 요청, 세션:', req.session.userId);
  
  if (!req.session.userId) {
    return res.status(401).json({ ok: false, message: '로그인이 필요합니다' });
  }
  
  try {
    // ✅ passwordHash 필드 제외하고 조회
    const user = await User.findById(req.session.userId).select('-passwordHash -password');
    if (!user) {
      return res.status(401).json({ ok: false, message: '사용자를 찾을 수 없습니다' });
    }
    
    console.log('✅ 사용자 인증 성공:', user.username);
    return res.json({ 
      ok: true, 
      user: { 
        username: user.username,
        nickname: user.nickname || user.username
      } 
    });
  } catch (err) {
    console.error('❌ 인증 확인 오류:', err);
    return res.status(500).json({ ok: false, error: '서버 오류가 발생했습니다' });
  }
});

// 회원가입
router.post('/register', async (req, res) => {
  console.log('📝 회원가입 요청:', req.body);
  
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ 
      ok: false, 
      message: '사용자명과 비밀번호를 입력해주세요' 
    });
  }

  try {
    // 기존 사용자 확인
    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(409).json({ 
        ok: false, 
        message: '이미 존재하는 사용자입니다' 
      });
    }

    // 비밀번호 해시화
    const passwordHash = await bcrypt.hash(password, 10);
    
    // ✅ 새 사용자 생성 (기존 스키마 호환)
    const user = await User.create({ 
      username, 
      passwordHash,
      nickname: username,
      email: '',
      lastLogin: new Date(),
      routines: [],
      calendarEvents: [],
      preferences: {
        theme: 'light',
        language: 'ko',
        notifications: true
      },
      stats: {
        totalRoutines: 0,
        completedEvents: 0,
        totalStudyHours: 0,
        streak: 0,
        lastActivity: new Date()
      }
    });
    
    // 세션에 사용자 ID 저장
    req.session.userId = user._id;
    
    console.log('✅ 회원가입 성공:', user.username);
    
    res.json({ 
      ok: true, 
      user: { 
        username: user.username,
        nickname: user.nickname
      }
    });
    
  } catch (err) {
    console.error('❌ 회원가입 오류:', err);
    res.status(500).json({ 
      ok: false, 
      message: '회원가입 중 오류가 발생했습니다' 
    });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  console.log('🔐 로그인 요청:', req.body);
  
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ 
      ok: false, 
      message: '사용자명과 비밀번호를 입력해주세요' 
    });
  }
  
  try {
    // 사용자 찾기
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ 
        ok: false, 
        message: '아이디 또는 비밀번호가 일치하지 않습니다' 
      });
    }
    
    // ✅ 비밀번호 확인 (passwordHash 필드 사용)
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ 
        ok: false, 
        message: '아이디 또는 비밀번호가 일치하지 않습니다' 
      });
    }
    
    // 로그인 시간 업데이트
    user.lastLogin = new Date();
    if (user.stats) {
      user.stats.lastActivity = new Date();
    }
    await user.save();
    
    // 세션에 사용자 ID 저장
    req.session.userId = user._id;
    
    console.log('✅ 로그인 성공:', user.username);
    
    res.json({ 
      ok: true, 
      user: { 
        username: user.username,
        nickname: user.nickname || user.username
      }
    });
    
  } catch (err) {
    console.error('❌ 로그인 오류:', err);
    res.status(500).json({ 
      ok: false, 
      message: '로그인 중 오류가 발생했습니다' 
    });
  }
});

// 로그아웃
router.post('/logout', (req, res) => {
  console.log('🚪 로그아웃 요청');
  
  req.session.destroy(err => {
    if (err) {
      console.error('❌ 로그아웃 오류:', err);
      return res.status(500).json({ 
        ok: false, 
        error: '로그아웃 중 오류가 발생했습니다' 
      });
    }
    
    res.clearCookie('connect.sid');
    console.log('✅ 로그아웃 성공');
    res.json({ ok: true });
  });
});

module.exports = router;