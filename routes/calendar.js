// ====================================
// 루틴 관련 라우트 - 캘린더 저장 문제 해결
// ====================================

const express = require('express');
const router = express.Router();
const User = require('../models/User');


router.post('/generate', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ 
        success: false, 
        message: '로그인이 필요합니다' 
      });
    }

    const { name, startDate, duration, routineItems } = req.body;

    console.log('🎯 루틴 생성 요청:', {
      name,
      startDate,
      duration,
      itemCount: routineItems?.length
    });

    // 입력 유효성 검사
    if (!name || !startDate || !duration || !routineItems || routineItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: '필수 입력값이 누락되었습니다'
      });
    }

    // 루틴 생성
    const routine = await generateStudyRoutine({
      name,
      startDate,
      duration,
      routineItems
    });

    console.log('✅ 루틴 생성 완료');

    res.json({
      success: true,
      routine: routine
    });

  } catch (error) {
    console.error('❌ 루틴 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: '루틴 생성 중 오류가 발생했습니다'
    });
  }
});


// ✅ 루틴 캘린더 저장 API
router.post('/save', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ 
        success: false, 
        message: '로그인이 필요합니다' 
      });
    }

    const { routine } = req.body;

    if (!routine || !routine.schedule) {
      return res.status(400).json({
        success: false,
        message: '저장할 루틴 데이터가 없습니다'
      });
    }

    console.log('📅 루틴 캘린더 저장 시작:', routine.name);

    // 사용자 조회
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다'
      });
    }

    // 캘린더 이벤트 생성
    const calendarEvents = [];
    let eventIdCounter = Date.now();

    routine.schedule.forEach((day, dayIndex) => {
      if (day.events && day.events.length > 0) {
        const currentDate = new Date(routine.startDate);
        currentDate.setDate(currentDate.getDate() + dayIndex);
        
        day.events.forEach(event => {
          // 시작 시간과 종료 시간을 ISO 문자열로 변환
          const startDateTime = new Date(currentDate);
          const [startHour, startMinute] = event.startTime.split(':').map(Number);
          startDateTime.setHours(startHour, startMinute, 0, 0);

          const endDateTime = new Date(currentDate);
          const [endHour, endMinute] = event.endTime.split(':').map(Number);
          endDateTime.setHours(endHour, endMinute, 0, 0);

          calendarEvents.push({
            id: `routine-${eventIdCounter++}`,
            title: event.title || `📖 ${event.subject}`,
            start: startDateTime.toISOString(),
            end: endDateTime.toISOString(),
            subject: event.subject,
            notes: event.notes || '',
            completed: false,
            routineName: routine.name,
            createdAt: new Date()
          });
        });
      }
    });

    console.log(`📅 생성된 캘린더 이벤트 수: ${calendarEvents.length}`);

    // 사용자의 캘린더 이벤트에 추가
    if (!user.calendarEvents) {
      user.calendarEvents = [];
    }
    
    user.calendarEvents.push(...calendarEvents);

    // 루틴 정보도 저장
    if (!user.routines) {
      user.routines = [];
    }

    user.routines.push({
      name: routine.name,
      startDate: routine.startDate,
      endDate: routine.endDate,
      duration: routine.duration,
      subjects: routine.subjects || [],
      createdAt: new Date(),
      eventIds: calendarEvents.map(event => event.id)
    });

    await user.save();

    console.log('✅ 루틴 캘린더 저장 완료');

    res.json({
      success: true,
      message: '루틴이 캘린더에 저장되었습니다',
      eventCount: calendarEvents.length
    });

  } catch (error) {
    console.error('❌ 루틴 저장 오류:', error);
    res.status(500).json({
      success: false,
      message: '루틴 저장 중 오류가 발생했습니다'
    });
  }
});

// ✅ 사용자 루틴 목록 조회
router.get('/list', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ 
        success: false, 
        message: '로그인이 필요합니다' 
      });
    }

    const user = await User.findById(req.session.userId).select('routines');
    
    res.json({
      success: true,
      routines: user.routines || []
    });

  } catch (error) {
    console.error('❌ 루틴 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '루틴 목록 조회 중 오류가 발생했습니다'
    });
  }
});

