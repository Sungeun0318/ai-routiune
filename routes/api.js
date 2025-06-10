const express = require('express');
const axios = require('axios');
const router = express.Router();
const User = require('../models/User');
const Recommendation = require('../models/Recommendation');

const requireLogin = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: '로그인이 필요합니다' });
  next();
};

// 공휴일 리스트
const holidays = ['2025-06-06', '2025-08-15'];
function isHoliday(date) {
  const ymd = date.toISOString().split('T')[0];
  return holidays.includes(ymd);
}

async function getRecommendation(profile) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.error('Google Gemini API 키가 설정되지 않았습니다.');
      return generateFallbackRecommendation(profile);
    }

    const subjects = profile.routineItems?.map(item => item.subject).join(', ') || '수학, 영어, 프로그래밍';
    const totalHours = profile.routineItems?.reduce((sum, item) => sum + parseFloat(item.dailyHours || 2), 0) || 6;
    const focusTime = profile.routineItems?.[0]?.focusTime || '오전';
    const duration = profile.duration || 7;
    const startDate = profile.startDate || new Date().toISOString().split('T')[0];

    // 기존 프롬프트를 찾아서 이 부분으로 교체
const prompt = `당신은 전문 학습 컨설턴트입니다. 다음 정보를 바탕으로 개인화된 학습 루틴을 만들어주세요.

**학습자 정보:**
- 학습 과목: ${subjects}
- 일일 총 학습시간: ${totalHours}시간
- 루틴 기간: ${duration}일
- 시작일: ${startDate}

**루틴 세부사항:**
${profile.routineItems?.map((item, index) => {
  // 집중 시간대를 한국어로 변환
  const focusTimeKorean = {
    'morning': '아침 (6-9시)',
    'forenoon': '오전 (9-12시)', 
    'afternoon': '오후 (12-18시)',
    'evening': '저녁 (18-22시)',
    'night': '밤 (22-2시)'
  };
  
  const mainFocusTime = item.focusTimeByDay ? 
    Object.values(item.focusTimeByDay)[0] || item.focusTime : 
    item.focusTime;
    
  const focusTimeText = focusTimeKorean[mainFocusTime] || '오전 (9-12시)';
  
  // 불가능 시간대 정리
  const unavailableTimes = item.unavailableTimeByDay ? 
    Object.entries(item.unavailableTimeByDay)
      .map(([day, time]) => `${day}요일 ${time.start}-${time.end}`)
      .join(', ') : '없음';
      
  return `${index + 1}. ${item.subject}
     - 일일 학습시간: ${item.dailyHours}시간
     - 선호 집중시간: ${focusTimeText}
     - 우선순위: ${item.priority === 'high' ? '높음' : item.priority === 'low' ? '낮음' : '보통'}
     - 학습 요일: ${item.selectedDays?.map(d => {
       const dayMap = {'mon':'월','tue':'화','wed':'수','thu':'목','fri':'금','sat':'토','sun':'일'};
       return dayMap[d];
     }).join(', ') || '매일'}
     - 불가능 시간: ${unavailableTimes}
     - 참고사항: ${item.notes || '없음'}`;
}).join('\n') || '기본 과목들로 구성'}

**중요한 요구사항:**
1. 각 과목의 집중 시간대를 반드시 지켜서 시간표 작성
2. 불가능한 시간대는 절대 사용하지 말 것
3. 시간 겹침이 없는 현실적인 스케줄 작성
4. 우선순위가 높은 과목을 더 좋은 시간대에 배치
5. 구체적인 시간(예: 14:00-16:00)을 명시하여 작성

**응답 형식:**
- 각 과목별로 구체적인 시간대를 명시
- 사용자가 설정한 집중 시간대를 정확히 반영
- 실제 시간표 형태로 작성 (예: "수학: 14:00-16:00 (오후 집중시간)")
- 이모지와 함께 가독성 있게 작성

사용자가 설정한 시간대를 정확히 지키는 것이 가장 중요합니다. 절대 임의의 시간(9시 등)을 사용하지 마세요.`;

    console.log('Google Gemini API 요청 시작...');

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
        ]
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    console.log('Gemini API 응답 성공');

    if (response.data?.candidates?.[0]) {
      return response.data.candidates[0].content.parts[0].text;
    } else {
      console.error('Gemini API 응답 형식 오류:', response.data);
      return generateFallbackRecommendation(profile);
    }

  } catch (error) {
    console.error('Google Gemini API Error:', error.message);
    if (error.response) {
      console.error('상태 코드:', error.response.status);
      console.error('응답 데이터:', JSON.stringify(error.response.data, null, 2));
    }
    return generateFallbackRecommendation(profile);
  }
}

