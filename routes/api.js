const express = require('express');
const axios = require('axios');
const router = express.Router();
const Recommendation = require('../models/Recommendation');

// 인증 확인 미들웨어
const requireLogin = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: '로그인이 필요합니다' });
  next();
};

// Google Gemini API를 통한 추천 생성 함수
async function getRecommendation(profile) {
  try {
    // API 키 확인
    if (!process.env.GEMINI_API_KEY) {
      console.error('Google Gemini API 키가 설정되지 않았습니다.');
      return generateFallbackRecommendation(profile);
    }

    // 사용자 프로필 정보 추출
    const subjects = profile.routineItems?.map(item => item.subject).join(', ') || '수학, 영어, 프로그래밍';
    const totalHours = profile.routineItems?.reduce((sum, item) => sum + parseFloat(item.dailyHours || 2), 0) || 6;
    const focusTime = profile.routineItems?.[0]?.focusTime || '오전';
    const duration = profile.duration || 7;
    const startDate = profile.startDate || new Date().toISOString().split('T')[0];

    // 상세한 프롬프트 작성
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
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH", 
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Gemini API 응답 성공');
    
    if (response.data && response.data.candidates && response.data.candidates[0]) {
      const generatedText = response.data.candidates[0].content.parts[0].text;
      return generatedText;
    } else {
      console.error('Gemini API 응답 형식 오류:', response.data);
      return generateFallbackRecommendation(profile);
    }
    
  } catch (error) {
    console.error('Google Gemini API Error:', error.message);
    
    // 오류 세부 정보 출력
    if (error.response) {
      console.error('상태 코드:', error.response.status);
      console.error('응답 데이터:', JSON.stringify(error.response.data, null, 2));
      
      // API 한도 초과 등의 특정 오류 처리
      if (error.response.status === 429) {
        console.error('API 호출 한도 초과. 잠시 후 다시 시도해주세요.');
      } else if (error.response.status === 403) {
        console.error('API 키가 유효하지 않거나 권한이 없습니다.');
      }
    }
    
    return generateFallbackRecommendation(profile);
  }
}

// API 실패 시 대안 추천 생성
function generateFallbackRecommendation(profile) {
  const subjects = profile.routineItems?.map(item => item.subject) || ['수학', '영어', '프로그래밍'];
  const totalHours = profile.routineItems?.reduce((sum, item) => sum + parseFloat(item.dailyHours || 2), 0) || 6;
  const focusTime = profile.routineItems?.[0]?.focusTime || '오전';
  const duration = profile.duration || 7;
  
  // 집중시간대별 권장사항
  const focusTimeMap = {
    'morning': { time: '오전 (5-9시)', desc: '논리적 사고력이 최고조에 달하는 시간' },
    'forenoon': { time: '오전 (9-12시)', desc: '집중력과 기억력이 뛰어난 골든타임' },
    'afternoon': { time: '오후 (12-18시)', desc: '창의적 활동과 실습에 적합한 시간' },
    'evening': { time: '저녁 (18-22시)', desc: '복습과 정리에 효과적인 시간' },
    'night': { time: '밤 (22-2시)', desc: '가벼운 학습과 암기에 좋은 시간' }
  };
  
  const timeInfo = focusTimeMap[focusTime] || { time: focusTime, desc: '개인 맞춤 집중시간' };
  
  return `🎯 **${duration}일 개인 맞춤 학습 루틴**

👤 **학습자 프로필**
• 총 학습시간: **${totalHours}시간/일**
• 최적 집중시간: **${timeInfo.time}**
• 주요 과목: **${subjects.join(', ')}**

⭐ **${timeInfo.desc}을 최대한 활용한 맞춤 계획**

📚 **시간대별 학습 배치**

🌅 **${timeInfo.time} - 집중 학습 시간**
${subjects.slice(0, 2).map((subject, index) => 
  `• ${subject} - ${index === 0 ? '핵심 개념 학습' : '문제 풀이 및 실습'} (${Math.ceil(totalHours * 0.4 / subjects.slice(0, 2).length)}시간)`
).join('\n')}

🌤️ **일반 학습 시간**
${subjects.slice(2).map(subject => 
  `• ${subject} - 복습 및 응용 (${Math.ceil((totalHours * 0.6) / Math.max(subjects.slice(2).length, 1))}시간)`
).join('\n')}
${subjects.length <= 2 ? '• 전체 과목 통합 복습 및 정리' : ''}

💡 **학습 효과 극대화 전략**

🎯 **집중력 관리**
• 25분 학습 + 5분 휴식 (포모도로 기법)
• ${timeInfo.time}에 가장 어려운 내용 배치
• 하루 최대 ${Math.ceil(totalHours / 2)}개 세션으로 분할

📋 **과목별 최적화**
${subjects.map(subject => {
  const strategies = {
    '수학': '개념 이해 → 기본 문제 → 응용 문제 순서로 진행',
    '영어': '단어 → 문법 → 독해 → 듣기/말하기 순환 학습',
    '프로그래밍': '이론 → 코딩 실습 → 프로젝트 적용',
    '과학': '개념 → 실험/관찰 → 문제 해결',
    '국어': '문학 → 비문학 → 어법 → 작문',
    '사회': '개념 정리 → 자료 분석 → 논술 연습'
  };
  return `• ${subject}: ${strategies[subject] || '기초 → 심화 → 응용 단계적 학습'}`;
}).join('\n')}

✅ **성공을 위한 실천 가이드**

1. **루틴 정착** - 매일 같은 시간에 시작하여 습관 형성
2. **효율성 극대화** - 개인 학습 패턴 파악 후 최적화  
3. **지속 가능성** - 적절한 휴식과 성취감 유지

🎉 **응원 메시지**
꾸준함이 천재성을 이긴다는 말을 기억하며, 하루하루 성실히 실천해보세요! 💪

*이 루틴은 당신의 생활 패턴과 학습 스타일을 고려하여 최적화되었습니다.*`;
}

