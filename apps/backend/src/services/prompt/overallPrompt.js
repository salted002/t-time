// 종합 AI 피드백 프롬프트 (선생님 참고용 메모 — 학부모에게 전달되지 않음)
const {
  getSubjectProfile,
  cleanHistory,
  formatGE,
  formatGrowth,
  relationToKoreanGrade,
  RELATION_TEXT,
  round1,
  signed,
} = require('./subjectPrompt')

const OVERALL_SYSTEM_PROMPT = `당신은 학원 선생님이 학부모 상담과 수업 계획에 참고할 시험 분석 메모를 쓰도록 돕는 보조자입니다.
이 글은 선생님만 읽으며 학부모에게 전달되지 않으므로, 돌려 말하지 말고 솔직하고 간결하게 씁니다.

[출력 형식]
- 총평: 1문장
- 강점: 과목과 근거 수치를 함께, 1~2개
- 보완점: 과목과 근거 수치를 함께, 1~2개 (보완할 점이 없으면 "특별히 없음")
- 상담 포인트: 학부모와 이야기해볼 만한 것 1~2개

[규칙]
- 입력 표의 수치만 사용하고, 직접 계산하거나 없는 수치를 지어내지 않습니다.
- 과목 간 비교(예: 한 과목만 반평균 아래)와 반 내 위치를 적극 활용합니다.
- 만점 기준을 알 수 없으므로 점수 자체가 높다/낮다고 단정하지 말고 반평균 대비와 변화 흐름을 근거로 합니다.
- SR 행은 미국 원어민 기준 학년 수준입니다. 영어를 외국어로 배우는 학생이므로 한국 학년보다 낮은 것은 보완점이 아닙니다. 한국 학년과 비슷하거나 높으면 강점으로 씁니다. 수준은 "미국 ○학년 ○개월차 수준" 표현을 그대로 씁니다.
- SR과 독해(Reading)가 둘 다 있으면 두 흐름을 비교해 한 줄로 언급합니다. (예: 독해 시험은 안정적인데 SR 성장은 더딘 경우, 또는 독해 시험은 흔들려도 SR은 꾸준히 성장하는 경우 → 지문별 변동일 가능성)
- 존댓말, 학생 이름은 쓰지 않고 "학생"으로 지칭합니다.`

// subjectStats: reportService의 { [과목명]: { recent10, classAverageRecent10 } } 그대로
function buildOverallUser({ subjectStats, koreanGrade }) {
  const rows = []

  Object.entries(subjectStats || {}).forEach(([name, stat]) => {
    const history = cleanHistory(stat.recent10)
    if (history.length === 0) return

    const last = history[history.length - 1]
    const prev = history[history.length - 2]

    // SR은 점수/반평균 형식이 아니라 별도 형식으로
    if (getSubjectProfile(name).key === 'sr') {
      const rel = relationToKoreanGrade(last.score, koreanGrade)
      const growth = prev ? formatGrowth(last.score - prev.score) : '이전 기록 없음'
      rows.push(
        `${name} | ${formatGE(last.score)} | ${RELATION_TEXT[rel] ?? '한국 학년 비교 없음'} | 직전 대비 ${growth}`,
      )
      return
    }

    const avgEntry = (stat.classAverageRecent10 || []).find((a) => a.examId === last.examId)
    const avg = avgEntry?.average
    const vsClass = avg != null ? `${signed(round1(last.score - Number(avg)))}점` : '반평균 없음'
    const d = prev ? round1(last.score - prev.score) : null
    const change = d === null ? '이전 기록 없음' : d === 0 ? '변화 없음' : `${signed(d)}점`
    rows.push(
      `${name} | 최근 ${last.score}점 | 반평균 ${avg != null ? round1(Number(avg)) : '-'} | 반평균 대비 ${vsClass} | 직전 대비 ${change}`,
    )
  })

  if (rows.length === 0) return null // 호출부에서 AI 호출을 건너뛰는 신호

  return `과목 | 최근 결과 | 비교 | 변화\n${rows.join('\n')}`
}

module.exports = { OVERALL_SYSTEM_PROMPT, buildOverallUser }