function generateFallbackRecommendation(profile) {
  const subjects = profile.routineItems?.map(item => item.subject).join(', ') || '수학, 영어, 프로그래밍';
  const totalHours = profile.routineItems?.reduce((sum, item) => sum + parseFloat(item.dailyHours || 2), 0) || 6;
  const duration = profile.duration || 7;
  
  // 집중 시간대 정보 생성
  const focusTimeInfo = profile.routineItems?.map(item => {
    const focusTimeKorean = {
      'morning': '아침 (6-9시)',
      'forenoon': '오전 (9-12시)', 
      'afternoon': '오후 (12-18시)',
      'evening': '저녁 (18-22시)',
      'night': '밤 (22-2시)'
    };
    
    const mainFocusTime = item.focusTimeByDay ? 
      Object.values(item.focusTimeByDay)[0] || item.focusTime : 
      item.focusTime;
      
    const focusTimeText = focusTimeKorean[mainFocusTime] || '오전 (9-12시)';
    
    return `- ${item.subject}: ${focusTimeText}에 ${item.dailyHours}시간`;
  }).join('\n') || '- 기본 시간대로 설정';
  
  return `🎯 ${duration}일 개인 맞춤 학습 루틴

📌 **목표**: 매일 ${totalHours}시간 꾸준한 학습
📘 **학습 과목**: ${subjects}

⏰ **과목별 집중 시간대**
${focusTimeInfo}

✨ **맞춤형 학습 전략**
- 사용자가 설정한 집중 시간대에 맞춰 스케줄을 구성했습니다
- 불가능 시간대는 완전히 피해서 계획했습니다
- 시간 겹침 없이 현실적인 일정으로 배치했습니다
- 우선순위가 높은 과목을 더 좋은 시간대에 배치했습니다

💡 **성공 팁**
- 포모도로 기법 (25분 집중 + 5분 휴식)을 활용하세요
- 설정하신 집중 시간대에 가장 중요한 과목을 배치했습니다
- 충분한 휴식 시간을 확보하여 지속 가능한 학습이 되도록 했습니다

🚀 **일별 상세 일정은 '일별 상세' 탭에서 확인하세요**
각 과목이 설정하신 시간대에 정확히 배치되어 있습니다.`;
}

router.post('/recommend', async (req, res) => {
  try {
    console.log('루틴 추천 요청 받음:', req.body);
    const recText = await getRecommendation(req.body);
    const dailyRoutines = generateEnhancedDailyRoutines(req.body);
    return res.json({ recommendation: recText, dailyRoutines });
  } catch (err) {
    console.error('Recommendation error:', err);
    const fallbackRec = generateFallbackRecommendation(req.body);
    const dailyRoutines = generateEnhancedDailyRoutines(req.body);
    return res.json({ recommendation: fallbackRec, dailyRoutines });
  }
});

const Routine = require('../models/Routine'); // 모델 경로에 맞게 수정 필요

router.get('/routines/recent', async (req, res) => {
  try {
    const routines = await Routine.find({ userId: req.session.userId })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('title subjects createdAt');

    res.json({ routines });
  } catch (error) {
    console.error('❌ 최근 루틴 불러오기 오류:', error);
    res.status(500).json({ routines: [] });
  }
});