// ✅ 루틴 삭제
router.delete('/:routineId', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ 
        success: false, 
        message: '로그인이 필요합니다' 
      });
    }

    const { routineId } = req.params;
    const user = await User.findById(req.session.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다'
      });
    }

    // 루틴 찾기
    const routineIndex = user.routines.findIndex(r => r._id.toString() === routineId);
    if (routineIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '루틴을 찾을 수 없습니다'
      });
    }

    const routine = user.routines[routineIndex];
    
    // 관련 캘린더 이벤트도 삭제
    if (routine.eventIds && routine.eventIds.length > 0) {
      user.calendarEvents = user.calendarEvents.filter(event => 
        !routine.eventIds.includes(event.id)
      );
    }

    // 루틴 삭제
    user.routines.splice(routineIndex, 1);
    await user.save();

    res.json({
      success: true,
      message: '루틴이 삭제되었습니다'
    });

  } catch (error) {
    console.error('❌ 루틴 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '루틴 삭제 중 오류가 발생했습니다'
    });
  }
});

// ✅ 루틴 생성 로직
async function generateStudyRoutine({ name, startDate, duration, routineItems }) {
  console.log('🎯 학습 루틴 생성 시작');

  const startDateObj = new Date(startDate);
  const endDateObj = new Date(startDateObj);
  endDateObj.setDate(endDateObj.getDate() + duration - 1);

  const routine = {
    name,
    startDate,
    endDate: endDateObj.toISOString().split('T')[0],
    duration,
    subjects: routineItems.map(item => item.subject),
    schedule: []
  };

  // 각 날짜별 스케줄 생성
  for (let dayIndex = 0; dayIndex < duration; dayIndex++) {
    const currentDate = new Date(startDateObj);
    currentDate.setDate(currentDate.getDate() + dayIndex);
    
    const dayOfWeek = getDayOfWeek(currentDate);
    const daySchedule = generateDaySchedule(routineItems, dayOfWeek, dayIndex);
    
    routine.schedule.push({
      date: currentDate.toISOString().split('T')[0],
      dayOfWeek,
      events: daySchedule
    });
  }

  console.log('✅ 학습 루틴 생성 완료');
  return routine;
}

// ✅ 요일 계산
function getDayOfWeek(date) {
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return days[date.getDay()];
}

// ✅ 하루 스케줄 생성
function generateDaySchedule(routineItems, dayOfWeek, dayIndex) {
  const daySchedule = [];
  
  // 해당 요일에 학습할 과목들 필터링
  const todaySubjects = routineItems.filter(item => 
    item.selectedDays.includes(dayOfWeek)
  );

  if (todaySubjects.length === 0) {
    return daySchedule; // 휴식일
  }

  let currentTime = 9; // 기본 시작 시간 (9시)

  todaySubjects.forEach((item, index) => {
    // 집중 시간대 확인
    let preferredStartTime = 9;
    if (item.focusTimeSlots && item.focusTimeSlots[dayOfWeek]) {
      const focusTime = item.focusTimeSlots[dayOfWeek];
      if (focusTime.startTime) {
        const [hour, minute] = focusTime.startTime.split(':').map(Number);
        preferredStartTime = hour + minute / 60;
      }
    }

    // 학습 불가 시간대 확인
    const unavailableTime = item.unavailableTimes?.find(ut => ut.day === dayOfWeek);
    
    // 시작 시간 조정
    if (index === 0) {
      currentTime = Math.max(currentTime, preferredStartTime);
    }

    // 학습 불가 시간대 피하기
    if (unavailableTime) {
      const [unavailableStart] = unavailableTime.startTime.split(':').map(Number);
      const [unavailableEnd] = unavailableTime.endTime.split(':').map(Number);
      
      if (currentTime >= unavailableStart && currentTime < unavailableEnd) {
        currentTime = unavailableEnd;
      }
    }

    const hours = item.dailyHours;
    const startTime = formatTime(currentTime);
    const endTime = formatTime(currentTime + hours);

    // 학습 유형 결정
    const studyTypes = ['개념 학습', '문제 풀이', '복습', '실습', '암기'];
    const studyType = studyTypes[dayIndex % studyTypes.length];

    daySchedule.push({
      title: `📖 ${item.subject} - ${studyType}`,
      subject: item.subject,
      startTime,
      endTime,
      notes: generateStudyNotes(item.subject, studyType, dayIndex)
    });

    currentTime += hours + 0.5; // 30분 휴식 추가
  });

  return daySchedule;
}

