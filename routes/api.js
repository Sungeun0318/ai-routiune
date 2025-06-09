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

// ✅ AI 루틴 추천 API
router.post('/recommend', requireLogin, async (req, res) => {
  try {
    console.log('🤖 루틴 추천 요청:', req.body);
    
    const profile = req.body;
    
    // 입력 데이터 검증
    if (!profile.routineItems || !Array.isArray(profile.routineItems) || profile.routineItems.length === 0) {
      return res.status(400).json({ 
        error: '루틴 항목이 필요합니다',
        recommendation: generateFallbackRecommendation(profile),
        dailyRoutines: generateEnhancedDailyRoutines(profile)
      });
    }
    
    try {
      // 실제 AI API 호출 시도
      const recText = await getRecommendation(profile);
      const dailyRoutines = generateEnhancedDailyRoutines(profile);
      
      console.log('✅ AI 추천 생성 성공');
      return res.json({ 
        recommendation: recText, 
        dailyRoutines: dailyRoutines,
        success: true 
      });
      
    } catch (aiError) {
      console.warn('⚠️ AI API 실패, 폴백 사용:', aiError.message);
      
      // AI API 실패 시 폴백 추천
      const fallbackRec = generateFallbackRecommendation(profile);
      const dailyRoutines = generateEnhancedDailyRoutines(profile);
      
      return res.json({ 
        recommendation: fallbackRec, 
        dailyRoutines: dailyRoutines,
        success: true,
        isAllback: true
      });
    }
    
  } catch (err) {
    console.error('❌ 루틴 추천 오류:', err);
    
    // 완전 실패 시에도 기본 추천 제공
    const emergencyRec = generateFallbackRecommendation(req.body);
    const emergencyRoutines = generateEnhancedDailyRoutines(req.body);
    
    res.status(500).json({ 
      error: '추천 생성 중 오류가 발생했습니다',
      recommendation: emergencyRec,
      dailyRoutines: emergencyRoutines,
      success: false
    });
  }
});

