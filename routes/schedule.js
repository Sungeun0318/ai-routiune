const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 로그인 확인 미들웨어
const requireLogin = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: '로그인이 필요합니다' });
  }
  next();
};

// ✅ [GET] /api/schedule/today - 오늘 일정 가져오기
router.get('/today', requireLogin, async (req, res) => {
  try {
    console.log('📅 오늘 일정 요청:', req.session.userId);
    
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ 
        error: '사용자를 찾을 수 없습니다',
        schedule: []
      });
    }

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    console.log('📅 오늘 날짜 범위:', todayStart, '~', todayEnd);

    // 오늘의 캘린더 이벤트 가져오기
    const todayEvents = (user.calendarEvents || []).filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= todayStart && eventDate < todayEnd;
    });

    console.log(`📅 오늘 이벤트 ${todayEvents.length}개 발견`);

    // 시간 순으로 정렬
    todayEvents.sort((a, b) => new Date(a.start) - new Date(b.start));

    const schedule = todayEvents.map(event => ({
      id: event.id,
      title: event.title,
      time: new Intl.DateTimeFormat('ko', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(new Date(event.start)),
      endTime: new Intl.DateTimeFormat('ko', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(new Date(event.end)),
      subject: event.subject || '',
      completed: event.completed || false,
      notes: event.notes || '',
      backgroundColor: event.backgroundColor || '#4361ee'
    }));

    console.log(`✅ 오늘의 일정 ${schedule.length}개 반환`);
    res.json({ schedule });
  } catch (error) {
    console.error('❌ Get today schedule error:', error);
    res.status(500).json({ 
      error: '오늘의 일정을 불러오는 중 오류가 발생했습니다',
      schedule: [] // 오류 시 빈 배열 반환
    });
  }
});

// ✅ [POST] /api/schedule/complete/:eventId - 일정 완료 상태 토글
router.post('/complete/:eventId', requireLogin, async (req, res) => {
  try {
    console.log('✅ 일정 완료 토글 요청:', req.params.eventId);
    
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    const eventIndex = user.calendarEvents.findIndex(event => event.id === req.params.eventId);
    if (eventIndex === -1) {
      return res.status(404).json({ error: '일정을 찾을 수 없습니다' });
    }

    // 완료 상태 토글
    const wasCompleted = user.calendarEvents[eventIndex].completed;
    user.calendarEvents[eventIndex].completed = !wasCompleted;
    user.calendarEvents[eventIndex].updatedAt = new Date();
    
    // 통계 업데이트
    if (!wasCompleted) {
      user.stats.completedEvents = (user.stats.completedEvents || 0) + 1;
    } else {
      user.stats.completedEvents = Math.max(0, (user.stats.completedEvents || 0) - 1);
    }
    
    await user.save();

    const isCompleted = user.calendarEvents[eventIndex].completed;
    console.log(`✅ 일정 완료 상태 변경: ${isCompleted ? '완료' : '미완료'}`);
    
    res.json({ 
      success: true,
      completed: isCompleted,
    });
  } catch (error) {
    console.error('❌ Toggle schedule completion error:', error);
    res.status(500).json({ error: '완료 상태를 변경하는 중 오류가 발생했습니다' });
  }
});

// ✅ [PATCH] /api/schedule/events/:eventId/complete - 다른 형태의 완료 토글 (호환성)
router.patch('/events/:eventId/complete', requireLogin, async (req, res) => {
  try {
    console.log('✅ 일정 완료 패치 요청:', req.params.eventId);
    
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    const eventIndex = user.calendarEvents.findIndex(event => event.id === req.params.eventId);
    if (eventIndex === -1) {
      return res.status(404).json({ error: '이벤트를 찾을 수 없습니다' });
    }

    user.calendarEvents[eventIndex].completed = !user.calendarEvents[eventIndex].completed;
    user.calendarEvents[eventIndex].updatedAt = new Date();
    
    await user.save();

    const isCompleted = user.calendarEvents[eventIndex].completed;
    console.log(`✅ 이벤트 완료 상태 변경: ${isCompleted ? '완료' : '미완료'}`);
    
    res.json({ 
      success: true,
      completed: isCompleted,
    });
  } catch (error) {
    console.error('❌ Toggle event completion error:', error);
    res.status(500).json({ error: '완료 상태를 변경하는 중 오류가 발생했습니다' });
  }
});

