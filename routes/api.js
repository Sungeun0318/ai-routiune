const express = require('express');
const axios = require('axios');
const router = express.Router();
const Recommendation = require('../models/Recommendation');

// 인증 확인 미들웨어
const requireLogin = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: '로그인이 필요합니다' });
  next();
};

// AI를 통한 추천 생성 함수
async function getRecommendation(profile) {
  try {
    // API 키 확인
    if (!process.env.HF_API_TOKEN) {
      console.error('Hugging Face API 키가 설정되지 않았습니다.');
      return '설정 오류: API 키가 없습니다. 관리자에게 문의하세요.';
    }

    const prompt = `사용자 정보:
이름: ${profile.name || '사용자'}
목표: ${profile.goal || '학습 계획 수립'}
가능 시간: ${profile.hours || '4'}시간/일
학습 방법: ${profile.method || '자기주도학습'}
집중 시간대: ${profile.focusTime || '오전'}
관심 분야: ${profile.interests || '수학, 영어, 프로그래밍'}

위 정보를 바탕으로 해당 사용자에게 최적화된 일간 또는 주간 단위의 자세한 학습 루틴을 추천해주세요. 
각 시간대별로 구체적인 활동을 제안하고, 집중 시간대와 관심 분야를 적극 활용한 루틴을 제공해주세요.
캘린더 형식에 적합하게 시간대별로 구분되고 일관된 형식으로 제공해주세요.`;

    console.log('Hugging Face API 요청 시작...');
    
    // Mistral-7B-Instruct-v0.2 모델 API 호출
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
      { inputs: prompt },
      {
        headers: {
          'Authorization': `Bearer ${process.env.HF_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('API 응답 상태:', response.status);
    console.log('응답 데이터 유형:', typeof response.data);
    
    // 응답 데이터 처리
    let recommendation = '';
    if (response.data && response.data[0]) {
      recommendation = response.data[0].generated_text || '';
      
      // 프롬프트 제거
      if (recommendation.includes(prompt)) {
        recommendation = recommendation.substring(prompt.length).trim();
      }
    }
    
    return recommendation || '추천 루틴을 생성하는 중 오류가 발생했습니다';
  } catch (error) {
    console.error('Hugging Face API Error:', error.message);
    
    // 오류 응답이 있는 경우 더 자세한 정보 출력
    if (error.response) {
      console.error('상태 코드:', error.response.status);
      console.error('응답 데이터:', error.response.data);
    }
    
    return '추천 루틴을 생성하는 중 오류가 발생했습니다. 다시 시도해주세요.';
  }
}

// 루틴 추천 생성
router.post('/recommend', async (req, res) => {
  try {
    // requireLogin 미들웨어 기능 직접 구현 (테스트용)
    // if (!req.session.userId) return res.status(401).json({ error: '로그인이 필요합니다' });
    
    const recText = await getRecommendation(req.body);
    
    // 여기서는 임시로 더미 일별 루틴 생성
    // 실제로는 AI 응답을 파싱하여 더 정교한 일별 루틴 생성 필요
    const dailyRoutines = generateMockDailyRoutines(req.body);
    
    // 응답 반환
    return res.json({ 
      recommendation: recText,
      dailyRoutines: dailyRoutines 
    });
  } catch (err) {
    console.error('Recommendation error:', err);
    const status = err.response?.status || 500;
    const msg = err.response?.data?.error?.message || err.message || '서버 오류가 발생했습니다';
    return res.status(status).json({ error: msg });
  }
});

// 임시 일별 루틴 생성 함수
function generateMockDailyRoutines(profile) {
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
    const schedules = generateDaySchedules(day, profile);
    
    // 일별 컨텐츠 생성
    let content = `${formattedDate} 일정:\n\n`;
    
    schedules.forEach(schedule => {
      content += `${schedule.startTime}-${schedule.endTime}: ${schedule.title}\n`;
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

// 일별 스케줄 생성 함수
function generateDaySchedules(day, profile) {
  const schedules = [];
  const subjects = profile.routineItems?.map(item => item.subject) || ['수학', '영어', '프로그래밍'];
  
  // 요일에 따라 스케줄 생성 로직 변경
  const dayOfWeek = (day % 7);
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 일요일(0)이나 토요일(6)
  
  // 시간대별 스케줄 추가
  const timeSlots = isWeekend 
    ? ['08:00', '10:00', '13:00', '15:00', '17:00'] 
    : ['07:00', '09:00', '13:00', '16:00', '19:00'];
  
  timeSlots.forEach((startTime, index) => {
    // 끝 시간 계산
    const endTimeHour = parseInt(startTime.split(':')[0]) + 2;
    const endTime = `${String(endTimeHour).padStart(2, '0')}:00`;
    
    // 과목 선택
    const subject = subjects.length > 0
      ? subjects[(index + day) % subjects.length]
      : ['수학', '영어', '프로그래밍'][(index + day) % 3];
    
    // 활동 선택
    const activities = {
      '수학': ['개념 학습', '기본 문제 풀이', '심화 문제 풀이', '오답 노트 정리', '모의고사 풀이'],
      '영어': ['단어 암기', '문법 학습', '독해 연습', '듣기 연습', '말하기 연습'],
      '프로그래밍': ['기본 문법 학습', '알고리즘 문제 풀이', '프로젝트 작업', '코드 리뷰', '디버깅 연습']
    };
    
    let activity = '학습';
    if (activities[subject]) {
      const activityIndex = (day + index) % activities[subject].length;
      activity = activities[subject][activityIndex];
    }
    
    // 스케줄 추가
    schedules.push({
      startTime: startTime,
      endTime: endTime,
      title: `${subject} - ${activity}`,
      subject: subject,
      notes: `${subject} ${activity}에 집중하세요. ${isWeekend ? '주말에는 여유있게 학습하세요.' : ''}`
    });
  });
  
  return schedules;
}

module.exports = router;