exports.generateRoutine = async (req, res) => {
  try {
    const { subject, duration, focusTime } = req.body;

    // ✅ 예시용 일일 루틴 미리보기 (실제 구현에서는 AI 연동 또는 조건 기반 로직 가능)
    const dailyPlan = [
      { start: "09:00", end: "10:00", subject: subject || "수학" },
      { start: "10:30", end: "11:30", subject: "영어" },
      { start: "14:00", end: "15:00", subject: "과학" }
    ];

    // 📌 향후 DB 저장 또는 AI 추천 모델 연동 가능 (현재는 하드코딩 기반 미리보기용)
    res.status(200).json({
      message: "루틴 생성 완료",
      dailyPlan  // 🟡 미리보기용 일일 루틴
    });

  } catch (err) {
    console.error("루틴 생성 실패:", err);
    res.status(500).json({ error: "루틴 생성 중 오류 발생" });
  }
};
