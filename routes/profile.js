const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/User');

const requireLogin = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: '로그인이 필요합니다' });
  }
  next();
};

// 프로필 정보 가져오기
router.get('/', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId, { passwordHash: 0 });
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    // 가입일 형식
    const joinDate = new Intl.DateTimeFormat('ko', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(user.createdAt || user.joinDate);

    res.json({
      username: user.username,
      email: user.email || '',
      displayName: user.nickname || user.username,
      joinDate: joinDate,
      routineCount: user.stats?.totalRoutines || 0,
      completedCount: user.stats?.completedEvents || 0
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: '프로필 정보를 불러오는 중 오류가 발생했습니다' });
  }
});

// 프로필 정보 업데이트
router.put('/', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    const { displayName, email, currentPassword, newPassword } = req.body;

    // 닉네임/이메일 변경
    if (displayName !== undefined) {
      user.nickname = displayName.trim();
    }
    if (email !== undefined) {
      user.email = email.trim();
    }

    // 비밀번호 변경
    if (newPassword && currentPassword) {
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ error: '현재 비밀번호가 일치하지 않습니다' });
      }
      user.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    await user.save();

    res.json({
      success: true,
      message: '프로필이 성공적으로 업데이트되었습니다',
      user: {
        username: user.username,
        email: user.email || '',
        displayName: user.nickname || user.username
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: '프로필 업데이트 중 오류가 발생했습니다' });
  }
});

// 계정 삭제
router.delete('/', requireLogin, async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(400).json({ error: '비밀번호가 일치하지 않습니다' });
    }
    await User.findByIdAndDelete(req.session.userId);
    req.session.destroy();
    res.json({
      success: true,
      message: '계정이 성공적으로 삭제되었습니다'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: '계정 삭제 중 오류가 발생했습니다' });
  }
});

// 닉네임만 반환하는 라우트 (/api/profile/me)
router.get('/me', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }
    res.json({ nickname: user.nickname || user.username });
  } catch (error) {
    console.error('닉네임 조회 오류:', error);
    res.status(500).json({ error: '닉네임 조회 중 오류가 발생했습니다' });
  }
});

module.exports = router;
