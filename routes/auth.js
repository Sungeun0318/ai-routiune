const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/User');

// 로그인 상태 확인 (/api/me)
router.get('/me', async (req, res) => {
  console.log('📋 /me 요청, 세션 ID:', req.session.userId);
  
  if (!req.session.userId) {
    return res.status(401).json({ ok: false, message: '로그인이 필요합니다' });
  }
  
  try {
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

// 세션 확인 (추가 엔드포인트)
router.get('/check-session', async (req, res) => {
  console.log('🔍 세션 확인 요청:', req.session.userId);
  
  if (!req.session.userId) {
    return res.json({ authenticated: false });
  }
  
  try {
    const user = await User.findById(req.session.userId).select('-passwordHash -password');
    if (!user) {
      return res.json({ authenticated: false });
    }
    
    return res.json({ 
      authenticated: true, 
      user: { 
        username: user.username,
        nickname: user.nickname || user.username
      } 
    });
  } catch (err) {
    console.error('❌ 세션 확인 오류:', err);
    return res.json({ authenticated: false });
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

  if (password.length < 4) {
    return res.status(400).json({ 
      ok: false, 
      message: '비밀번호는 최소 4자리 이상이어야 합니다' 
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
    
    // 새 사용자 생성
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
        nickname: user.nickname || user.username
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
      console.log('❌ 사용자 없음:', username);
      return res.status(401).json({ 
        ok: false, 
        message: '아이디 또는 비밀번호가 일치하지 않습니다' 
      });
    }
    
    // 비밀번호 확인
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      console.log('❌ 비밀번호 불일치:', username);
      return res.status(401).json({ 
        ok: false, 
        message: '아이디 또는 비밀번호가 일치하지 않습니다' 
      });
    }
    
    // 세션에 사용자 ID 저장
    req.session.userId = user._id;
    
    // 마지막 로그인 시간 업데이트
    user.lastLogin = new Date();
    await user.save();
    
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
  console.log('🚪 로그아웃 요청:', req.session.userId);
  
  req.session.destroy((err) => {
    if (err) {
      console.error('❌ 세션 삭제 오류:', err);
      return res.status(500).json({ 
        ok: false, 
        message: '로그아웃 중 오류가 발생했습니다' 
      });
    }
    
    console.log('✅ 로그아웃 성공');
    res.json({ 
      ok: true, 
      message: '로그아웃되었습니다' 
    });
  });
});

// 토큰 유효성 검사 (호환성을 위해 추가)
router.get('/validate-token', async (req, res) => {
  if (!req.session.userId) {
    return res.json({ valid: false });
  }
  
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.json({ valid: false });
    }
    
    return res.json({ valid: true });
  } catch (err) {
    console.error('❌ 토큰 검증 오류:', err);
    return res.json({ valid: false });
  }
});

module.exports = router;