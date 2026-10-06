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

// ───────── 학년 분기 ─────────
// texts에서 학년에 맞는 단계를 고른다. 숫자 키(예: 1, 2)로 학년을 직접 지정하면 그게 우선.
// 값이 null이면 '이 학년에는 단계 설명 없음'(시험이 없거나 학년 정보 없음)을 뜻한다.
function pickByBand(koreanGrade, texts) {
  const n = Number(koreanGrade)
  if (!Number.isInteger(n) || n < 1) return texts.none
  if (texts[n] !== undefined) return texts[n]
  return n <= 2 ? texts.low : n <= 4 ? texts.mid : texts.high
}

// 과목 traits 조립 틀: 소개 → 규칙들 → (학년 단계 + 제안 후보) 순서로 모든 과목이 같은 뼈대를 쓴다.
// stages의 각 값: { desc: '단계 설명', candidates: ['제안1', '제안2', ...] } 또는 null
function composeTraits({ intro, notes = [], stages }) {
  return (koreanGrade) => {
    const stage = pickByBand(koreanGrade, stages)
    const lines = [intro, ...notes.map((n) => `- ${n}`)]

    if (stage) {
      lines.push(`- 학생의 학년 단계: ${stage.desc}`)
      lines.push(`- 제안 후보: ${stage.candidates.join(' / ')}`)
      lines.push(
        '- 제안은 위 후보 중 하나만 골라 자연스러운 문장으로 씁니다. 후보를 전부 나열하지 않습니다.',
      )
    } else {
      lines.push(
        '- 학년에 특화된 단계 설명은 생략하고, 제안은 이 과목의 일반적인 학습 습관 한 가지만 자연스럽게 씁니다.',
      )
    }
    return lines.join('\n')
  }
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
// 시험이 없는 과목(파닉스, 스피킹 등)은 프로필 없이 공통 규칙만 적용된다.
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
    key: 'listening',
    match: /listening|듣기|리스닝|청취|\bL\/?C\b/i,
    traits: composeTraits({
      intro:
        '듣기는 소리에 노출된 시간이 쌓여서 오르는 영역이라 하루아침에 크게 변하지 않습니다. 컨디션, 집중력, 지문의 속도·난이도에 따라 한두 번 오르내릴 수 있으니 한 번의 하락에 걱정하지 않도록 안심시킵니다.',
      notes: ['학생이 어떤 유형을 틀렸는지는 알 수 없으므로 원인을 단정하지 않습니다.'],
      stages: {
        low: {
          desc: '영어 소리와 친해지는 단계입니다. 맞힌 개수보다 영어 소리에 즐겁게 익숙해지는 과정이 중요합니다.',
          candidates: ['노래·챈트 따라 부르기', '그림책 오디오 듣기', '짧은 영상 보기', '들은 소리를 글자와 연결해보기'],
        },
        mid: {
          desc: '단어와 짧은 문장을 듣고 뜻을 파악하는 단계입니다. 익숙한 표현이 늘수록 점수가 안정됩니다.',
          candidates: ['같은 이야기를 여러 번 반복해서 듣기', '들으면서 따라 말하기', '들은 문장 한 줄 말해보기'],
        },
        high: {
          desc: '대화나 짧은 지문을 듣고 핵심 정보를 잡는 단계입니다. 문제 유형과 속도에 적응하는 정도도 점수에 반영됩니다.',
          candidates: ['핵심 단어 메모하며 듣기', '매일 꾸준히 듣는 습관 만들기'],
        },
        none: null,
      },
    }),
  },

  {
    key: 'vocab',
    match: /단어|어휘|보카|voca/i,
    traits: composeTraits({
      intro:
        '어휘는 시험 범위의 단어를 얼마나 익혔는지가 점수에 비교적 바로 반영되는 영역이라, 범위의 양과 난이도에 따라 점수가 오르내릴 수 있습니다. 한 번의 하락에 걱정하지 않도록 안심시키되, 단어는 시간 간격을 두고 다시 볼 때 오래 기억된다는 점을 제안에 활용합니다.',
      notes: [
        '학생이 복습을 했는지, 얼마나 공부했는지는 알 수 없으므로 노력 여부를 단정하지 않습니다. 점수가 오르면 "이번 범위를 잘 익혔다" 정도로만 씁니다.',
      ],
      stages: {
        low: {
          desc: '그림·소리와 단어를 연결하는 단계입니다. 재미있게 익숙해지는 것이 중요합니다.',
          candidates: ['그림카드로 단어 맞히기 게임', '노래·챈트로 단어 익히기', '짧게 자주 단어 보기'],
        },
        mid: {
          desc: '단어 수가 늘고 읽고 쓰며 익히는 단계입니다.',
          candidates: ['소리 내어 읽으며 써보기', '틀린 단어만 따로 모아 다시 확인하기', '단어 카드로 퀴즈 내보기'],
        },
        high: {
          desc: '단어량이 많아지고 뜻이 여러 개인 단어가 나오는 단계입니다.',
          candidates: [
            '문장(예문) 속에서 쓰임과 함께 외우기',
            '간격을 두고 여러 번 복습하기(다음날, 며칠 뒤, 일주일 뒤)',
            '틀린 단어를 따로 정리해두기',
          ],
        },
        none: null,
      },
    }),
  },

  {
    key: 'grammar',
    match: /문법|그래머|grammar/i,
    traits: composeTraits({
      intro:
        '문법은 단원(시험 범위)마다 내용과 체감 난이도가 달라 점수가 오르내릴 수 있고, 앞 단원 개념 위에 다음 단원이 쌓이는 영역입니다. 개념을 알아도 문제 형식이 낯설어 틀릴 수 있으므로 "문법을 모른다"는 식으로 쓰지 않고, 반복 연습으로 익숙해지는 영역이라는 톤으로 씁니다. 한 번의 하락에 걱정하지 않도록 안심시킵니다.',
      notes: ['학생이 어떤 단원이나 유형을 틀렸는지는 알 수 없으므로 특정 단원을 언급하지 않습니다.'],
      stages: {
        low: null, // 1~2학년은 문법 시험이 없음
        mid: {
          desc: '기본 규칙을 쉬운 말로 이해하는 단계입니다.',
          candidates: ['배운 규칙을 자기 말로 설명해보기', '예문을 직접 바꿔 써보기', '틀린 문제를 스스로 고쳐보기'],
        },
        high: {
          desc: '시제·비교급처럼 규칙이 늘고 개념끼리 연결되는 단계입니다.',
          candidates: [
            '틀린 이유를 한 줄로 적고 같은 유형 다시 풀기',
            '앞 단원 개념과 연결해 정리하기',
            '배운 문법으로 직접 문장 만들어보기',
          ],
        },
        none: null,
      },
    }),
  },

  {
    key: 'reading',
    match: /reading|독해|리딩|\bR\/?C\b/i,
    traits: composeTraits({
      intro:
        '독해는 어휘와 문법 위에 쌓이는 영역으로, 읽은 양이 쌓이면서 완만하게 오릅니다. 점수는 지문의 길이·난이도·주제에 따라 한 번씩 크게 달라질 수 있으므로, 한 번의 하락에 걱정하지 않도록 안심시킵니다.',
      notes: ['학생이 왜 틀렸는지(어휘, 집중력, 지문 길이 등)는 알 수 없으므로 원인을 단정하지 않습니다.'],
      stages: {
        1: null, // 1학년은 독해 시험이 없음
        low: {
          // 2학년만 해당
          desc: '소리와 글자를 바탕으로 쉬운 문장을 읽는 단계입니다.',
          candidates: ['쉬운 그림책 소리 내어 읽기', '아는 단어 찾으며 읽기', '보호자와 한 문장씩 번갈아 읽기'],
        },
        mid: {
          desc: '짧은 이야기를 읽고 내용을 이해하는 단계입니다.',
          candidates: [
            '짧은 이야기를 읽고 내용 말해보기',
            '모르는 단어는 앞뒤 문장으로 뜻 짐작해보기',
            '좋아하는 주제의 쉬운 책을 꾸준히 읽기',
          ],
        },
        high: {
          desc: '긴 글에서 중심 내용과 흐름을 잡는 단계입니다.',
          candidates: [
            '읽고 한두 문장으로 요약해보기',
            '읽은 내용을 가족에게 이야기해주기',
            '모르는 단어가 있어도 흐름을 먼저 잡으며 끝까지 읽기',
          ],
        },
        none: null,
      },
    }),
  },

  {
    key: 'writing',
    match: /writing|쓰기|라이팅|영작|서술형/i,
    traits: composeTraits({
      intro:
        '쓰기는 철자·문장 구조·내용이 함께 채점되어 채점 기준에 따라 점수 폭이 넓은 영역이고, 읽기·듣기보다 천천히 자라는 영역입니다. 한 번의 점수 변동으로 실력을 판단하지 않도록 하고, 한 번의 하락에 걱정하지 않도록 안심시킵니다. 정확하게 쓰는 것보다 틀려도 자주 써보는 경험이 중요하다는 방향으로 안내합니다.',
      notes: [
        '학생이 철자, 문장 구조, 내용 중 어느 부분에서 점수를 잃었는지는 알 수 없으므로 원인을 단정하지 않습니다.',
        '글씨(필체)는 점수로 알 수 없으므로 글씨가 좋다/나쁘다고 평가하지 않습니다. 바르게 쓰는 습관은 제안 후보에 있을 때만 격려하는 어조로 언급합니다.',
      ],
      stages: {
        low: null, // 1~2학년은 쓰기 시험이 없음
        mid: {
          desc: '따라 쓰기와 빈칸 채우기를 거쳐 짧은 문장을 직접 써보는 단계입니다. 알파벳을 줄(선)에 맞춰 또박또박 바르게 쓰는 습관을 잡는 시기이기도 합니다.',
          candidates: [
            '줄 노트에 글자를 줄에 맞춰 한 줄씩 또박또박 따라 쓰기',
            '대문자와 소문자의 크기와 위치를 구분해서 쓰기',
            '배운 문장을 따라 쓰고 단어만 바꿔서 써보기',
            '하루 한 문장 쓰기',
            '쓴 문장을 소리 내어 읽어보기',
          ],
        },
        high: {
          desc: '여러 문장을 이어 짧은 글을 쓰는 단계입니다.',
          candidates: [
            '좋아하는 주제로 3~4문장 써보기',
            '쓴 글을 소리 내어 읽으며 스스로 고쳐보기',
            '배운 표현을 넣어 문장 만들기',
            '짧은 일기 쓰기',
          ],
        },
        none: null,
      },
    }),
  },
]

