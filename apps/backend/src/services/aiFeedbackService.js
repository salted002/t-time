// TODO: 실제 AI API(OpenAI/Claude API 등) 연동 확정되면 이 파일만 고치면 됨.
// 지금은 aiFeedbackService를 부르는 쪽(reportService)이 인터페이스만 믿고 짜여있어서,
// 나중에 실제 연동해도 reportService 코드는 손댈 필요가 없음.

/**
 * 과목 하나에 대한 AI 피드백을 생성한다. (REQ-REPORT-03: 과목명별 맞춤 프롬프트)
 * subjectName: 과목명 (예: '문법')
 * trendHistory: [{ examId, examDate, score }] — 이 과목의 최근 점수 추이 (프롬프트 재료)
 */
async function generateSubjectFeedback({ subjectName, trendHistory }) {
  // TODO: 실제로는 여기서 trendHistory를 프롬프트에 넣어 AI API를 호출한다.
  const latest = trendHistory[trendHistory.length - 1]
  return `[AI 생성 예정] ${subjectName} 과목은 최근 점수 ${latest ? latest.score : '없음'}점 기준으로 피드백이 생성됩니다.`
}

/**
 * 시험 전체에 대한 AI 피드백을 생성한다. (선생님 참고용, 리포트에는 포함 안 됨)
 * subjectFeedbacks: { 과목명: 피드백 } — 과목별 피드백을 종합 재료로 사용
 */
async function generateOverallFeedback({ studentName, subjectFeedbacks }) {
  // TODO: 실제로는 subjectFeedbacks를 종합해 AI API를 호출한다.
  const subjectCount = Object.keys(subjectFeedbacks).length
  return `[AI 생성 예정] ${studentName} 학생의 전체 시험 피드백입니다. (과목 ${subjectCount}개 종합)`
}

module.exports = { generateSubjectFeedback, generateOverallFeedback }