// ✅ [GET] /api/schedule/stats - 일정 통계 가져오기
router.get('/stats', requireLogin, async (req, res) => {
  try {
    console.log('📊 일정 통계 요청:', req.session.userId);
    
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    // 오늘 일정
    const todayEvents = (user.calendarEvents || []).filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= todayStart && eventDate < todayEnd;
    });

    // 이번 주 일정 (월요일부터 일요일까지)
    const thisWeekStart = new Date(today);
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 일요일은 6, 나머지는 요일-1
    thisWeekStart.setDate(today.getDate() - daysToMonday);
    thisWeekStart.setHours(0, 0, 0, 0);
    
    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekStart.getDate() + 7);

    const thisWeekEvents = (user.calendarEvents || []).filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= thisWeekStart && eventDate < thisWeekEnd;
    });

    // 이번 달 일정
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    const thisMonthEvents = (user.calendarEvents || []).filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= thisMonthStart && eventDate <= thisMonthEnd;
    });

    const stats = {
      today: {
        total: todayEvents.length,
        completed: todayEvents.filter(e => e.completed).length,
        progress: todayEvents.length > 0 ? Math.round((todayEvents.filter(e => e.completed).length / todayEvents.length) * 100) : 0
      },
      thisWeek: {
        total: thisWeekEvents.length,
        completed: thisWeekEvents.filter(e => e.completed).length,
        progress: thisWeekEvents.length > 0 ? Math.round((thisWeekEvents.filter(e => e.completed).length / thisWeekEvents.length) * 100) : 0
      },
      thisMonth: {
        total: thisMonthEvents.length,
        completed: thisMonthEvents.filter(e => e.completed).length,
        progress: thisMonthEvents.length > 0 ? Math.round((thisMonthEvents.filter(e => e.completed).length / thisMonthEvents.length) * 100) : 0
      },
      routineCount: (user.routines || []).length,
      totalEvents: (user.calendarEvents || []).length,
      currentStreak: user.stats?.currentStreak || 0
    };

    console.log('📊 일정 통계 반환:', stats);
    res.json({ success: true, stats });
  } catch (error) {
    console.error('❌ Get schedule stats error:', error);
    res.status(500).json({ error: '통계를 불러오는 중 오류가 발생했습니다' });
  }
});

// ✅ [GET] /api/schedule/week - 이번 주 일정 가져오기
router.get('/week', requireLogin, async (req, res) => {
  try {
    console.log('📅 이번 주 일정 요청:', req.session.userId);
    
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - daysToMonday);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    weekEnd.setHours(0, 0, 0, 0);

    const weekEvents = (user.calendarEvents || []).filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= weekStart && eventDate < weekEnd;
    });

    // 요일별로 그룹화
    const weekSchedule = {};
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    
    // 일주일 초기화
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      weekSchedule[dateKey] = {
        date: dateKey,
        dayName: dayNames[date.getDay()],
        events: []
      };
    }

    // 이벤트 배치
    weekEvents.forEach(event => {
      const eventDate = new Date(event.start);
      const dateKey = eventDate.toISOString().split('T')[0];
      if (weekSchedule[dateKey]) {
        weekSchedule[dateKey].events.push({
          id: event.id,
          title: event.title,
          time: new Intl.DateTimeFormat('ko', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }).format(eventDate),
          subject: event.subject || '',
          completed: event.completed || false,
          backgroundColor: event.backgroundColor || '#4361ee'
        });
      }
    });

    // 시간순 정렬
    Object.values(weekSchedule).forEach(day => {
      day.events.sort((a, b) => a.time.localeCompare(b.time));
    });

    console.log(`✅ 이번 주 일정 반환 (${weekEvents.length}개 이벤트)`);
    res.json({ weekSchedule: Object.values(weekSchedule) });
  } catch (error) {
    console.error('❌ Get week schedule error:', error);
    res.status(500).json({ error: '이번 주 일정을 불러오는 중 오류가 발생했습니다' });
  }
});

// ✅ [PUT] /api/schedule/:eventId - 일정 수정
router.put('/:eventId', requireLogin, async (req, res) => {
  try {
    console.log('✏️ 일정 수정 요청:', req.params.eventId);
    
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    const eventIndex = user.calendarEvents.findIndex(event => event.id === req.params.eventId);
    if (eventIndex === -1) {
      return res.status(404).json({ error: '일정을 찾을 수 없습니다' });
    }

    const { title, start, end, subject, notes } = req.body;

    // 일정 업데이트
    if (title) user.calendarEvents[eventIndex].title = title;
    if (start) user.calendarEvents[eventIndex].start = new Date(start);
    if (end) user.calendarEvents[eventIndex].end = new Date(end);
    if (subject !== undefined) user.calendarEvents[eventIndex].subject = subject;
    if (notes !== undefined) user.calendarEvents[eventIndex].notes = notes;
    
    user.calendarEvents[eventIndex].updatedAt = new Date();
    
    await user.save();

    console.log('✅ 일정 수정 완료:', user.calendarEvents[eventIndex].title);
    res.json({ 
      success: true, 
      event: user.calendarEvents[eventIndex],
    });
  } catch (error) {
    console.error('❌ Update schedule error:', error);
    res.status(500).json({ error: '일정을 수정하는 중 오류가 발생했습니다' });
  }
});

module.exports = router;