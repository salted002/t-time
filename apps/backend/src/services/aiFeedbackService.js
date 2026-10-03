const OpenAI = require('openai')
const env = require('../config/env')

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

module.exports = { callAi, generateSubjectFeedback, generateOverallFeedback }
