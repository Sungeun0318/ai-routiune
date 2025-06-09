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

// 모든 캘린더 이벤트 가져오기
router.get('/events', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    const events = user.calendarEvents || [];
    console.log(`✅ ${events.length}개의 캘린더 이벤트 반환`);
    
    res.json({ events });
  } catch (error) {
    console.error('❌ Get calendar events error:', error);
    res.status(500).json({ error: '캘린더 이벤트를 불러오는 중 오류가 발생했습니다' });
  }
});

// 새 이벤트 추가
router.post('/events', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    const eventData = {
      id: req.body.id || `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: req.body.title,
      start: new Date(req.body.start),
      end: new Date(req.body.end),
      backgroundColor: req.body.backgroundColor || '#4361ee',
      borderColor: req.body.borderColor || '#4361ee',
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

    console.log('✅ 새 이벤트 추가됨:', eventData.title);
    res.status(201).json({ 
      success: true, 
      event: eventData,
      message: '이벤트가 성공적으로 추가되었습니다'
    });
  } catch (error) {
    console.error('❌ Add event error:', error);
    res.status(500).json({ error: '이벤트를 추가하는 중 오류가 발생했습니다' });
  }
});

// 이벤트 수정
router.put('/events/:eventId', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    const eventIndex = user.calendarEvents.findIndex(event => event.id === req.params.eventId);
    if (eventIndex === -1) {
      return res.status(404).json({ error: '이벤트를 찾을 수 없습니다' });
    }

    // 이벤트 업데이트
    const updatedEvent = {
      ...user.calendarEvents[eventIndex],
      title: req.body.title || user.calendarEvents[eventIndex].title,
      start: req.body.start ? new Date(req.body.start) : user.calendarEvents[eventIndex].start,
      end: req.body.end ? new Date(req.body.end) : user.calendarEvents[eventIndex].end,
      backgroundColor: req.body.backgroundColor || user.calendarEvents[eventIndex].backgroundColor,
      borderColor: req.body.borderColor || user.calendarEvents[eventIndex].borderColor,
      subject: req.body.extendedProps?.subject || user.calendarEvents[eventIndex].subject,
      notes: req.body.extendedProps?.notes || user.calendarEvents[eventIndex].notes,
      completed: req.body.extendedProps?.completed !== undefined 
        ? req.body.extendedProps.completed 
        : user.calendarEvents[eventIndex].completed,
      updatedAt: new Date()
    };

    user.calendarEvents[eventIndex] = updatedEvent;
    await user.save();

    console.log('✅ 이벤트 업데이트됨:', updatedEvent.title);
    res.json({ 
      success: true, 
      event: updatedEvent,
      message: '이벤트가 성공적으로 수정되었습니다'
    });
  } catch (error) {
    console.error('❌ Update event error:', error);
    res.status(500).json({ error: '이벤트를 수정하는 중 오류가 발생했습니다' });
  }
});

// 이벤트 삭제
router.delete('/events/:eventId', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    const eventIndex = user.calendarEvents.findIndex(event => event.id === req.params.eventId);
    if (eventIndex === -1) {
      return res.status(404).json({ error: '이벤트를 찾을 수 없습니다' });
    }

    const deletedEvent = user.calendarEvents.splice(eventIndex, 1)[0];
    await user.save();

    console.log('✅ 이벤트 삭제됨:', deletedEvent.title);
    res.json({ 
      success: true,
      message: '이벤트가 성공적으로 삭제되었습니다'
    });
  } catch (error) {
    console.error('❌ Delete event error:', error);
    res.status(500).json({ error: '이벤트를 삭제하는 중 오류가 발생했습니다' });
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
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const todayEvents = (user.calendarEvents || []).filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= todayStart && eventDate < todayEnd;
    });

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
      subject: event.subject || '',
      completed: event.completed || false
    }));

    console.log(`✅ 오늘의 일정 ${schedule.length}개 반환`);
    res.json({ schedule });
  } catch (error) {
    console.error('❌ Get today schedule error:', error);
    res.status(500).json({ error: '오늘의 일정을 불러오는 중 오류가 발생했습니다' });
  }
});

// 이벤트 완료 상태 토글
router.patch('/events/:eventId/complete', requireLogin, async (req, res) => {
  try {
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
      message: `이벤트가 ${isCompleted ? '완료' : '미완료'}로 변경되었습니다`
    });
  } catch (error) {
    console.error('❌ Toggle event completion error:', error);
    res.status(500).json({ error: '완료 상태를 변경하는 중 오류가 발생했습니다' });
  }
});

module.exports = router;