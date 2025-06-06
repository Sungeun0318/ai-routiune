const express = require('express');
const router = express.Router();
const User = require('../models/User');

const requireLogin = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: '로그인이 필요합니다' });
  }
  next();
};

// 모든 캘린더 이벤트 가져오기
router.get('/events', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    const events = user.calendarEvents || [];
    res.json({ events });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: '일정을 불러오는 중 오류가 발생했습니다' });
  }
});

// 새 이벤트 저장
router.post('/events', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    const eventData = {
      id: req.body.id || `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: req.body.title,
      start: req.body.start,
      end: req.body.end,
      backgroundColor: req.body.backgroundColor,
      borderColor: req.body.borderColor,
      subject: req.body.extendedProps?.subject || '',
      notes: req.body.extendedProps?.notes || '',
      completed: req.body.extendedProps?.completed || false,
      createdAt: new Date()
    };

    if (!user.calendarEvents) {
      user.calendarEvents = [];
    }

    user.calendarEvents.push(eventData);
    await user.save();

    res.json({ success: true, event: eventData });
  } catch (error) {
    console.error('Save event error:', error);
    res.status(500).json({ error: '일정을 저장하는 중 오류가 발생했습니다' });
  }
});

// 이벤트 업데이트
router.put('/events/:eventId', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    const eventId = req.params.eventId;
    const eventIndex = user.calendarEvents.findIndex(event => event.id === eventId);

    if (eventIndex === -1) {
      return res.status(404).json({ error: '일정을 찾을 수 없습니다' });
    }

    // 이벤트 업데이트
    user.calendarEvents[eventIndex] = {
      ...user.calendarEvents[eventIndex],
      title: req.body.title,
      start: req.body.start,
      end: req.body.end,
      subject: req.body.extendedProps?.subject || user.calendarEvents[eventIndex].subject,
      notes: req.body.extendedProps?.notes || user.calendarEvents[eventIndex].notes,
      completed: req.body.extendedProps?.completed !== undefined 
        ? req.body.extendedProps.completed 
        : user.calendarEvents[eventIndex].completed,
      updatedAt: new Date()
    };

    await user.save();

    res.json({ success: true, event: user.calendarEvents[eventIndex] });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: '일정을 수정하는 중 오류가 발생했습니다' });
  }
});

// 이벤트 삭제
router.delete('/events/:eventId', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    const eventId = req.params.eventId;
    const eventIndex = user.calendarEvents.findIndex(event => event.id === eventId);

    if (eventIndex === -1) {
      return res.status(404).json({ error: '일정을 찾을 수 없습니다' });
    }

    user.calendarEvents.splice(eventIndex, 1);
    await user.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: '일정을 삭제하는 중 오류가 발생했습니다' });
  }
});

// 오늘의 일정 가져오기
router.get('/today', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const todayEvents = (user.calendarEvents || []).filter(event => {
      const eventStart = new Date(event.start);
      return eventStart >= todayStart && eventStart < todayEnd;
    });

    // 시간 순으로 정렬
    todayEvents.sort((a, b) => new Date(a.start) - new Date(b.start));

    // UI에 맞는 형식으로 변환
    const schedule = todayEvents.map(event => {
      const start = new Date(event.start);
      const timeFormatter = new Intl.DateTimeFormat('ko', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      return {
        id: event.id,
        time: timeFormatter.format(start),
        title: event.title,
        completed: event.completed || false,
        subject: event.subject || '',
        notes: event.notes || ''
      };
    });

    res.json({ schedule });
  } catch (error) {
    console.error('Get today schedule error:', error);
    res.status(500).json({ error: '오늘 일정을 불러오는 중 오류가 발생했습니다' });
  }
});

// 일정 완료 상태 토글
router.patch('/events/:eventId/complete', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    const eventId = req.params.eventId;
    const eventIndex = user.calendarEvents.findIndex(event => event.id === eventId);

    if (eventIndex === -1) {
      return res.status(404).json({ error: '일정을 찾을 수 없습니다' });
    }

    // 완료 상태 토글
    user.calendarEvents[eventIndex].completed = !user.calendarEvents[eventIndex].completed;
    user.calendarEvents[eventIndex].updatedAt = new Date();

    await user.save();

    res.json({ 
      success: true, 
      completed: user.calendarEvents[eventIndex].completed 
    });
  } catch (error) {
    console.error('Toggle complete error:', error);
    res.status(500).json({ error: '완료 상태를 변경하는 중 오류가 발생했습니다' });
  }
});

module.exports = router;