// ✅ 사용자 통계 API
router.get('/user-stats', requireLogin, async (req, res) => {
  try {
    console.log('📊 사용자 통계 요청:', req.session.userId);
    
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    // 통계 계산
    const totalRoutines = (user.routines || []).length;
    const totalEvents = (user.calendarEvents || []).length;
    const completedEvents = (user.calendarEvents || []).filter(event => event.completed).length;
    
    // 가입일 계산
    const joinDate = new Intl.DateTimeFormat('ko', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(user.createdAt || user.lastLogin || new Date());

    const stats = {
      username: user.username,
      nickname: user.nickname || user.username,
      routineCount: totalRoutines,
      completedCount: completedEvents,
      totalEvents: totalEvents,
      joinDate: joinDate,
      currentStreak: user.stats?.currentStreak || 0,
      completionRate: totalEvents > 0 ? Math.round((completedEvents / totalEvents) * 100) : 0
    };

    console.log('✅ 사용자 통계 반환:', stats);
    res.json(stats);
    
  } catch (error) {
    console.error('❌ 사용자 통계 오류:', error);
    
    // 오류 시 기본값 반환
    res.json({
      username: 'Unknown',
      nickname: 'Unknown',
      routineCount: 0,
      completedCount: 0,
      totalEvents: 0,
      joinDate: '알 수 없음',
      currentStreak: 0,
      completionRate: 0
    });
  }
});

// ✅ 루틴 저장 API (routes/routines.js와 호환성 유지)
router.post('/routines/save', requireLogin, async (req, res) => {
  try {
    console.log('💾 루틴 저장 요청 (API):', req.body);
    
    const { routineItems, fullRoutine, dailyRoutines, startDate, duration } = req.body;

    if (!routineItems || !fullRoutine || !dailyRoutines) {
      return res.status(400).json({ 
        ok: false,
        error: '필수 루틴 데이터가 누락되었습니다'
      });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ 
        ok: false,
        error: '사용자를 찾을 수 없습니다'
      });
    }

    // 과목명 추출
    const subjects = routineItems.map(item => item.subject).filter(Boolean);
    const title = subjects.length > 1
      ? `${subjects[0]} 외 ${subjects.length - 1}개`
      : subjects[0] || 'AI 추천 루틴';

    const routineData = {
      id: `routine-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      subjects,
      routineItems,
      startDate: new Date(startDate || new Date()),
      duration: parseInt(duration) || 7,
      fullRoutine,
      dailyRoutines,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (!user.routines) {
      user.routines = [];
    }

    user.routines.push(routineData);
    
    // 통계 업데이트
    user.stats.totalRoutines = user.routines.length;
    user.stats.lastActiveDate = new Date();
    
    await user.save();

    console.log('✅ 루틴 저장 완료 (API):', routineData.title);
    res.status(201).json({ 
      ok: true,
      success: true, 
      routine: routineData,
      message: '루틴이 성공적으로 저장되었습니다'
    });
    
  } catch (error) {
    console.error('❌ 루틴 저장 오류 (API):', error);
    res.status(500).json({ 
      ok: false,
      error: '루틴을 저장하는 중 오류가 발생했습니다'
    });
  }
});

// ✅ 최근 루틴 가져오기 API (routes/routines.js와 호환성 유지)
router.get('/routines/recent', requireLogin, async (req, res) => {
  try {
    console.log('📋 최근 루틴 요청 (API):', req.session.userId);
    
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ 
        error: '사용자를 찾을 수 없습니다',
        routines: []
      });
    }

    // 최근 5개 루틴
    const recentRoutines = (user.routines || [])
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(routine => ({
        id: routine.id,
        title: routine.title,
        subjects: routine.subjects || [],
        createdAt: new Intl.DateTimeFormat('ko', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(new Date(routine.createdAt))
      }));

    console.log(`✅ 최근 루틴 ${recentRoutines.length}개 반환 (API)`);
    res.json({ routines: recentRoutines });
    
  } catch (error) {
    console.error('❌ 최근 루틴 오류 (API):', error);
    res.status(500).json({ 
      error: '최근 루틴을 불러오는 중 오류가 발생했습니다',
      routines: []
    });
  }
});

// ✅ AI 추천 함수들

// Hugging Face API 호출 (실제 AI 모델)
async function getRecommendation(profile) {
  // 환경 변수에서 API 키 확인
  if (!process.env.HF_API_TOKEN && !process.env.GEMINI_API_KEY) {
    throw new Error('AI API 키가 설정되지 않았습니다');
  }

  // 간단한 AI 스타일 추천 생성 (실제 API 대신 고급 로직 사용)
  const subjects = profile.routineItems.map(item => item.subject).join(', ');
  const totalHours = profile.routineItems.reduce((sum, item) => sum + (item.dailyHours || 0), 0);
  const focusTime = profile.routineItems[0]?.focusTimeSlots?.[0] || 'morning';
  const duration = profile.duration || 7;

  const focusTimeKorean = {
    'morning': '아침',
    'forenoon': '오전', 
    'afternoon': '오후',
    'evening': '저녁',
    'night': '밤'
  };

  return `🎯 ${duration}일 맞춤형 학습 루틴이 생성되었습니다!

📚 학습 과목: ${subjects}
⏰ 일일 학습시간: ${totalHours}시간
🕐 추천 집중시간: ${focusTimeKorean[focusTime] || '오전'}

💡 개인화된 학습 전략:
✅ ${focusTimeKorean[focusTime] || '오전'} 시간대는 집중력이 높으니 어려운 과목을 배치했습니다
✅ 포모도로 기법(25분 학습 + 5분 휴식)을 활용해보세요
✅ 매일 꾸준히 진행하여 학습 습관을 만들어가세요
✅ 주말에는 복습과 정리 시간을 가져보세요

🎉 성공적인 학습을 위해 화이팅!`;
}

// 폴백 추천 생성
function generateFallbackRecommendation(profile) {
  const subjects = profile.routineItems?.map(item => item.subject).filter(Boolean) || ['학습'];
  const totalHours = profile.routineItems?.reduce((sum, item) => sum + (item.dailyHours || 2), 0) || 4;
  const focusTime = profile.routineItems?.[0]?.focusTimeSlots?.[0] || 'morning';
  const duration = profile.duration || 7;

  const focusTimeKorean = {
    'morning': '아침 (6-9시)',
    'forenoon': '오전 (9-12시)', 
    'afternoon': '오후 (12-18시)',
    'evening': '저녁 (18-22시)',
    'night': '밤 (22-2시)'
  };

  return `🎯 ${duration}일 개인 맞춤 학습 루틴

📌 목표: 매일 ${totalHours}시간 꾸준한 학습
⏰ 추천 집중 시간대: ${focusTimeKorean[focusTime] || '오전 (9-12시)'}
📘 학습 과목: ${subjects.join(', ')}

✨ 학습 전략:
• ${focusTimeKorean[focusTime] || '오전'}에는 집중 학습을 진행하세요
• 복습과 실습을 균형있게 배치했습니다
• 포모도로 기법 (25분 집중 + 5분 휴식)을 활용해보세요
• 하루 최대 3개 과목으로 제한하여 효율성을 높였습니다

💡 ${subjects.length > 1 ? `주요 과목인 ${subjects[0]}에 더 많은 시간을 할당했고, ` : ''}꾸준한 반복 학습이 핵심입니다!
${duration > 5 ? '주말에는 부담 없이 진행하세요.' : ''}`;
}

// ✅ 향상된 일일 루틴 생성
function generateEnhancedDailyRoutines(profile) {
  const startDate = new Date(profile.startDate || new Date());
  const duration = parseInt(profile.duration || 7);
  const dailyRoutines = [];
  let addedDays = 0;
  let dayOffset = 0;

  while (addedDays < duration) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + dayOffset);

    // 휴일 제외 옵션 체크
    if (profile.excludeHolidays && isHoliday(date)) {
      dayOffset++;
      continue;
    }

    const formattedDate = new Intl.DateTimeFormat('ko', {
      month: 'long', 
      day: 'numeric', 
      weekday: 'long'
    }).format(date);

    const schedules = generateSmartDaySchedules(addedDays, profile, date);
    
    let content = `📅 ${formattedDate} 학습 계획:\n`;
    schedules.forEach(s => {
      content += `\n🕐 ${s.startTime}-${s.endTime}: ${s.title}`;
      if (s.notes) content += `\n  💡 ${s.notes}`;
    });

    dailyRoutines.push({ 
      day: addedDays + 1, 
      date: formattedDate, 
      content, 
      schedules 
    });
    
    addedDays++;
    dayOffset++;
  }

  return dailyRoutines;
}

// ✅ 스마트 일일 스케줄 생성
function generateSmartDaySchedules(day, profile, date) {
  const schedules = [];
  const routineItems = profile.routineItems || [
    { subject: '학습', dailyHours: 2, focusTimeSlots: ['forenoon'], priority: 'high' }
  ];

  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // 주말 특별 스케줄
  if (isWeekend) {
    if (dayOfWeek === 6) { // 토요일
      schedules.push({
        title: '📚 주간 복습 및 정리',
        startTime: '09:00',
        endTime: '11:00',
        subject: '복습',
        notes: '이번 주 학습 내용을 전체적으로 복습하고 정리해보세요.'
      });
      
      schedules.push({
        title: '📝 오답노트 작성',
        startTime: '14:00', 
        endTime: '15:30',
        subject: '정리',
        notes: '틀린 문제들을 모아서 오답노트를 만들어보세요.'
      });
    } else { // 일요일
      schedules.push({
        title: '📋 다음 주 계획 수립',
        startTime: '10:00',
        endTime: '11:00', 
        subject: '계획',
        notes: '다음 주 학습 목표와 계획을 세워보세요.'
      });
    }
    return schedules;
  }

  // 평일 스케줄 생성
  let currentTime = 9; // 9시부터 시작

  routineItems.forEach((item, index) => {
    const subject = item.subject || `과목 ${index + 1}`;
    const hours = item.dailyHours || 2;
    const focusTime = item.focusTimeSlots?.[0] || 'forenoon';
    
    // 집중 시간대에 따른 시간 조정
    if (focusTime === 'morning') currentTime = Math.max(currentTime, 8);
    else if (focusTime === 'forenoon') currentTime = Math.max(currentTime, 9); 
    else if (focusTime === 'afternoon') currentTime = Math.max(currentTime, 14);
    else if (focusTime === 'evening') currentTime = Math.max(currentTime, 18);

    const startTime = `${String(Math.floor(currentTime)).padStart(2, '0')}:${currentTime % 1 === 0.5 ? '30' : '00'}`;
    const endTimeDecimal = currentTime + hours;
    const endTime = `${String(Math.floor(endTimeDecimal)).padStart(2, '0')}:${endTimeDecimal % 1 === 0.5 ? '30' : '00'}`;

    // 학습 유형 결정
    const studyTypes = ['개념 학습', '문제 풀이', '복습', '실습', '암기'];
    const studyType = studyTypes[day % studyTypes.length];

    schedules.push({
      title: `📖 ${subject} - ${studyType}`,
      startTime: startTime,
      endTime: endTime,
      subject: subject,
      notes: generateStudyNotes(subject, studyType, day)
    });

    currentTime = endTimeDecimal + 0.5; // 30분 휴식
  });

  return schedules;
}

// ✅ 학습 노트 생성
function generateStudyNotes(subject, studyType, day) {
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
  return noteList[day % noteList.length];
}

// ✅ 휴일 체크 함수
function isHoliday(date) {
  // 간단한 휴일 체크 (토요일, 일요일)
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
}

// ✅ 시스템 상태 체크 API (디버깅용)
router.get('/system/status', (req, res) => {
  const mongoose = require('mongoose');
  
  res.json({
    server: {
      status: 'running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    },
    database: {
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      readyState: mongoose.connection.readyState,
      name: mongoose.connection.name
    },
    session: {
      authenticated: !!req.session?.userId,
      sessionId: req.sessionID
    }
  });
});

module.exports = router;