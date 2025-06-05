const express = require('express');
const router = express.Router();

// [GET] /api/schedule/today - 오늘 일정 목데이터 반환
router.get('/today', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  res.json({
    schedule: [
      { time: '09:00', title: '수학 - 복습', completed: false, progress: 50 },
      { time: '11:00', title: '영어 - 단어암기', completed: false, progress: 20 }
    ]
  });
});

module.exports = router;