// 어떤 프로필에도 안 맞는 과목명(새 과목, 오타 등)용. 과목 특성을 지어내지 않고 점수 흐름만 근거로 쓴다.
const GENERIC_PROFILE = {
  key: 'generic',
  traits: `이 과목은 별도의 과목 안내가 준비되어 있지 않은 과목입니다.
- 과목명에서 알 수 있는 범위를 넘어 이 과목이 무엇을 평가하는지, 어떤 특성이 있는지 추측하지 않습니다.
- 해석은 점수 흐름(상승/하락/유지)과 반평균 대비(입력에 있을 때만)만 근거로 합니다.
- 제안은 과목에 관계없이 적용되는 꾸준한 복습과 연습, 격려 중심으로 한 가지만 자연스럽게 씁니다.`,
}

function getSubjectProfile(subjectName) {
  return SUBJECT_PROFILES.find((p) => p.match.test(subjectName)) ?? GENERIC_PROFILE
}

// traits는 문자열이거나, 학년을 받아 문자열을 돌려주는 함수
function buildSubjectSystemPrompt(profile, koreanGrade) {
  const traits = typeof profile.traits === 'function' ? profile.traits(koreanGrade) : profile.traits
  return traits ? `${SUBJECT_BASE_PROMPT}\n\n[이 과목의 특성]\n${traits}` : SUBJECT_BASE_PROMPT
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
