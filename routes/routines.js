const express = require('express');
const router = express.Router();
const User = require('../models/User');
const recommendationController = require('../controllers/Recommendation');

const requireLogin = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: '로그인이 필요합니다' });
  }
  next();
};

// 루틴 저장
router.post('/save', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    const { routineItems, startDate, duration, fullRoutine, dailyRoutines } = req.body;

    // 제목 생성 (과목들로)
    const subjects = routineItems.map(item => item.subject);
    const title = subjects.length > 0 ? `${subjects.join(', ')} 루틴` : '학습 루틴';

    const routineData = {
      id: `routine-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      subjects,
      routineItems,
      startDate,
      duration: parseInt(duration),
      fullRoutine,
      dailyRoutines,
      createdAt: new Date()
    };

    if (!user.routines) {
      user.routines = [];
    }

    user.routines.push(routineData);
    await user.save();

    res.json({ 
      success: true, 
      routine: routineData,
      message: '루틴이 성공적으로 저장되었습니다'
    });
  } catch (error) {
    console.error('Save routine error:', error);
    res.status(500).json({ error: '루틴을 저장하는 중 오류가 발생했습니다' });
  }
});

// 최근 루틴 가져오기
router.get('/recent', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    // 최근 5개 루틴
    const recentRoutines = (user.routines || [])
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(routine => ({
        id: routine.id,
        title: routine.title,
        subjects: routine.subjects,
        createdAt: new Intl.DateTimeFormat('ko', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(new Date(routine.createdAt))
      }));

    res.json({ routines: recentRoutines });
  } catch (error) {
    console.error('Get recent routines error:', error);
    res.status(500).json({ error: '최근 루틴을 불러오는 중 오류가 발생했습니다' });
  }
});

// 특정 루틴 가져오기
router.get('/:routineId', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    const routine = user.routines.find(r => r.id === req.params.routineId);
    if (!routine) {
      return res.status(404).json({ error: '루틴을 찾을 수 없습니다' });
    }

    res.json({ routine });
  } catch (error) {
    console.error('Get routine error:', error);
    res.status(500).json({ error: '루틴을 불러오는 중 오류가 발생했습니다' });
  }
});

// 루틴 삭제
router.delete('/:routineId', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    const routineIndex = user.routines.findIndex(r => r.id === req.params.routineId);
    if (routineIndex === -1) {
      return res.status(404).json({ error: '루틴을 찾을 수 없습니다' });
    }

    user.routines.splice(routineIndex, 1);
    await user.save();

    res.json({ 
      success: true,
      message: '루틴이 성공적으로 삭제되었습니다'
    });
  } catch (error) {
    console.error('Delete routine error:', error);
    res.status(500).json({ error: '루틴을 삭제하는 중 오류가 발생했습니다' });
  }
});

// 일일 단위 루틴 미리보기 (AI 기반 생성)
router.post('/generate', requireLogin, recommendationController.generateRoutine);

module.exports = router;