const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// 로그인 확인 미들웨어
const requireLogin = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: '로그인이 필요합니다' });
  }
  next();
};

// 프로필 정보 가져오기
router.get('/', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).select('-password -passwordHash');
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        nickname: user.nickname || user.username,
        email: user.email || '',
        preferences: user.preferences || {},
        stats: {
          totalRoutines: user.routineCount,
          completedEvents: user.completedEventCount,
          totalStudyHours: user.stats?.totalStudyHours || 0,
          streak: user.stats?.streak || 0,
          joinDate: new Intl.DateTimeFormat('ko', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }).format(user.createdAt)
        }
      }
    });
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({ error: '프로필 정보를 불러오는 중 오류가 발생했습니다' });
  }
});

// 프로필 정보 수정
router.put('/', requireLogin, async (req, res) => {
  try {
    const { nickname, email, preferences } = req.body;
    
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    // 업데이트할 필드들
    if (nickname !== undefined) user.nickname = nickname;
    if (email !== undefined) user.email = email;
    if (preferences !== undefined) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();

    console.log('✅ 프로필 수정 완료:', user.username);
    res.json({
      success: true,
      message: '프로필이 성공적으로 수정되었습니다',
      user: {
        id: user._id,
        username: user.username,
        nickname: user.nickname,
        email: user.email,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({ error: '프로필 수정 중 오류가 발생했습니다' });
  }
});

// 비밀번호 변경
router.put('/password', requireLogin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: '현재 비밀번호와 새 비밀번호를 모두 입력해주세요' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: '새 비밀번호는 6자 이상이어야 합니다' });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    // 현재 비밀번호 확인
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: '현재 비밀번호가 올바르지 않습니다' });
    }

    // 새 비밀번호 해시화
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    user.passwordHash = hashedPassword;
    await user.save();

    console.log('✅ 비밀번호 변경 완료:', user.username);
    res.json({
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다'
    });
  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({ error: '비밀번호 변경 중 오류가 발생했습니다' });
  }
});

// 사용자 통계 업데이트
router.put('/stats', requireLogin, async (req, res) => {
  try {
    const { studyHours, streak } = req.body;
    
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    if (studyHours !== undefined) {
      user.stats.totalStudyHours = (user.stats.totalStudyHours || 0) + studyHours;
    }
    
    if (streak !== undefined) {
      user.stats.streak = streak;
    }
    
    user.stats.lastActivity = new Date();
    await user.save();

    console.log('✅ 사용자 통계 업데이트 완료');
    res.json({
      success: true,
      stats: user.stats
    });
  } catch (error) {
    console.error('❌ Update stats error:', error);
    res.status(500).json({ error: '통계 업데이트 중 오류가 발생했습니다' });
  }
});

// 계정 삭제
router.delete('/', requireLogin, async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: '비밀번호를 입력해주세요' });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    // 비밀번호 확인
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: '비밀번호가 올바르지 않습니다' });
    }

    // 사용자 삭제
    await User.findByIdAndDelete(req.session.userId);
    
    // 세션 삭제
    req.session.destroy();

    console.log('✅ 계정 삭제 완료:', user.username);
    res.json({
      success: true,
      message: '계정이 성공적으로 삭제되었습니다'
    });
  } catch (error) {
    console.error('❌ Delete account error:', error);
    res.status(500).json({ error: '계정 삭제 중 오류가 발생했습니다' });
  }
});

module.exports = router;