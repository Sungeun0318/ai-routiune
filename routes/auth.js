const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// ✅ 회원가입
router.post('/register', async (req, res) => {
  try {
    console.log('📝 회원가입 시도:', req.body.username);
    
    const { username, password, nickname, email } = req.body;
    
    // 입력값 검증
    if (!username || !password) {
      return res.status(400).json({ 
        ok: false, 
        message: '아이디와 비밀번호를 입력해주세요' 
      });
    }
    
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ 
        ok: false, 
        message: '아이디는 3-20자 사이여야 합니다' 
      });
    }
    
    if (password.length < 4) {
      return res.status(400).json({ 
        ok: false, 
        message: '비밀번호는 최소 4자리 이상이어야 합니다' 
      });
    }
    
    // 기존 사용자 확인
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log('❌ 중복 사용자:', username);
      return res.status(409).json({ 
        ok: false, 
        message: '이미 존재하는 아이디입니다' 
      });
    }
    
    // 비밀번호 해시화
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // 새 사용자 생성
    const newUser = new User({
      username,
      passwordHash: hashedPassword,
      nickname: nickname || username,
      email: email || '',
      routines: [],
      calendarEvents: [],
      preferences: {
        theme: 'light',
        notifications: true,
        defaultStudyHours: 2,
        preferredFocusTime: 'morning'
      },
      stats: {
        totalRoutines: 0,
        completedEvents: 0,
        currentStreak: 0,
        lastActiveDate: new Date()
      },
      lastLogin: new Date()
    });
    
    await newUser.save();
    
    console.log('✅ 회원가입 성공:', newUser.username);
    
    res.status(201).json({ 
      ok: true, 
      message: '회원가입이 완료되었습니다',
      user: {
        username: newUser.username,
        nickname: newUser.nickname
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

// ✅ 로그인
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 로그인 시도:', req.body.username);
    
    const { username, password } = req.body;
    
    // 입력값 검증
    if (!username || !password) {
      return res.status(400).json({ 
        ok: false, 
        message: '아이디와 비밀번호를 입력해주세요' 
      });
    }
    
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
    user.stats.lastActiveDate = new Date();
    await user.save();
    
    console.log('✅ 로그인 성공:', user.username);
    
    res.json({ 
      ok: true, 
      user: { 
        username: user.username,
        nickname: user.nickname || user.username,
        email: user.email || ''
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

// ✅ 로그아웃
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

// ✅ 인증 상태 확인 (프론트엔드에서 checkAuthStatus 함수가 호출)
router.get('/check', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.json({ 
        authenticated: false,
        message: '로그인이 필요합니다'
      });
    }
    
    const user = await User.findById(req.session.userId).select('-passwordHash');
    if (!user) {
      req.session.destroy();
      return res.json({ 
        authenticated: false,
        message: '사용자를 찾을 수 없습니다'
      });
    }
    
    // 마지막 활동 시간 업데이트
    user.stats.lastActiveDate = new Date();
    await user.save();
    
    console.log('✅ 인증 확인 성공:', user.username);
    
    res.json({
      authenticated: true,
      user: {
        username: user.username,
        nickname: user.nickname || user.username,
        email: user.email || ''
      }
    });
    
  } catch (err) {
    console.error('❌ 인증 확인 오류:', err);
    res.status(500).json({ 
      authenticated: false,
      message: '인증 확인 중 오류가 발생했습니다'
    });
  }
});

// ✅ 토큰 유효성 검사 (호환성을 위해 추가)
router.get('/validate-token', async (req, res) => {
  if (!req.session.userId) {
    return res.json({ valid: false });
  }
  
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.json({ valid: false });
    }
    
    return res.json({ 
      valid: true,
      user: {
        username: user.username,
        nickname: user.nickname || user.username
      }
    });
  } catch (err) {
    console.error('❌ 토큰 검증 오류:', err);
    return res.json({ valid: false });
  }
});

// ✅ 현재 사용자 정보 가져오기 (프로필 페이지용)
router.get('/me', async (req, res) => {
  if (!req.session.userId) return res.json({ ok: false });
  const user = await User.findById(req.session.userId).select('-passwordHash');
  if (!user) return res.json({ ok: false });
  res.json({
    ok: true,
    user: {
      username: user.username,
      nickname: user.nickname,
      displayName: user.nickname || user.username,
      email: user.email || ''
    }
  });
});

// 계정 삭제
router.delete('/delete-account', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: '로그인이 필요합니다' });
    }

    const userId = req.session.userId;
    
    // 사용자 삭제
    await User.findByIdAndDelete(userId);
    
    // 세션 삭제
    req.session.destroy((err) => {
      if (err) {
        console.error('세션 삭제 오류:', err);
      }
    });

    console.log(`✅ 계정 삭제 완료: ${userId}`);
    res.json({ 
      success: true, 
      message: '계정이 성공적으로 삭제되었습니다' 
    });

  } catch (error) {
    console.error('❌ 계정 삭제 오류:', error);
    res.status(500).json({ 
      error: '계정 삭제 중 오류가 발생했습니다' 
    });
  }
});


module.exports = router;