// ✅ 시간 포맷팅
function formatTime(timeDecimal) {
  const hours = Math.floor(timeDecimal);
  const minutes = Math.round((timeDecimal % 1) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// ✅ 학습 노트 생성
function generateStudyNotes(subject, studyType, dayIndex) {
  const notes = {
    '개념 학습': [
      '새로운 개념을 차근차근 이해해보세요.',
      '핵심 용어를 정리하며 학습하세요.',
      '예시를 통해 개념을 확실히 익혀보세요.'
    ],
    '문제 풀이': [
      '다양한 유형의 문제를 풀어보세요.',
      '틀린 문제는 다시 한번 검토해보세요.',
      '시간을 재며 속도도 함께 연습하세요.'
    ],
    '복습': [
      '이전에 학습한 내용을 다시 정리해보세요.',
      '기억나지 않는 부분을 체크해보세요.',
      '전체적인 흐름을 파악해보세요.'
    ],
    '실습': [
      '배운 내용을 실제로 적용해보세요.',
      '손으로 직접 써보며 익혀보세요.',
      '실전과 같은 환경에서 연습해보세요.'
    ],
    '암기': [
      '반복 학습으로 기억을 강화하세요.',
      '연상법을 활용해보세요.',
      '중요한 부분을 표시하며 암기하세요.'
    ]
  };

  const noteList = notes[studyType] || notes['개념 학습'];
  return noteList[dayIndex % noteList.length];
}

router.get('/events', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ success: false });
  const user = await User.findById(req.session.userId);
  res.json({ events: user.calendarEvents || [] });
});
// --- [POST] /api/calendar/events ---
router.post('/events', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ success: false });
  const user = await User.findById(req.session.userId);
  const event = req.body;
  event.id = event.id || `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  event.createdAt = new Date();
  event.updatedAt = new Date();
  user.calendarEvents.push(event);
  await user.save();
  res.json({ success: true, event });
});
// --- [PUT] /api/calendar/events/:eventId ---
router.put('/events/:eventId', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ success: false });
  const user = await User.findById(req.session.userId);
  const idx = user.calendarEvents.findIndex(ev => ev.id === req.params.eventId);
  if (idx === -1) return res.status(404).json({ success: false });
  user.calendarEvents[idx] = { ...user.calendarEvents[idx], ...req.body, updatedAt: new Date() };
  await user.save();
  res.json({ success: true, event: user.calendarEvents[idx] });
});
// --- [DELETE] /api/calendar/events/:eventId ---
router.delete('/events/:eventId', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ success: false });
  const user = await User.findById(req.session.userId);
  user.calendarEvents = user.calendarEvents.filter(ev => ev.id !== req.params.eventId);
  await user.save();
  res.json({ success: true });
});
// --- [PATCH] /api/calendar/events/:eventId/complete ---
router.patch('/events/:eventId/complete', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ success: false });
  const user = await User.findById(req.session.userId);
  const idx = user.calendarEvents.findIndex(ev => ev.id === req.params.eventId);
  if (idx === -1) return res.status(404).json({ success: false });
  user.calendarEvents[idx].completed = !user.calendarEvents[idx].completed;
  user.calendarEvents[idx].updatedAt = new Date();
  await user.save();
  res.json({ success: true, completed: user.calendarEvents[idx].completed });
});

// --- [GET] /api/calendar/today ---
router.get('/today', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ success: false });
  const user = await User.findById(req.session.userId);
  console.log('유저의 calendarEvents:', user.calendarEvents); // ★ 여기
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  const todayEvents = (user.calendarEvents || []).filter(event => {
    const eventDate = new Date(event.start);
    return eventDate >= todayStart && eventDate < todayEnd;
  });
  res.json({ schedule: todayEvents });
});

// --- [POST] /api/calendar/reset ---
// 사용자 캘린더 일정 초기화(전체 삭제)
router.post('/reset', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: '로그인이 필요합니다' });
  }

  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다' });
    }

    // 캘린더 이벤트 초기화
    user.calendarEvents = [];

    // 루틴 목록 초기화 (필요하다면)
    // user.routines = [];

    await user.save();

    res.json({ success: true, message: '캘린더 일정이 초기화되었습니다' });
  } catch (error) {
    console.error('❌ 캘린더 초기화 오류:', error);
    res.status(500).json({ success: false, message: '캘린더 초기화 중 오류가 발생했습니다' });
  }
});


module.exports = router;

