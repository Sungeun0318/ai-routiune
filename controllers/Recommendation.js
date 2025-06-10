exports.generateRoutine = async (req, res) => {
  try {
    const { subject = "수학", duration = 7 } = req.body;

    const startDate = new Date();
    const dailyRoutines = [];

    for (let i = 0; i < duration; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const formattedDate = currentDate.toISOString().split('T')[0];
      const dateLabel = `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월 ${currentDate.getDate()}일`;

      // ✅ 일정 한 개라도 반드시 들어가야 함
      const schedules = [
        {
          startTime: "07:00",
          endTime: "09:00",
          title: `${subject} - 문제풀이`
        }
      ];

      const content = `${dateLabel} 학습 계획:\n\n` +
        schedules.map(s => `${s.startTime}-${s.endTime}: ${s.title}`).join('\n');

      dailyRoutines.push({
        date: formattedDate,
        content,
        schedules
      });
    }

    const fullRoutine = `🧠 뇌과학 기반 최적화 학습 루틴\n\n- 학습 과목: ${subject}\n- 학습 기간: ${duration}일\n- 적용 이론: 인터리빙 학습법`;

    res.status(200).json({
      message: "루틴 생성 완료",
      recommendation: fullRoutine,
      dailyRoutines
    });

  } catch (err) {
    console.error("루틴 생성 실패:", err);
    res.status(500).json({ error: "루틴 생성 중 오류 발생" });
  }
};