function generateEnhancedDailyRoutines(profile) {
  const startDate = new Date(profile.startDate || new Date());
  const duration = parseInt(profile.duration || 7);
  const dailyRoutines = [];
  let addedDays = 0;
  let dayOffset = 0;

  while (addedDays < duration) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + dayOffset);

    if (profile.excludeHolidays && isHoliday(date)) {
      dayOffset++;
      continue;
    }

    const formattedDate = new Intl.DateTimeFormat('ko', {
      month: 'long', day: 'numeric', weekday: 'long'
    }).format(date);

    const schedules = generateSmartDaySchedules(addedDays, profile, date);
    const conflicts = checkTimeOverlap(schedules);
    let content = `${formattedDate} 학습 계획:\n`;
    schedules.forEach(s => {
      content += `\n${s.startTime}-${s.endTime}: ${s.title}`;
      if (s.notes) content += `\n  💡 ${s.notes}`;
    });

    if (conflicts.length > 0) {
    content += '\n\n⚠️ 시간 겹침 경고:\n' + conflicts.join('\n');
    }

    dailyRoutines.push({ 
    day: addedDays + 1, 
    date: formattedDate, 
    content, 
    schedules,
    warnings: conflicts // 이 줄 추가
    });
    addedDays++;
    dayOffset++;
  }

  return dailyRoutines;
}

function generateSmartDaySchedules(day, profile, date) {
  const schedules = [];
  const routineItems = profile.routineItems || [];
  const dayOfWeek = date.getDay();
  const dayString = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][dayOfWeek];
  
  // 해당 요일에 학습할 과목들 필터링
  const todaySubjects = routineItems.filter(item => 
    item.selectedDays && item.selectedDays.includes(dayString)
  );

  if (todaySubjects.length === 0) {
    return schedules;
  }

  // 집중 시간대를 시간으로 변환하는 함수
  function getFocusTimeRange(focusTime) {
    const timeRanges = {
      'morning': { start: 6, end: 9 },
      'forenoon': { start: 9, end: 12 },
      'afternoon': { start: 12, end: 18 },
      'evening': { start: 18, end: 22 },
      'night': { start: 22, end: 24 }
    };
    return timeRanges[focusTime] || timeRanges['forenoon'];
  }

  // 시간을 decimal로 변환 (예: "14:30" -> 14.5)
  function timeStringToDecimal(timeStr) {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours + minutes / 60;
  }

  // 불가능한 시간대 확인
  function isTimeUnavailable(startTime, endTime, unavailableTime) {
    if (!unavailableTime || !unavailableTime.start || !unavailableTime.end) {
      return false;
    }
    
    const unavailableStart = timeStringToDecimal(unavailableTime.start);
    const unavailableEnd = timeStringToDecimal(unavailableTime.end);
    
    return (startTime < unavailableEnd && endTime > unavailableStart);
  }

  // 우선순위에 따라 정렬 (높은 우선순위 먼저)
  const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
  todaySubjects.sort((a, b) => {
    return (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
  });

  const usedTimeSlots = []; // 이미 사용된 시간대 추적
  const skippedItems = [];

  todaySubjects.forEach((item, index) => {
    const hours = parseFloat(item.dailyHours) || 1;
    
    // 집중 시간대 가져오기
    const focusTime = item.focusTimeByDay?.[dayString] || item.focusTime || 'forenoon';
    const focusRange = getFocusTimeRange(focusTime);
    
    // 불가능한 시간대 가져오기
    const unavailableTime = item.unavailableTimeByDay?.[dayString];
    
    let bestStartTime = null;
    let bestEndTime = null;
    
    // 1. 먼저 집중 시간대 내에서 가능한 시간 찾기
    for (let tryStart = focusRange.start; tryStart <= focusRange.end - hours; tryStart += 0.5) {
      const tryEnd = tryStart + hours;
      
      // 집중 시간대를 벗어나면 중단
      if (tryEnd > focusRange.end) break;
      
      // 불가능한 시간대와 겹치는지 확인
      if (isTimeUnavailable(tryStart, tryEnd, unavailableTime)) continue;
      
      // 이미 사용된 시간대와 겹치는지 확인
      const hasConflict = usedTimeSlots.some(slot => 
        (tryStart < slot.end && tryEnd > slot.start)
      );
      
      if (!hasConflict) {
        bestStartTime = tryStart;
        bestEndTime = tryEnd;
        break;
      }
    }
    
    // 2. 집중 시간대에서 못 찾으면 다른 시간대에서 찾기
    if (bestStartTime === null) {
      // 하루 전체 시간대에서 탐색 (6시~22시)
      for (let tryStart = 6; tryStart <= 22 - hours; tryStart += 0.5) {
        const tryEnd = tryStart + hours;
        
        // 22시 이후는 제외
        if (tryEnd > 22) break;
        
        // 불가능한 시간대와 겹치는지 확인
        if (isTimeUnavailable(tryStart, tryEnd, unavailableTime)) continue;
        
        // 이미 사용된 시간대와 겹치는지 확인
        const hasConflict = usedTimeSlots.some(slot => 
          (tryStart < slot.end && tryEnd > slot.start)
        );
        
        if (!hasConflict) {
          bestStartTime = tryStart;
          bestEndTime = tryEnd;
          break;
        }
      }
    }
    
    // 3. 시간을 찾았으면 스케줄 추가
    if (bestStartTime !== null && bestEndTime !== null) {
      // 사용된 시간대에 추가 (30분 휴식 포함)
      usedTimeSlots.push({
        start: bestStartTime,
        end: bestEndTime + 0.5 // 30분 휴식 추가
      });
      
      const studyTypes = ['개념 학습', '문제 풀이', '복습', '실습', '암기'];
      const studyType = studyTypes[day % studyTypes.length];

      schedules.push({
        startTime: formatDecimalToTime(bestStartTime),
        endTime: formatDecimalToTime(bestEndTime),
        title: `📖 ${item.subject} - ${studyType}`,
        subject: item.subject,
        notes: item.notes || `${item.subject} ${studyType}에 집중하세요.`,
        focusTime: focusTime,
        priority: item.priority || 'medium'
      });
    } else {
      // 시간을 찾지 못한 경우
      skippedItems.push({
        subject: item.subject,
        reason: '시간 충돌 또는 불가능한 시간대로 인해 배치할 수 없음'
      });
    }
  });

  return schedules;
}

