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
    // API 키 확인 - 환경 변수 로그 출력
    console.log('환경 변수 확인:', process.env.HF_API_TOKEN ? '설정됨' : '설정되지 않음');
    
    if (!process.env.HF_API_TOKEN) {
      console.error('Hugging Face API 키가 설정되지 않았습니다.');
      throw new Error('API 키가 설정되지 않았습니다');
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
    
    // API 호출
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/microsoft/phi-2', // 더 작은 모델로 시도
      { inputs: prompt },
      {
        headers: {
          'Authorization': `Bearer ${process.env.HF_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('API 응답 상태:', response.status);
    console.log('응답 데이터 확인:', typeof response.data);
    
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
    console.error('Hugging Face API Error 상세 정보:', error);
    
    // 오류 응답이 있는 경우 더 자세한 정보 출력
    if (error.response) {
      console.error('상태 코드:', error.response.status);
      console.error('응답 데이터:', error.response.data);
      console.error('응답 헤더:', error.response.headers);
    }
    
    throw error;
  }
}

// 루틴 추천 생성
router.post('/recommend', requireLogin, async (req, res) => {
  try {
    const recText = await getRecommendation(req.body);
    
    // Store recommendation in database
    await Recommendation.create({
      user: req.session.userId,
      profile: req.body,
      recommendation: recText,
      createdAt: new Date()
    });
    
    return res.json({ recommendation: recText });
  } catch (err) {
    console.error('Recommendation error:', err.response?.data || err);
    const status = err.response?.status || 500;
    const msg = err.response?.data?.error?.message || err.message || '서버 오류가 발생했습니다';
    return res.status(status).json({ error: msg });
  }
});

// 사용자의 추천 내역 조회
router.get('/recommendations', requireLogin, async (req, res) => {
  try {
    const recommendations = await Recommendation.find(
      { user: req.session.userId },
      { recommendation: 0 } // Exclude the full text to keep response size smaller
    ).sort({ createdAt: -1 });
    
    res.json({ recommendations });
  } catch (err) {
    console.error('Error fetching recommendation history:', err);
    res.status(500).json({ error: '추천 기록을 불러오는 중 오류가 발생했습니다' });
  }
});

// 특정 추천 상세 조회
router.get('/recommendations/:id', requireLogin, async (req, res) => {
  try {
    const recommendation = await Recommendation.findOne({
      _id: req.params.id,
      user: req.session.userId
    });
    
    if (!recommendation) {
      return res.status(404).json({ error: '해당 추천을 찾을 수 없습니다' });
    }
    
    res.json({ recommendation });
  } catch (err) {
    console.error('Error fetching recommendation:', err);
    res.status(500).json({ error: '추천을 불러오는 중 오류가 발생했습니다' });
  }
});

// 피드백 저장
router.post('/feedback', requireLogin, async (req, res) => {
  const { feedback, recommendationId } = req.body;
  
  if (!feedback) {
    return res.status(400).json({ error: '피드백 내용을 입력해주세요' });
  }
  
  try {
    let query = { user: req.session.userId };
    
    // If recommendationId is provided, update that specific recommendation
    if (recommendationId) {
      query._id = recommendationId;
    } else {
      // Otherwise, update the most recent recommendation
      query = { ...query };
    }
    
    const result = await Recommendation.findOneAndUpdate(
      query,
      { feedback, updatedAt: new Date() },
      { sort: { createdAt: -1 }, new: true }
    );
    
    if (!result) {
      return res.status(404).json({ error: '업데이트할 추천을 찾을 수 없습니다' });
    }
    
    res.json({ ok: true, recommendation: result });
  } catch (err) {
    console.error('Feedback error:', err);
    res.status(500).json({ error: '피드백 저장 중 오류가 발생했습니다' });
  }
});

router.post('/save-routine', requireLogin, async (req, res) => {
  try {
    // 클라이언트에서 받은 루틴 데이터
    const routineData = req.body;
    
    // 데이터베이스에 저장 (간단한 예시)
    const savedRoutine = await Recommendation.create({
      user: req.session.userId,
      profile: routineData.routineItems,
      recommendation: routineData.fullRoutine,
      createdAt: new Date()
    });
    
    res.json({ success: true, id: savedRoutine._id });
  } catch (err) {
    console.error('Save routine error:', err);
    res.status(500).json({ error: '루틴을 저장하는 중 오류가 발생했습니다.' });
  }
});

// 사용자 통계 가져오기
router.get('/user-stats', requireLogin, async (req, res) => {
  try {
    const totalRoutines = await Recommendation.countDocuments({ user: req.session.userId });
    
    // 여기에 추가 통계 계산 로직 추가 가능
    
    res.json({
      routineCount: totalRoutines,
      completedCount: Math.floor(totalRoutines * 0.7) // 예시 데이터
    });
  } catch (err) {
    console.error('Error fetching user stats:', err);
    res.status(500).json({ error: '사용자 통계를 불러오는 중 오류가 발생했습니다' });
  }
});

// ✅ 자동 로그인 확인 추가
router.get('/me', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: '로그인이 필요합니다' });
  }
  res.json({ userId: req.session.userId });
});


module.exports = router;