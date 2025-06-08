const express = require('express');
const axios = require('axios');
const router = express.Router();
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

    const prompt = `당신은 전문 학습 컨설턴트입니다. 다음 정보를 바탕으로 개인화된 학습 루틴을 만들어주세요.

**학습자 정보:**
- 학습 과목: ${subjects}
- 일일 총 학습시간: ${totalHours}시간
- 선호 집중시간: ${focusTime}
- 루틴 기간: ${duration}일
- 시작일: ${startDate}

**루틴 세부사항:**
${profile.routineItems?.map((item, index) => 
  `${index + 1}. ${item.subject}
     - 일일 시간: ${item.dailyHours}시간
     - 집중 시간대: ${item.focusTime}
     - 우선순위: ${item.priority}
     - 불가능 시간: ${item.unavailableTimes || '없음'}
     - 참고사항: ${item.notes || '없음'}`
).join('\n') || '기본 과목들로 구성'}

**요청사항:**
1. 시간대별로 구체적인 학습 계획 작성
2. 각 과목의 특성과 난이도를 고려한 시간 배치
3. 집중시간대를 최대한 활용한 스케줄링
4. 실현 가능하고 지속 가능한 루틴 제안
5. 학습 효과를 높이는 구체적인 팁 포함

**형식:**
- 이모지와 함께 가독성 있게 작성
- 시간대별 세부 활동 명시
- 주간/일간 패턴 설명
- 성공을 위한 실용적 조언 포함

친근하고 격려하는 톤으로 작성해주세요.`;

    console.log('Google Gemini API 요청 시작...');

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
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
  const subjects = profile.routineItems?.map(item => item.subject) || ['수학', '영어', '프로그래밍'];
  const totalHours = profile.routineItems?.reduce((sum, item) => sum + parseFloat(item.dailyHours || 2), 0) || 6;
  const focusTime = profile.routineItems?.[0]?.focusTime || '오전';
  const duration = profile.duration || 7;
  return `🎯 ${duration}일 개인 맞춤 학습 루틴\n\n📌 목표: 매일 ${totalHours}시간 꾸준한 학습\n⏰ 추천 집중 시간대: ${focusTime}\n📘 학습 과목: ${subjects.join(', ')}\n\n✨ 오전엔 집중 학습, 오후엔 복습과 실습을 추천드려요.\n✅ 포모도로 기법 (25분 집중 + 5분 휴식)을 활용해보세요!\n💡 하루 3개 이하 과목으로 나누면 더 효율적입니다.`;
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
    let content = `${formattedDate} 학습 계획:\n`;
    schedules.forEach(s => {
      content += `\n${s.startTime}-${s.endTime}: ${s.title}`;
      if (s.notes) content += `\n  💡 ${s.notes}`;
    });

    dailyRoutines.push({ day: addedDays + 1, date: formattedDate, content, schedules });
    addedDays++;
    dayOffset++;
  }

  return dailyRoutines;
}

function generateSmartDaySchedules(day, profile, date) {
  const schedules = [];
  const routineItems = profile.routineItems || [
    { subject: '수학', dailyHours: 2, focusTime: 'forenoon', priority: 'high' },
    { subject: '영어', dailyHours: 1.5, focusTime: 'afternoon', priority: 'medium' },
    { subject: '프로그래밍', dailyHours: 2.5, focusTime: 'evening', priority: 'high' }
  ];

  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  if (dayOfWeek === 6) {
    schedules.push(
      {
        startTime: '09:00',
        endTime: '11:00',
        title: '📘 복습 및 오답노트 정리',
        notes: '이번 주 학습 내용을 전체적으로 복습하고 오답노트를 정리해보세요.'
      },
      {
        startTime: '14:00',
        endTime: '16:00',
        title: '📝 모의고사 / 실전 연습',
        notes: '시간 제한 문제풀이로 실력을 점검하고, 시간 관리도 함께 연습해보세요.'
      }
    );
  } else if (dayOfWeek === 0) {
    schedules.push(
      {
        startTime: '10:00',
        endTime: '11:00',
        title: '🗂️ 루틴 리뷰 및 다음 주 계획',
        notes: '지난 학습을 되돌아보고 다음 주 목표를 계획해보세요.'
      },
      {
        startTime: '12:00',
        endTime: '21:00',
        title: '🛌 자유 시간 & 휴식',
        notes: '에너지를 충전하는 시간을 보내세요. 산책이나 가벼운 독서도 좋아요.'
      }
    );
  } else {
    const timeSlots = ['07:00', '09:00', '13:00', '15:00', '18:00', '20:00'];
    const focusTimeMapping = {
      'morning': 0, 'forenoon': 1, 'afternoon': 2,
      'evening': 3, 'night': 4
    };
    const sortedItems = [...routineItems].sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    sortedItems.forEach((item, index) => {
      if (index >= timeSlots.length) return;
      let slotIndex = focusTimeMapping[item.focusTime] || index;
      slotIndex = Math.min(slotIndex, timeSlots.length - 1);

      const startTime = timeSlots[slotIndex];
      const duration = Math.ceil(parseFloat(item.dailyHours || 2));
      const endHour = parseInt(startTime.split(':')[0]) + duration;
      const endTime = `${String(endHour).padStart(2, '0')}:00`;

      const weekNumber = Math.floor(day / 7) + 1;
      const activity = getActivityByWeek(item.subject, day % 7, weekNumber);

      schedules.push({
        startTime,
        endTime,
        title: `${item.subject} - ${activity}`,
        subject: item.subject,
        notes: getStudyTip(item.subject, activity, false),
        priority: item.priority
      });
    });
    schedules.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  return schedules;
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



router.get('/user-stats', (req, res) => {
  res.json({
    username: 'jaekong0521',
    routineCount: 0,
    completedCount: 0,
    joinDate: '2023년 6월 1일'
  });
});

module.exports = router;

// 루틴 저장 라우터 추가
router.post('/routines/save', async (req, res) => {
  try {
    const { routineItems, fullRoutine, dailyRoutines, startDate, duration } = req.body;

    const subjects = routineItems.map(item => item.subject);
    const title = subjects.length > 1
      ? `${subjects[0]} 외 ${subjects.length - 1}개`
      : subjects[0] || 'AI 추천 루틴';

    const newRoutine = new Routine({
      userId: req.session.userId,
      title,
      subjects,
      fullRoutine,
      dailyRoutines,
      startDate,
      duration
    });

    await newRoutine.save();
    console.log('✅ 루틴 DB 저장 완료:', newRoutine._id);

    res.status(201).json({ ok: true, id: newRoutine._id });
  } catch (err) {
    console.error('❌ 루틴 저장 오류:', err);
    res.status(500).json({ ok: false });
  }
});