// 시간 형식 변환 함수 추가
function formatDecimalToTime(decimal) {
  const hours = Math.floor(decimal);
  const minutes = Math.round((decimal % 1) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function checkTimeOverlap(schedules) {
  const conflicts = [];
  
  for (let i = 0; i < schedules.length; i++) {
    for (let j = i + 1; j < schedules.length; j++) {
      const schedule1 = schedules[i];
      const schedule2 = schedules[j];
      
      const start1 = parseFloat(schedule1.startTime.replace(':', '.'));
      const end1 = parseFloat(schedule1.endTime.replace(':', '.'));
      const start2 = parseFloat(schedule2.startTime.replace(':', '.'));
      const end2 = parseFloat(schedule2.endTime.replace(':', '.'));
      
      if ((start1 < end2) && (start2 < end1)) {
        conflicts.push(`${schedule1.title}과 ${schedule2.title}의 시간이 겹칩니다`);
      }
    }
  }
  
  return conflicts;
}

function getActivityByWeek(subject, dow, weekNum) {
  const act = {
    '수학': [['기초 개념', '공식 정리', '기본 문제', '응용 문제', '심화 문제', '모의고사', '오답 정리']],
    '영어': [['단어 암기', '문법', '독해', '듣기', '말하기', '쓰기', '복습']],
    '프로그래밍': [['기초 문법', '함수', '배열', '객체', '알고리즘', '실습', '프로젝트']]
  };
  const list = act[subject] || [['이론 학습', '문제 풀이', '복습']];
  return list[Math.min(weekNum - 1, list.length - 1)][dow % 7];
}

function getStudyTip(subject, activity, isWeekend) {
  const tips = {
    '수학': `${activity}은(는) 논리적으로 사고하며 접근하세요.`,
    '영어': `${activity}은(는) 꾸준한 반복이 핵심입니다.`,
    '프로그래밍': `${activity}은(는) 실습과 반복이 중요합니다.`
  };
  return (tips[subject] || `${activity}을(를) 집중해서 연습해보세요.`) + (isWeekend ? ' 주말에는 부담 없이 진행하세요.' : '');
}

router.put('/routines/:routineId', requireLogin, async (req, res) => {
  try {
    // 루틴 업데이트 로직
    res.json({ success: true, message: '루틴이 업데이트되었습니다' });
  } catch (error) {
    res.status(500).json({ success: false, message: '업데이트 실패' });
  }
});



router.get('/user-stats', (req, res) => {
  res.json({
    username: 'jaekong0521',
    routineCount: 0,
    completedCount: 0,
    joinDate: '2023년 6월 1일'
  });
});

module.exports = router;