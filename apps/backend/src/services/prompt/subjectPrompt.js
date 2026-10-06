// 과목별 AI 피드백 프롬프트 (학부모에게 나가는 글의 초안)
// 구조: 공통 규칙(BASE) + 과목 프로필(traits) + 과목별 입력 생성(buildUser)

// ───────── 공통 규칙 ─────────
const SUBJECT_BASE_PROMPT = `당신은 학원 선생님이 학부모에게 보낼 성적 피드백 초안을 쓰도록 돕는 보조자입니다.

[작성 규칙]
- 존댓말, 따뜻하고 구체적으로 2~3문장만 씁니다.
- 구성: ① 이번 결과와 흐름을 한 문장으로, ② 아래 [이 과목의 특성]에 맞는 해석이나 학습 제안을 한두 문장으로.
- 제공된 수치만 근거로 쓰고, 없는 수치나 사실을 지어내지 않습니다.
- 학생이 구체적으로 무엇을 틀렸는지, 어떤 노력을 했는지는 알 수 없으므로 단정하지 않습니다. 과목 특성은 '이 영역은 보통 이렇다'는 일반적인 해석과 제안에만 사용합니다.
- 만점 기준을 알 수 없으므로 점수가 높다/낮다고 단정하지 말고, 변화 흐름과 반평균 대비(입력에 있을 때만)를 중심으로 씁니다.
- 점수가 내려간 경우 원인을 단정하지 말고, 시험 범위나 난이도에 따라 달라질 수 있음을 언급하며 격려로 마무리합니다.
- 학생 이름은 쓰지 않고 "학생"이라고 지칭합니다.
- 비난하거나 과장하지 않습니다.`

// ───────── 숫자 처리 헬퍼 (계산은 코드에서, AI에는 결과만 전달) ─────────
const round1 = (n) => Math.round(n * 10) / 10
const signed = (n) => (n > 0 ? `+${n}` : `${n}`)

// DECIMAL은 문자열로 올 수 있으므로 Number로 바꾸고, 점수 없는 항목은 버린다.
function cleanHistory(trendHistory) {
  return (trendHistory || [])
    .filter((e) => e.score !== null && e.score !== undefined)
    .map((e) => ({ ...e, score: Number(e.score) }))
}

// 6.3 → "미국 6학년 3개월차 수준" (GE 소수점 = 그 학년의 몇 개월째)
function formatGE(ge) {
  const grade = Math.trunc(ge)
  const month = Math.round((ge - grade) * 10)
  return month === 0 ? `미국 ${grade}학년 초 수준` : `미국 ${grade}학년 ${month}개월차 수준`
}

// +0.5 → "약 5개월 성장" / ±0.3 미만은 측정 오차 범위로 보고 '안정적으로 유지'
function formatGrowth(diff) {
  const months = Math.round(Math.abs(diff) * 10)
  if (months < 3) return '안정적으로 유지'
  return diff > 0 ? `약 ${months}개월 성장` : `약 ${months}개월 낮아짐`
}

// 한국 학년(초1~초6 숫자)과의 관계. 숫자로 못 읽으면 null → 비교하지 않음
function relationToKoreanGrade(ge, koreanGrade) {
  const n = Number(koreanGrade)
  if (!Number.isInteger(n)) return null
  if (ge >= n) return 'at_or_above'
  if (n - ge <= 1) return 'slightly_below'
  return 'below'
}

const RELATION_TEXT = {
  at_or_above: '한국 학년과 비슷하거나 높은 수준 (매우 우수)',
  slightly_below: '한국 학년보다 약간 낮은 수준 (영어를 외국어로 배우는 학생에게 자연스러움)',
  below: '한국 학년보다 낮은 수준 (영어를 외국어로 배우는 학생에게 자연스러움)',
}

// ───────── 기본 입력 (일반 과목) ─────────
function buildDefaultUser({ subjectName, trendHistory, classAverageHistory }) {
  const history = cleanHistory(trendHistory)
  const avgByExam = new Map((classAverageHistory || []).map((a) => [a.examId, a.average]))

  const lines = history
    .map((e) => {
      const avg = avgByExam.get(e.examId)
      return `- ${e.examDate}: ${e.score}점${avg != null ? ` (반평균 ${round1(Number(avg))})` : ''}`
    })
    .join('\n')

  const last = history[history.length - 1]
  const prev = history[history.length - 2]
  const lastAvg = avgByExam.get(last.examId)

  let change = '비교할 이전 기록 없음'
  if (prev) {
    const d = round1(last.score - prev.score)
    change = d === 0 ? '변화 없음' : `${signed(d)}점 ${d > 0 ? '상승' : '하락'}`
  }
  const vsClass =
    lastAvg != null ? `${signed(round1(last.score - Number(lastAvg)))}점` : '반평균 정보 없음'

  return [
    `과목: ${subjectName}`,
    `점수 추이 (오래된 순):\n${lines}`,
    `직전 시험 대비: ${change}`,
    `최근 시험 반평균 대비: ${vsClass}`,
  ].join('\n')
}