// 루틴 추천 생성
router.post('/recommend', async (req, res) => {
  try {
    console.log('루틴 추천 요청 받음:', req.body);
    
    const recText = await getRecommendation(req.body);
    
    // 일별 루틴 생성
    const dailyRoutines = generateEnhancedDailyRoutines(req.body);
    
    // 응답 반환
    return res.json({ 
      recommendation: recText,
      dailyRoutines: dailyRoutines 
    });
  } catch (err) {
    console.error('Recommendation error:', err);
    
    // 오류 발생 시에도 기본 추천 제공
    const fallbackRec = generateFallbackRecommendation(req.body);
    const dailyRoutines = generateEnhancedDailyRoutines(req.body);
    
    return res.json({ 
      recommendation: fallbackRec,
      dailyRoutines: dailyRoutines 
    });
  }
});

// 향상된 일별 루틴 생성 함수
function generateEnhancedDailyRoutines(profile) {
  const startDate = new Date(profile.startDate || new Date());
  const duration = parseInt(profile.duration || 7);
  const dailyRoutines = [];
  
  for (let day = 0; day < duration; day++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + day);
    
    const dateFormatter = new Intl.DateTimeFormat('ko', {
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
    
    const formattedDate = dateFormatter.format(date);
    
    // 일별 스케줄 생성
    const schedules = generateSmartDaySchedules(day, profile, date);
    
    // 일별 컨텐츠 생성
    let content = `${formattedDate} 학습 계획:\n\n`;
    
    schedules.forEach(schedule => {
      content += `${schedule.startTime}-${schedule.endTime}: ${schedule.title}\n`;
      if (schedule.notes) {
        content += `  💡 ${schedule.notes}\n`;
      }
    });
    
    dailyRoutines.push({
      day: day + 1,
      date: formattedDate,
      content: content,
      schedules: schedules
    });
  }
  
  return dailyRoutines;
}

// 더 똑똑한 일별 스케줄 생성
function generateSmartDaySchedules(day, profile, date) {
  const schedules = [];
  const routineItems = profile.routineItems || [
    { subject: '수학', dailyHours: 2, focusTime: 'forenoon', priority: 'high' },
    { subject: '영어', dailyHours: 1.5, focusTime: 'afternoon', priority: 'medium' },
    { subject: '프로그래밍', dailyHours: 2.5, focusTime: 'evening', priority: 'high' }
  ];
  
  const dayOfWeek = date.getDay(); // 0=일요일, 6=토요일
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  // 시간대별 기본 스케줄
  const timeSlots = isWeekend ? 
    ['09:00', '11:00', '14:00', '16:00', '19:00'] : 
    ['07:00', '09:00', '13:00', '15:00', '18:00', '20:00'];
  
  // 집중시간대별 과목 배치
  const focusTimeMapping = {
    'morning': 0,     // 첫 번째 슬롯
    'forenoon': 1,    // 두 번째 슬롯  
    'afternoon': 2,   // 세 번째 슬롯
    'evening': 3,     // 네 번째 슬롯
    'night': 4        // 다섯 번째 슬롯
  };
  
  // 우선순위별 정렬
  const sortedItems = [...routineItems].sort((a, b) => {
    const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
  
  sortedItems.forEach((item, index) => {
    if (index >= timeSlots.length) return;
    
    // 집중시간대 고려한 슬롯 선택
    let slotIndex = focusTimeMapping[item.focusTime] || index;
    slotIndex = Math.min(slotIndex, timeSlots.length - 1);
    
    const startTime = timeSlots[slotIndex];
    const duration = Math.ceil(parseFloat(item.dailyHours || 2));
    const endHour = parseInt(startTime.split(':')[0]) + duration;
    const endTime = `${String(endHour).padStart(2, '0')}:00`;
    
    // 주차별로 다른 활동
    const weekNumber = Math.floor(day / 7) + 1;
    const activity = getActivityByWeek(item.subject, day % 7, weekNumber);
    
    schedules.push({
      startTime: startTime,
      endTime: endTime,
      title: `${item.subject} - ${activity}`,
      subject: item.subject,
      notes: getStudyTip(item.subject, activity, isWeekend),
      priority: item.priority
    });
  });
  
  // 시간순 정렬
  schedules.sort((a, b) => a.startTime.localeCompare(b.startTime));
  
  return schedules;
}

// 주차별 활동 선택
function getActivityByWeek(subject, dayOfWeek, weekNumber) {
  const activities = {
    '수학': [
      ['기초 개념', '공식 정리', '기본 문제', '응용 문제', '심화 문제', '모의고사', '오답 정리'],
      ['미적분 기초', '극한 개념', '도함수', '적분', '응용 문제', '실전 문제', '종합 복습'],
      ['통계 기초', '확률', '데이터 분석', '그래프 해석', '실제 활용', '프로젝트', '발표 준비']
    ],
    '영어': [
      ['단어 암기', '기본 문법', '독해 기초', '듣기 연습', '말하기', '쓰기', '종합 복습'],
      ['고급 단어', '복합 문법', '심화 독해', '토론', '에세이', '발표', '실전 연습'],
      ['비즈니스 영어', '뉴스 청취', '원서 읽기', '프레젠테이션', '면접 영어', '자유 회화', '포트폴리오']
    ],
    '프로그래밍': [
      ['변수와 타입', '조건문', '반복문', '함수', '배열', '객체', '프로젝트'],
      ['알고리즘', '자료구조', '정렬', '탐색', '그래프', '동적계획법', '코딩테스트'],
      ['웹개발', 'API 설계', '데이터베이스', '프레임워크', '배포', '협업', '포트폴리오']
    ]
  };
  
  const subjectActivities = activities[subject] || [
    ['기초 학습', '개념 정리', '문제 풀이', '응용', '심화', '실전', '복습']
  ];
  
  const weekActivities = subjectActivities[Math.min(weekNumber - 1, subjectActivities.length - 1)];
  return weekActivities[dayOfWeek % weekActivities.length];
}

// 학습 팁 생성
function getStudyTip(subject, activity, isWeekend) {
  const tips = {
    '수학': `논리적 사고가 필요한 ${activity}. 단계별로 차근차근 접근하세요.`,
    '영어': `${activity} 시 소리내어 읽으면 기억에 더 오래 남습니다.`,
    '프로그래밍': `${activity} 중 막히면 구글링보다 먼저 스스로 생각해보세요.`
  };
  
  let tip = tips[subject] || `${activity}에 집중하여 꾸준히 학습하세요.`;
  
  if (isWeekend) {
    tip += ' 주말에는 평소보다 여유롭게 진행하세요.';
  }
  
  return tip;
}

module.exports = router;