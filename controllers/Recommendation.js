const axios = require('axios');  // 상단에 추가

exports.generateRoutine = async (req, res) => {
  try {
    const { subject, duration, target, memo, availableTime, recentRoutines } = req.body;

    const prompt = `
      [사용자 정보]
      - 과목: ${subject}
      - 기간: ${duration}일
      - 목표: ${target}
      - 메모: ${memo}
      - 사용자가 자주 하는 시간대: ${availableTime}
      - 최근 루틴: ${recentRoutines}

      위 정보를 참고해서 하루 단위 맞춤형 학습루틴(시간별 일정, 추천 이유 포함)을 표 형식으로 만들어줘.
    `;

    // 실제로는 여기에 Gemini API endpoint와 KEY를 사용해야 함
    const geminiResponse = await axios.post(
      "https://api.gemini.google.com/v1/generate", // 예시 URL (실제엔 공식 문서 참고)
      { prompt },
      { headers: { "Authorization": "Bearer [YOUR_GEMINI_API_KEY]" } }
    );

    const routine = geminiResponse.data.choices[0].text;

    res.status(200).json({ routine });

  } catch (err) {
    console.error("추천 생성 실패:", err);
    res.status(500).json({ error: "추천 생성 실패" });
  }
};
