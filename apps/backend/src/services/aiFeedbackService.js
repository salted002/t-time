const OpenAI = require('openai')
const env = require('../config/env')
const {
  getSubjectProfile,
  buildSubjectSystemPrompt,
  buildDefaultUser,
  cleanHistory,
} = require('../prompt/subjectPrompt')
const { OVERALL_SYSTEM_PROMPT, buildOverallUser } = require('../prompt/overallPrompt')

const client = new OpenAI({
  apiKey: env.ai.apiKey,
  baseURL: `${env.ai.endpoint.replace(/\/$/, '')}/openai/v1/`,
  timeout: 25000, // 25초 안에 응답이 없으면 실패 처리
})

async function callAi({ system, user, maxTokens }) {
  try {
    const res = await client.chat.completions.create({
      model: env.ai.deployment, // 모델명이 아니라 '배포 이름'
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_completion_tokens: maxTokens,
    })
    return res.choices[0].message.content.trim()
  } catch (err) {
    console.error('[AI 호출 실패]', err.status, err.message) // 원인은 서버 로그에만 남김
    const error = new Error('AI 피드백 생성에 실패했습니다.')
    error.statusCode = 502
    throw error
  }
}

/**
 * 과목 하나에 대한 AI 피드백을 생성한다. (REQ-REPORT-03: 과목명별 맞춤 프롬프트)
 * subjectName: 과목명 (예: '문법', 'SR')
 * trendHistory: [{ examId, examDate, score }] — 이 과목의 최근 점수 추이
 * classAverageHistory: [{ examId, examDate, average }] — 같은 시험들의 반평균 (선택)
 * koreanGrade: 학생의 한국 학년 (예: '5') — SR의 학년 비교에만 쓰인다 (선택)
 */
async function generateSubjectFeedback({
  subjectName,
  trendHistory,
  classAverageHistory,
  koreanGrade,
}) {
  // 점수 기록이 없으면 AI를 부르지 않는다. (비용 절약 + 지어내기 방지)
  if (cleanHistory(trendHistory).length === 0) {
    return `${subjectName} 과목은 아직 비교할 수 있는 점수 기록이 부족합니다.`
  }

  const profile = getSubjectProfile(subjectName)
  if (profile.key === 'generic') console.warn('[AI 과목 프로필 없음] 과목명:', subjectName) // 자주 보이면 prompt/subjectPrompt.js에 추가
  const buildUser = profile.buildUser ?? buildDefaultUser
  const user = buildUser({ subjectName, trendHistory, classAverageHistory, koreanGrade })

  return callAi({ system: buildSubjectSystemPrompt(profile, koreanGrade), user, maxTokens: 300 })
}

/**
 * 시험 전체 AI 피드백 (선생님 참고용, 리포트 미포함)
 * subjectStats: { [과목명]: { recent10, classAverageRecent10 } }
 * 학생 이름은 개인정보 보호를 위해 프롬프트에 넣지 않는다.
 */
async function generateOverallFeedback({ subjectStats, koreanGrade }) {
  const user = buildOverallUser({ subjectStats, koreanGrade })
  if (!user) return '종합 피드백을 만들 수 있는 점수 기록이 아직 없습니다.'

  return callAi({ system: OVERALL_SYSTEM_PROMPT, user, maxTokens: 700 })
}

module.exports = { generateSubjectFeedback, generateOverallFeedback }