// ───────── 과목 프로필 ─────────
// 순서 중요: 먼저 매칭되는 프로필이 쓰인다. (SR이 reading보다 앞)
const SUBJECT_PROFILES = [
  {
    key: 'sr',
    match: /^\s*sr\s*$|star\s*reading/i,
    traits: `이 과목은 Renaissance Star Reading의 GE 지수로, 학생의 영어 독해력이 '미국 원어민 학생으로 치면 몇 학년 몇 개월차 수준'인지를 나타냅니다.
- 수준은 반드시 "미국 학생 기준으로 ○학년 ○개월차 수준"이라고 입력값 그대로 씁니다. 한국 학년과 혼동되지 않게 합니다.
- 우리 학생들은 영어를 외국어로 배우므로, 한국 학년보다 수준이 낮은 것은 자연스럽고 걱정할 일이 아닙니다. '부족', '뒤처짐', '낮다', '걱정' 같은 표현은 절대 쓰지 않습니다.
- 한국 학년과 비슷하거나 높으면 영어 원어민 또래 수준에 근접했다는 뜻이므로 매우 잘하고 있다고 칭찬합니다.
- 변화는 입력된 표현(예: "약 5개월 성장", "안정적으로 유지")을 그대로 씁니다. '안정적으로 유지'는 현재 수준을 잘 지키고 있다는 긍정적인 의미로 씁니다.
- 만점과 반평균은 없으며 사용하지 않습니다.
- 제안은 꾸준한 영어 원서 읽기와 어휘 확장 위주로 합니다.`,
    buildUser: ({ subjectName, trendHistory, koreanGrade }) => {
      const ges = cleanHistory(trendHistory).map((e) => e.score)
      const last = ges[ges.length - 1]
      const rel = relationToKoreanGrade(last, koreanGrade)
      const growth = ges.length > 1 ? formatGrowth(last - ges[ges.length - 2]) : '이전 기록 없음'
      return [
        `과목: ${subjectName}`,
        `현재 수준: ${formatGE(last)}`,
        `한국 학년과의 관계: ${RELATION_TEXT[rel] ?? '한국 학년 정보 없음 (비교하지 않음)'}`,
        `직전 시험 대비: ${growth}`,
        `추이(오래된 순): ${ges.map(formatGE).join(' → ')}`,
      ].join('\n')
    },
  },
  {
    key: 'vocab',
    match: /단어|어휘|voca/i,
    traits: `어휘는 시험 범위의 단어를 얼마나 외웠는지가 점수에 비교적 바로 반영되는 영역입니다. 꾸준한 반복 복습의 영향이 점수에 잘 드러납니다.
- 제안은 복습 주기, 반복 쓰기·테스트 같은 학습 습관 위주로 합니다.`,
  },
  {
    key: 'grammar',
    match: /문법|grammar/i,
    traits: `문법은 단원(시험 범위)마다 내용이 바뀌어서 범위와 난이도에 따라 점수가 오르내릴 수 있는 영역입니다. 개념을 이해한 뒤 문제 풀이를 반복해야 안정됩니다.
- 제안은 개념 재확인, 오답 정리 같은 학습 방법 위주로 합니다.`,
  },
  {
    key: 'reading',
    match: /reading|독해/i,
    traits: `독해는 어휘와 문법 위에 쌓이는 영역이라, 급격한 변동보다 완만한 상승이 자연스럽습니다. 지문의 난이도와 분량에 따라 점수가 달라질 수 있습니다.
- 제안은 꾸준한 지문 읽기와 기초 어휘 병행 위주로 합니다.`,
  },
  {
    key: 'listening',
    match: /listening|듣기/i,
    traits: `듣기는 매일 짧게라도 소리에 노출되는 습관과 집중력의 영향이 큰 영역입니다.
- 제안은 짧아도 매일 듣기, 들은 내용 따라 말해보기 같은 습관 위주로 합니다.`,
  },
  {
    key: 'writing',
    match: /writing|쓰기|영작|서술형/i,
    traits: `쓰기는 채점 기준에 따라 점수 폭이 넓고, 문장 구조와 표현을 얼마나 직접 써봤는지가 중요한 영역입니다.
- 제안은 짧은 문장부터 직접 써보기, 배운 표현을 문장에 활용하기 위주로 합니다.`,
  },
  {
    key: 'speaking',
    match: /speaking|말하기/i,
    traits: `말하기는 자신감과 연습량의 영향이 큰 영역입니다.
- 제안은 소리 내어 말해보는 연습, 틀려도 말해보는 태도 격려 위주로 합니다.`,
  },
]

const GENERIC_PROFILE = { key: 'generic', traits: '' } // 매칭 실패 시 공통 규칙만 적용

function getSubjectProfile(subjectName) {
  return SUBJECT_PROFILES.find((p) => p.match.test(subjectName)) ?? GENERIC_PROFILE
}

function buildSubjectSystemPrompt(profile) {
  return profile.traits
    ? `${SUBJECT_BASE_PROMPT}\n\n[이 과목의 특성]\n${profile.traits}`
    : SUBJECT_BASE_PROMPT
}

module.exports = {
  getSubjectProfile,
  buildSubjectSystemPrompt,
  buildDefaultUser,
  cleanHistory,
  formatGE,
  formatGrowth,
  relationToKoreanGrade,
  RELATION_TEXT,
  round1,
  signed,
}
