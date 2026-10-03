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

// 임시 프롬프트 : 과목별
const SUBJECT_SYSTEM_PROMPT = `당신은 학원 선생님이 학부모에게 보낼 성적 피드백 초안을 쓰도록 돕는 보조자입니다.
규칙:
- 존댓말로, 따뜻하지만 구체적으로 2~3문장만 씁니다.
- 제공된 점수와 추이(상승/하락/유지)만 근거로 쓰고, 없는 수치나 사실을 지어내지 않습니다.
- 만점 기준을 알 수 없으므로 점수가 높다/낮다고 단정하지 말고, 변화 흐름을 중심으로 씁니다.
- 학생 이름은 쓰지 말고 "학생"이라고 지칭합니다.
- 비난하거나 과장하지 않고, 개선할 점은 격려하는 어조로 제안합니다.`

// 임시 프롬프트 : 종합
const OVERALL_SYSTEM_PROMPT = `당신은 학원 선생님이 참고할 시험 전체 피드백 요약을 쓰도록 돕는 보조자입니다.
과목별 피드백들을 종합해서 3~4문장으로 학생의 전반적인 강점과 보완점을 정리합니다.
규칙: 존댓말, 과목별 피드백에 없는 내용을 지어내지 않기, 학생 이름은 쓰지 않고 "학생"이라고 지칭하기.`

/**
 * 과목 하나에 대한 AI 피드백을 생성한다. (REQ-REPORT-03: 과목명별 맞춤 프롬프트)
 * subjectName: 과목명 (예: '문법')
 * trendHistory: [{ examId, examDate, score }] — 이 과목의 최근 점수 추이 (프롬프트 재료)
 */
async function generateSubjectFeedback({ subjectName, trendHistory }) {
  // 점수 기록이 없으면 AI를 부르지 않는다. (비용 절약 + 지어내기 방지)
  if (!trendHistory || trendHistory.length === 0) {
    return `${subjectName} 과목은 아직 비교할 수 있는 점수 기록이 부족합니다.`
  }

  const lines = trendHistory.map((entry) => `- ${entry.examDate}: ${entry.score}점`).join('\n')
  const user = `과목: ${subjectName}\n최근 점수 추이 (오래된 순):\n${lines}`

  return callAi({ system: SUBJECT_SYSTEM_PROMPT, user, maxTokens: 300 })
}

// studentName은 인터페이스 호환을 위해 받지만, 개인정보 보호를 위해 프롬프트에는 넣지 않는다.
async function generateOverallFeedback({ subjectFeedbacks }) {
  const lines = Object.entries(subjectFeedbacks)
    .map(([subjectName, feedback]) => `[${subjectName}] ${feedback}`)
    .join('\n')

  return callAi({ system: OVERALL_SYSTEM_PROMPT, user: lines, maxTokens: 500 })
}

module.exports = { generateSubjectFeedback, generateOverallFeedback }
