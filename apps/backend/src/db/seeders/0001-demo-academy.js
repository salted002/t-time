/**
 * 티타임(T-Time) 데모/개발용 시드 데이터 — 토마토영어학원(tomato)
 * -----------------------------------------------------
 * 기준 문서: 03_티타임_테이블정의서_v1.2.md, claude/티타임_디렉토리구조_v1.2.md
 * 규모: 학원 1개 / 반 12개 / 학생 110명 (재원 92 · 휴원 11 · 퇴원 7)
 *
 * 데이터 설계 요약
 *   - 난수는 "시드 고정(mulberry32)"이라 몇 번을 실행해도 같은 값이 나옵니다. (id/토큰만 매번 새로 생성)
 *   - 반: Kids / Basic / Inter / Advanced × A·B·C = 12개, 교사 6명이 2개 반씩 담당
 *   - 학생은 성향(상승·우수·보통·보완)을 갖고, 3~9월 시험 점수가 그 성향대로 움직입니다.
 *   - 시험은 반별로 월말평가(score) / 단원평가(score_max) / S.R. 레벨테스트(score) / 단어 등급평가(grade)
 *   - 입학일·휴원일·퇴원일을 반영해서, 응시 시점에 재원 중이던 학생만 시험에 참여합니다.
 *     (휴원/퇴원 학생의 과거 시험 기록은 남아 있음 — 9/30 정책 확인용)
 *   - 리포트는 저장 시점 스냅샷(subject_stats)까지 채웁니다.
 *     ai_feedback은 FREE 학원에선 API가 숨기므로, 데모에서 "구독하기"를 누르면 그때 나타납니다.
 *
 * 실행 명령어 (레포 루트에 seed alias가 없어 backend workspace 지정 필요)
 *   npm run seed --workspace=apps/backend
 *
 * 되돌리기(삭제) — 다시 실행하기 전에 꼭 먼저 지워주세요, 안 그러면 학원이 중복 생성됩니다
 *   npx sequelize-cli db:seed:undo --seed 0001-demo-academy.js
 *
 * 데모 로그인 정보
 *   학원 관리자: admin@tomato.kr / Ttime1234!
 *   ⚠ 프론트의 데모 로그인 버튼 이메일(frontend/src/lib/constants.ts)도 admin@tomato.kr로 맞춰야 합니다.
 */

'use strict'

const bcrypt = require('bcrypt')
const { randomUUID, randomBytes } = require('crypto')

// =====================================================================
// 0. 유틸 — 시드 고정 난수 / 날짜
// =====================================================================
function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(20261003)
const pick = (arr) => arr[Math.floor(rand() * arr.length)]
const chance = (p) => rand() < p
const between = (min, max) => min + rand() * (max - min)
const intBetween = (min, max) => Math.floor(between(min, max + 1))
const gauss = () => {
  let u = 0
  while (u === 0) u = rand()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand())
}
const weighted = (pairs) => {
  const total = pairs.reduce((sum, [, w]) => sum + w, 0)
  let r = rand() * total
  for (const [value, w] of pairs) {
    r -= w
    if (r <= 0) return value
  }
  return pairs[pairs.length - 1][0]
}
const clamp = (v, min, max) => Math.min(max, Math.max(min, v))
const round1 = (v) => Math.round(v * 10) / 10
const avg1 = (values) =>
  values.length ? Number((values.reduce((s, v) => s + v, 0) / values.length).toFixed(1)) : null
const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const pad = (n) => String(n).padStart(2, '0')
const parseDate = (s) => new Date(`${s}T00:00:00Z`)
const ymd = (d) => d.toISOString().slice(0, 10)
const addDays = (s, n) => {
  const d = parseDate(s)
  d.setUTCDate(d.getUTCDate() + n)
  return ymd(d)
}
const diffDays = (a, b) => Math.round((parseDate(b) - parseDate(a)) / 86400000)
const toWeekday = (s) => {
  const day = parseDate(s).getUTCDay()
  if (day === 0) return addDays(s, -2) // 일요일 → 금요일
  if (day === 6) return addDays(s, -1) // 토요일 → 금요일
  return s
}
const randomDate = (from, to) => addDays(from, Math.floor(rand() * (diffDays(from, to) + 1)))
const at = (s, hh = 18, mm = 0) => new Date(`${s}T${pad(hh)}:${pad(mm)}:00+09:00`)

async function insertChunked(queryInterface, table, rows, size = 1000) {
  for (let i = 0; i < rows.length; i += size) {
    await queryInterface.bulkInsert(table, rows.slice(i, i + size))
  }
}

// =====================================================================
// 1. 기준 데이터 — 반 / 레벨 / 이름 / 학교 / 문구 풀
// =====================================================================
const TODAY = '2026-10-03'

// 레벨별 설정: 학년 분포, 월말평가 과목, 교재(3~6월 / 7~9월), 단원평가 보조 과목
const LEVELS = {
  Kids: {
    grades: [
      ['초1', 6],
      ['초2', 4],
    ],
    monthly: ['단어', 'Listening', 'Speaking', 'Reading'],
    books: ['Smart Phonics 3', 'Smart Phonics 4'],
    extra: { name: '단어', max: 20 },
    wordGrade: true,
    levelShift: 3,
  },
  Basic: {
    grades: [
      ['초2', 3],
      ['초3', 5],
      ['초4', 2],
    ],
    monthly: ['단어', 'Reading', 'Listening', '문법'],
    books: ["Let's Go 3", "Let's Go 4"],
    extra: { name: '단어', max: 20 },
    wordGrade: true,
    levelShift: 1,
  },
  Inter: {
    grades: [
      ['초4', 4],
      ['초5', 4],
      ['초6', 1],
    ],
    monthly: ['단어', 'Reading', 'Writing', '문법', 'Listening'],
    books: ['Bridge Reading 1', 'Bridge Reading 2'],
    extra: { name: '문법', max: 30 },
    wordGrade: false,
    levelShift: -1,
  },
  Advanced: {
    grades: [
      ['초5', 4],
      ['초6', 6],
    ],
    monthly: ['Reading', 'Writing', '문법', 'Listening', 'Speaking'],
    books: ['Wonders 4', 'Wonders 5'],
    extra: { name: '문법', max: 30 },
    wordGrade: false,
    levelShift: -3,
  },
}

// [레벨, 알파벳, 재원 정원, 담당 교사] — 재원 합계 86명
const CLASS_PLAN = [
  ['Kids', 'A', 8, '박민지'],
  ['Kids', 'B', 7, '박민지'],
  ['Kids', 'C', 6, '정다은'],
  ['Basic', 'A', 8, '이현우'],
  ['Basic', 'B', 8, '이현우'],
  ['Basic', 'C', 7, '정다은'],
  ['Inter', 'A', 8, '최수진'],
  ['Inter', 'B', 7, '최수진'],
  ['Inter', 'C', 7, '오세린'],
  ['Advanced', 'A', 7, '한지훈'],
  ['Advanced', 'B', 7, '한지훈'],
  ['Advanced', 'C', 6, '오세린'],
]

const LAST_NAMES = [
  '김',
  '이',
  '박',
  '최',
  '정',
  '강',
  '조',
  '윤',
  '장',
  '임',
  '한',
  '오',
  '서',
  '신',
  '권',
  '황',
  '안',
  '송',
  '류',
  '홍',
]
const FIRST_NAMES = [
  '서연',
  '도윤',
  '하은',
  '시우',
  '지우',
  '민준',
  '수아',
  '예준',
  '채원',
  '이준',
  '다은',
  '지호',
  '유나',
  '현우',
  '소율',
  '건우',
  '서윤',
  '민재',
  '아린',
  '준서',
  '하준',
  '지안',
  '주원',
  '예린',
  '유준',
  '나은',
  '은우',
  '시윤',
  '하린',
  '지유',
  '승우',
  '태윤',
  '도현',
  '서아',
  '연우',
  '지아',
  '우진',
  '윤서',
  '수현',
  '재이',
  '로아',
  '이안',
  '하율',
  '시연',
  '민서',
  '주안',
  '유찬',
  '가온',
  '다온',
  '예서',
  '채윤',
  '정우',
  '지환',
  '세아',
  '나윤',
  '동하',
  '리아',
  '선우',
  '해인',
  '규민',
]

const SCHOOLS = [
  ['상동초', 24],
  ['중동초', 20],
  ['계남초', 16],
  ['옥산초', 14],
  ['석천초', 12],
  ['부인초', 8],
  ['심원초', 6],
]

const TYPES = [
  ['상승', 25],
  ['우수', 22],
  ['보통', 38],
  ['보완', 15],
]

// 학생 공통 점수 키: 과목명 → 개인 편차 키 ('...단원평가'는 UNIT)
const SUBJECT_KEYS = ['Reading', 'Writing', '단어', 'Listening', 'Speaking', '문법', 'UNIT']
const subjectKey = (name) => (name.endsWith('단원평가') ? 'UNIT' : name)

// =====================================================================
// 2. 문구 풀 — 선생님 코멘트 / 상담 / AI 피드백 / 선생님 피드백
// =====================================================================
const TEACHER_COMMENTS = {
  상승: [
    '지난달보다 눈에 띄게 향상되었습니다.',
    '수업 참여가 적극적으로 변했습니다.',
    '꾸준한 복습의 효과가 보입니다.',
  ],
  우수: [
    '전 영역에서 안정적인 실력을 보여줍니다.',
    '발표와 활동에서 모범이 되는 학생입니다.',
    '심화 문제도 잘 해결합니다.',
  ],
  보통: [
    '기본 개념은 잘 이해하고 있습니다.',
    '실수를 줄이면 더 좋은 결과가 기대됩니다.',
    '숙제 완성도를 조금만 더 높여 봅시다.',
  ],
  보완: [
    '기초 단원 복습이 필요합니다.',
    '집중력을 높일 수 있도록 지도 중입니다.',
    '단어 암기에 조금 더 시간을 써 봅시다.',
  ],
}

const PARENT_COUNSEL = [
  (n, s) =>
    `${n} 학생 학부모님과 월말평가 결과를 공유함. ${s} 영역 보완을 위해 가정에서 하루 10분 복습을 병행하기로 함.`,
  () =>
    '숙제 수행 정도와 학습 습관에 대해 상담함. 학부모님께서 귀가 후 숙제 점검을 도와주시기로 함.',
  () =>
    '최근 영어에 대한 흥미가 높아졌다는 학부모님 의견을 전달받음. 원서 읽기를 병행하는 방법을 안내함.',
  (n, s) => `${n} 학생의 ${s} 점수 변화에 대해 안내하고, 이후 수업에서의 보완 계획을 설명함.`,
  () => '수업 시간 변경 가능 여부 문의. 현재 가능한 시간대를 안내하고 다음 달부터 조정하기로 함.',
  () => '상급반 진급 시기와 기준에 대해 문의. S.R. 점수와 월말평가 추이를 기준으로 안내함.',
  () => '학교 영어 수행평가 준비에 대한 상담. 수업 중 병행 가능한 범위를 안내함.',
  (n) => `${n} 학생이 숙제 양을 부담스러워한다는 의견. 분량을 조정하고 1주 후 다시 확인하기로 함.`,
  () => '교재 진도와 다음 학기 커리큘럼에 대해 안내함. 방학 특강 일정도 함께 공유함.',
  (n) => `${n} 학생의 수업 태도가 좋아졌다는 점을 전달함. 집에서도 칭찬과 격려를 부탁드림.`,
]
const STUDENT_COUNSEL = [
  (n, s) => `${s} 영역이 어렵다는 이야기를 함. 쉬운 자료부터 단계적으로 연습하기로 약속함.`,
  () => '단어 암기가 힘들다고 함. 짧게 자주 반복하는 방법과 게임식 복습을 안내함.',
  () => '수업 중 발표가 부담스럽다고 함. 짝 활동으로 먼저 말해 보는 연습부터 시작하기로 함.',
  (n) =>
    `${n} 학생의 이번 달 목표를 함께 정함. 다음 월말평가에서 한 영역 이상 점수 올리기로 약속함.`,
  () => '숙제할 시간이 부족하다는 이야기를 들음. 학원 자습 시간을 활용하는 방법을 안내함.',
  () => '영어 책 읽기가 재미있어졌다고 함. 수준에 맞는 다음 읽기 책을 추천함.',
  () => '친구들과 함께하는 활동이 즐겁다고 함. 팀 활동 역할을 맡겨 자신감을 키워 주기로 함.',
  (n, s) => `${s} 시험에서 아쉬운 점수가 나와 속상해함. 틀린 문제를 같이 확인하고 격려함.`,
]
const COUNSEL_NOTES = [
  '다음 상담은 다음 달 월말평가 이후 진행',
  '숙제 점검표를 가정에 공유하기로 함',
  '학부모 요청으로 추가 상담 예정',
  '반 이동 여부 재검토 필요',
  'S.R. 레벨테스트 결과 반영 후 재안내',
  '2주 뒤 경과 확인 예정',
]
const LEAVE_COUNSEL = {
  퇴원: [
    '이사로 인한 퇴원 상담. 마지막 수업일과 성적표 전달 방법을 안내함.',
    '학교 방과후 및 타 학원 일정으로 퇴원 의사를 전달받음. 교재비 정산과 퇴원 절차를 안내함.',
    '학습 일정 조정으로 퇴원 상담. 추후 재등록이 가능함을 안내함.',
  ],
  휴원: [
    '가족 일정(장기 여행)으로 휴원 상담. 복귀 시점에 레벨 확인 후 반 배정하기로 함.',
    '학업 일정 조정으로 휴원 문의. 복귀 시 재상담하기로 함.',
    '개인 사정으로 한 학기 휴원 상담. 복귀 시 레벨테스트를 진행할 예정.',
  ],
}

// AI 피드백 샘플 — 과목군(키) × 성취 유형 4개. {이름}은 학생 이름으로 치환
const AI_FEEDBACK = {
  Reading: {
    상승: '{이름} 학생은 지난 시험보다 리딩 점수가 눈에 띄게 올랐습니다. 지문의 핵심 내용을 파악하는 힘이 좋아졌고, 이 흐름을 이어가면 한 단계 높은 지문에도 도전할 수 있습니다.',
    우수: '{이름} 학생은 지문을 끝까지 집중해서 읽고 세부 정보까지 정확하게 찾아냅니다. 안정적으로 높은 점수를 유지하고 있어, 다음에는 추론형 문제로 폭을 넓혀 보면 좋겠습니다.',
    보통: '{이름} 학생은 짧은 지문은 잘 읽지만 길어지면 중간 내용을 놓치는 경우가 있습니다. 문단별로 핵심 단어에 밑줄을 치며 읽는 연습을 권합니다.',
    보완: '{이름} 학생은 이번 리딩에서 지난 시험보다 점수가 내려갔습니다. 모르는 단어가 많아 지문 이해가 어려웠던 것으로 보여, 어휘 복습과 짧은 지문 반복 읽기부터 함께 시작하겠습니다.',
  },
  Writing: {
    상승: '{이름} 학생의 라이팅 실력이 눈에 띄게 늘었습니다. 문장 길이가 길어지고 배운 표현을 활용해 자신의 생각을 풀어내는 모습이 좋아졌습니다.',
    우수: '{이름} 학생은 문장 구성이 탄탄하고 철자와 대소문자 실수도 거의 없습니다. 이제는 접속어를 활용해 글을 두세 문장 더 확장해 보는 도전을 권합니다.',
    보통: '{이름} 학생은 주어진 문형을 활용한 문장 쓰기는 안정적이지만 스스로 문장을 만들 때는 망설임이 있습니다. 매일 한 문장 일기 쓰기를 추천드립니다.',
    보완: '{이름} 학생은 이번 라이팅에서 철자와 문장 구성 실수가 늘었습니다. 베껴 쓰기와 짧은 문장 완성하기부터 차근차근 다시 연습하겠습니다.',
  },
  단어: {
    상승: '{이름} 학생의 단어 암기가 확실히 늘었습니다. 꾸준한 학습 덕분에 점수가 올랐고, 뜻뿐 아니라 문장 속 쓰임까지 익히면 더 좋겠습니다.',
    우수: '{이름} 학생은 어휘 영역에서 뛰어난 성취를 보입니다. 배운 단어를 정확히 기억하고 철자도 안정적이라, 반의어·유의어까지 넓혀 어휘력을 키워 보면 좋겠습니다.',
    보통: '{이름} 학생은 단어를 대체로 잘 외우지만 헷갈리는 철자와 비슷한 단어에서 실수가 있습니다. 매일 10분 소리 내어 복습하는 습관을 권합니다.',
    보완: '{이름} 학생은 이번 단어 점수가 낮았습니다. 외우는 양에 비해 복습 간격이 길었던 것으로 보여, 짧게 자주 반복하는 방식으로 학습 방법을 바꿔 보겠습니다.',
  },
  Listening: {
    상승: '{이름} 학생의 듣기 실력이 눈에 띄게 좋아졌습니다. 질문을 끝까지 듣고 알맞은 답을 고르는 정확도가 높아졌습니다.',
    우수: '{이름} 학생은 빠른 속도의 대화에서도 핵심을 잘 잡아냅니다. 숫자와 시간 같은 세부 정보까지 놓치지 않는 점이 강점입니다.',
    보통: '{이름} 학생은 천천히 말하는 문장은 잘 이해하지만 연음이나 빠른 표현에서 놓치는 부분이 있습니다. 집에서 짧은 영어 영상을 반복해서 들어 보세요.',
    보완: '{이름} 학생은 듣기에서 집중력이 흐트러진 문항이 많았습니다. 짧은 문장 받아쓰기부터 시작해 소리와 철자를 연결하는 연습을 함께 하겠습니다.',
  },
  Speaking: {
    상승: '{이름} 학생은 수업 중 발표와 질문에 자신 있게 참여하면서 말하기 점수가 올랐습니다. 문장을 끝까지 말하는 습관이 좋아졌습니다.',
    우수: '{이름} 학생은 발음이 또렷하고 완성된 문장으로 자연스럽게 의견을 말합니다. 이유를 덧붙여 말하는 연습으로 한 단계 더 나아갈 수 있습니다.',
    보통: '{이름} 학생은 아는 표현은 잘 말하지만 틀릴까 봐 망설이는 모습이 있습니다. 짧은 문장이라도 소리 내어 말할 기회를 자주 드리겠습니다.',
    보완: '{이름} 학생은 이번 말하기 평가에서 긴장해서 실력을 다 보여주지 못했습니다. 짝 활동으로 부담 없이 말해 보는 경험을 늘려 자신감을 키우겠습니다.',
  },
  문법: {
    상승: '{이름} 학생의 문법 점수가 꾸준히 오르고 있습니다. 시제와 be동사 구분에서 실수가 줄었고, 배운 규칙을 문장에 직접 적용하는 모습이 좋아졌습니다.',
    우수: '{이름} 학생은 기본 문법 규칙을 정확히 이해하고 있어 실수가 거의 없습니다. 직접 문장을 만들어 보는 쓰기 활동으로 확장하면 실력이 더 단단해질 것입니다.',
    보통: '{이름} 학생은 기본 문형은 잘 알지만 시제나 단수·복수 같은 세부 규칙에서 실수가 반복됩니다. 틀린 문제를 오답노트로 정리하면 빠르게 개선될 수 있습니다.',
    보완: '{이름} 학생은 문법 점수가 다소 하락했고, 최근 배운 단원의 규칙이 아직 정리되지 않은 것으로 보입니다. 해당 단원을 기초부터 다시 짚고 확인 문제를 자주 풀어 보겠습니다.',
  },
  UNIT: {
    상승: '{이름} 학생은 교재 단원평가 점수가 지난번보다 올랐습니다. 수업에서 배운 핵심 표현을 꼼꼼히 복습한 덕분이며, 이 습관을 이어가면 좋겠습니다.',
    우수: '{이름} 학생은 단원별 핵심 내용을 정확히 이해하고 있어 교재 평가에서 안정적인 고득점을 받고 있습니다. 다음 단원 예습으로 한 걸음 더 나아가 보세요.',
    보통: '{이름} 학생은 단원평가에서 기본 문제는 잘 풀지만 응용 문제에서 실수가 있습니다. 틀린 문제를 다시 풀어 보는 오답 정리를 권합니다.',
    보완: '{이름} 학생은 이번 단원평가 점수가 낮았고, 배운 단원의 핵심 문장 암기가 부족했습니다. 수업 후 문장 암기 확인과 복습 숙제를 더 꼼꼼히 챙기겠습니다.',
  },
  'S.R.': {
    상승: '{이름} 학생의 S.R. 점수가 지난 평가보다 상승했습니다. 독해 수준이 한 단계 올라가고 있으니 현재 수준에 맞는 원서 읽기를 꾸준히 이어가면 좋겠습니다.',
    우수: '{이름} 학생의 S.R. 점수가 같은 학년 평균을 크게 웃돕니다. 독해력이 뛰어나므로 다양한 장르의 책을 읽으며 어휘 폭을 넓혀 보길 권합니다.',
    보통: '{이름} 학생의 S.R. 점수는 학년 수준에 맞게 안정적으로 유지되고 있습니다. 매일 꾸준히 읽는 습관이 쌓이면 점수도 함께 오를 것입니다.',
    보완: '{이름} 학생의 S.R. 점수가 학년 평균보다 다소 낮습니다. 쉬운 수준의 책부터 소리 내어 읽으며 읽기 자신감을 먼저 키워 보겠습니다.',
  },
}

const TEACHER_FEEDBACK = {
  상승: [
    '이번 달 {이름} 학생의 성장이 돋보였습니다. 숙제와 복습을 꾸준히 해 준 덕분에 전 영역에서 점수가 올랐어요. 계속 응원해 주세요.',
    '수업 참여도가 눈에 띄게 높아졌습니다. 모르는 것을 먼저 질문하는 모습이 칭찬할 만합니다. 지금의 학습 리듬을 유지해 주세요.',
    '{이름} 학생은 최근 몇 달간 꾸준히 상승 중입니다. 자신감이 붙은 만큼 조금 더 어려운 과제에도 도전해 볼 시기입니다.',
  ],
  우수: [
    '{이름} 학생은 모든 영역에서 안정적으로 우수한 성적을 유지하고 있습니다. 수업 태도도 모범적이라 반 친구들에게 좋은 본보기가 됩니다.',
    '기본기가 탄탄하여 심화 활동으로 확장해도 좋을 단계입니다. 상위 반 진급도 함께 고려해 보겠습니다.',
    '꾸준한 독서와 복습 습관이 성적으로 이어지고 있습니다. 지금처럼만 해 주면 충분합니다.',
  ],
  보통: [
    '{이름} 학생은 전반적으로 무난하게 따라오고 있습니다. 약한 영역 한두 가지만 집중 보완하면 한 단계 더 올라갈 수 있습니다.',
    '수업 집중도는 좋은 편이지만 숙제 완성도에 기복이 있습니다. 가정에서 숙제 점검을 한 번만 도와주시면 큰 도움이 됩니다.',
    '점수가 비슷하게 유지되고 있어 안정적입니다. 이번 달부터는 단어 복습 시간을 조금 늘려 보겠습니다.',
  ],
  보완: [
    '이번 시험은 기대만큼 결과가 나오지 않았습니다. 큰 문제는 아니며, 기초 단원부터 다시 짚어 자신감을 되찾도록 돕겠습니다.',
    '최근 집중력이 다소 흐트러지는 모습이 보입니다. 상담을 통해 원인을 함께 살펴보고 학습 방법을 조정하겠습니다.',
    '점수가 조금 내려갔지만 노력하는 태도는 그대로입니다. 틀린 문제 복습을 늘리면 금방 회복할 수 있을 거예요.',
  ],
}

const SMS_TEMPLATES = [
  {
    name: '성적표 안내 (기본)',
    content: '안녕하세요, {학생명} 학생 성적표가 도착했습니다. 확인 부탁드립니다.',
    isDefault: true,
  },
  {
    name: '상담 예약 안내',
    content:
      '안녕하세요, {학생명} 학생 상담 일정 관련하여 안내드립니다. 담당 선생님께 문의 부탁드립니다.',
    isDefault: false,
  },
  {
    name: '수업 일정 변경 안내',
    content:
      '안녕하세요, {학생명} 학생 수업 일정이 변경되어 안내드립니다. 자세한 내용은 학원으로 문의 부탁드립니다.',
    isDefault: false,
  },
  {
    name: '월말평가 안내',
    content:
      '안녕하세요, {학생명} 학생의 월말평가가 곧 진행됩니다. 이번 달 단원 복습에 신경 써 주세요.',
    isDefault: false,
  },
]

const fill = (text, name) => text.replace(/\{이름\}/g, name).replace(/\{학생명\}/g, name)

// =====================================================================
// 3. 점수 생성 규칙
// =====================================================================
const SR_BASE_BY_GRADE = { 초1: 1.6, 초2: 2.3, 초3: 3.0, 초4: 3.7, 초5: 4.4, 초6: 5.0 }

// 월(3~9)에 해당하는 0~100점 환산 점수
function pctFor(student, name, monthIdx) {
  const value =
    student.base + student.slope * monthIdx + student.off[subjectKey(name)] + gauss() * 4
  return clamp(value, 0, 100)
}

// S.R.: 일의 자리=학년, 소수점 첫째자리=개월수 → 1.1 ~ 8.7, 대부분 5.5 이하
function srFor(student, quarterIdx) {
  const growth = { 상승: 0.4, 우수: 0.3, 보통: 0.2, 보완: 0.05 }[student.type]
  let value =
    SR_BASE_BY_GRADE[student.grade] + student.srOffset + growth * quarterIdx + gauss() * 0.12
  value = clamp(value, 1.1, 8.7)
  let v = round1(value)
  if (Math.round(v * 10) % 10 === 0) v = round1(v + 0.1) // X.0은 쓰지 않음(개월수 1~9)
  return clamp(v, 1.1, 8.7)
}

const gradeLabelOf = (pct) =>
  pct >= 90 ? 'A' : pct >= 80 ? 'B' : pct >= 70 ? 'C' : pct >= 60 ? 'D' : 'F'

// =====================================================================
// 4. up
// =====================================================================
async function up(queryInterface) {
  const now = new Date()
  const passwordHash = bcrypt.hashSync('Ttime1234!', 10)

  // ---------------------------------------------------------------
  // 1. academies / users
  // ---------------------------------------------------------------
  const academyId = randomUUID()
  await queryInterface.bulkInsert('academies', [
    {
      id: academyId,
      name: '토마토영어학원',
      slug: 'tomato',
      business_number: '123-45-67890',
      owner_name: '김선주',
      logo_url: null,
      phone: '032-123-4567',
      address: '경기도 부천시 상동로 123',
      sms_sender_number: '01012345678',
      subscription_status: 'FREE', // 10/12 발표에서 구독 흐름을 라이브로 보여주기 위해 FREE 유지
      subscribed_at: null,
      is_demo: true,
      deleted_at: null,
      created_at: now,
      updated_at: now,
    },
  ])
  await queryInterface.bulkInsert('users', [
    {
      id: randomUUID(),
      academy_id: academyId,
      name: '김선주',
      email: 'admin@tomato.kr',
      password_hash: passwordHash,
      created_at: now,
      updated_at: now,
    },
  ])

  // ---------------------------------------------------------------
  // 2. classes (12개)
  // ---------------------------------------------------------------
  const classes = CLASS_PLAN.map(([level, letter, capacity, teacher]) => ({
    id: randomUUID(),
    level,
    name: `${level} ${letter}`,
    teacher,
    capacity,
  }))
  const classById = new Map(classes.map((c) => [c.id, c]))
  await queryInterface.bulkInsert(
    'classes',
    classes.map((c) => ({
      id: c.id,
      academy_id: academyId,
      name: c.name,
      teacher_name: c.teacher,
      created_at: now,
      updated_at: now,
    })),
  )

  // ---------------------------------------------------------------
  // 3. students (110명: 재원 92 / 휴원 11 / 퇴원 7)
  // ---------------------------------------------------------------
  const usedNames = new Set()
  const usedPhones = new Set()
  const makeName = () => {
    for (;;) {
      const name = pick(LAST_NAMES) + pick(FIRST_NAMES)
      if (!usedNames.has(name)) {
        usedNames.add(name)
        return name
      }
    }
  }
  const makePhone = () => {
    for (;;) {
      const phone = `010-${intBetween(2000, 9999)}-${intBetween(1000, 9999)}`
      if (!usedPhones.has(phone)) {
        usedPhones.add(phone)
        return phone
      }
    }
  }

  const students = []
  function addStudent({ status, cls, grade }) {
    const type = weighted(TYPES)
    const levelShift = cls ? LEVELS[cls.level].levelShift : 0
    const baseByType = {
      우수: 88 + gauss() * 3,
      상승: 66 + gauss() * 4,
      보통: 74 + gauss() * 5,
      보완: 72 + gauss() * 4,
    }
    const slopeByType = {
      우수: 0.2,
      상승: 1.8 + gauss() * 0.3,
      보통: 0.15 + gauss() * 0.4,
      보완: -1.5 + gauss() * 0.3,
    }
    const srBonus = { 우수: 1.2, 상승: 0.2, 보통: 0, 보완: -0.5 }[type]
    const off = {}
    SUBJECT_KEYS.forEach((k) => {
      off[k] = gauss() * 5
    })

    // 입학일: 82%는 2026-03 이전, 나머지는 3~8월 중도 입학
    let enrolledAt
    if (chance(0.82)) enrolledAt = randomDate('2023-03-06', '2026-02-27')
    else enrolledAt = toWeekday(randomDate('2026-03-03', '2026-08-21'))

    // 휴원/퇴원 시점 (입학일보다 뒤)
    let leftAt = null
    if (status === '퇴원') leftAt = toWeekday(randomDate('2026-04-27', '2026-09-04'))
    if (status === '휴원') leftAt = toWeekday(randomDate('2026-07-06', '2026-09-14'))
    if (leftAt && enrolledAt >= addDays(leftAt, -20))
      enrolledAt = randomDate('2024-03-04', '2026-02-27')

    students.push({
      id: randomUUID(),
      name: makeName(),
      status,
      classId: cls ? cls.id : null,
      school: weighted(SCHOOLS),
      grade,
      parentPhone: makePhone(),
      enrolledAt,
      leftAt,
      type,
      base: baseByType[type] + levelShift,
      slope: slopeByType[type],
      off,
      srOffset: gauss() * 0.5 + srBonus,
    })
  }

  const gradePicker = (cls) => weighted(LEVELS[cls.level].grades)
  // 재원 — 반 배정 86명
  classes.forEach((cls) => {
    for (let i = 0; i < cls.capacity; i++)
      addStudent({ status: '재원', cls, grade: gradePicker(cls) })
  })
  // 재원 — 반 미배정 6명
  for (let i = 0; i < 6; i++) {
    addStudent({
      status: '재원',
      cls: null,
      grade: pick(['초1', '초2', '초3', '초4', '초5', '초6']),
    })
  }
  // 휴원 11 / 퇴원 7 (반 정보는 유지)
  for (let i = 0; i < 11; i++) {
    const cls = pick(classes)
    addStudent({ status: '휴원', cls, grade: gradePicker(cls) })
  }
  for (let i = 0; i < 7; i++) {
    const cls = pick(classes)
    addStudent({ status: '퇴원', cls, grade: gradePicker(cls) })
  }

  // 형제·자매 3쌍: 같은 성, 같은 학교, 같은 학부모 번호 (학부모 번호 중복 표시 확인용)
  const siblingCandidates = students.filter((s) => s.status === '재원' && s.classId)
  for (const idx of [4, 31, 58]) {
    const a = siblingCandidates[idx]
    const b = siblingCandidates[idx + 1]
    usedNames.delete(b.name)
    let newName
    do {
      newName = a.name[0] + pick(FIRST_NAMES)
    } while (usedNames.has(newName))
    usedNames.add(newName)
    b.name = newName
    b.school = a.school
    b.parentPhone = a.parentPhone
  }

  // 특별 케이스: Advanced 초6 우수 학생 1명은 S.R. 8점대 (최대치 확인용)
  const topStudent = students.find(
    (s) =>
      s.status === '재원' &&
      s.classId &&
      classById.get(s.classId).level === 'Advanced' &&
      s.grade === '초6',
  )
  topStudent.type = '우수'
  topStudent.base = 94
  topStudent.slope = 0.2
  topStudent.srOffset = 2.4

  const studentById = new Map(students.map((s) => [s.id, s]))
  await queryInterface.bulkInsert(
    'students',
    students.map((s) => ({
      id: s.id,
      academy_id: academyId,
      name: s.name,
      class_id: s.classId,
      status: s.status,
      school: s.school,
      grade: s.grade,
      parent_phone: s.parentPhone,
      enrolled_at: s.enrolledAt,
      created_at: at(s.enrolledAt, 10),
      updated_at: s.leftAt ? at(s.leftAt, 10) : at(s.enrolledAt, 10),
    })),
  )

  // ---------------------------------------------------------------
  // 4. exams / exam_subjects / exam_grades / participants / scores
  // ---------------------------------------------------------------
  const exams = []
  const examRows = []
  const subjectRows = []
  const gradeRows = []
  const participantRows = []
  const scoreRows = []
  const GRADE_LABELS = ['A', 'B', 'C', 'D', 'F']

  const studentsByClass = new Map(classes.map((c) => [c.id, []]))
  students.forEach((s) => {
    if (s.classId) studentsByClass.get(s.classId).push(s)
  })

  function buildExam({ cls, month, kind, date }) {
    const lv = LEVELS[cls.level]
    const examId = randomUUID()
    const monthIdx = month - 3
    let name
    let evalType
    let subjects
    let memo = null

    if (kind === 'monthly') {
      name = `${month}월 월말평가`
      evalType = 'score'
      subjects = lv.monthly.map((n) => ({ name: n, max: null }))
      if (chance(0.25))
        memo = `이번 달 범위: Unit ${intBetween(1, 4) * 2 - 1}~${intBetween(1, 4) * 2 + 4}`
    } else if (kind === 'unit') {
      const book = month <= 6 ? lv.books[0] : lv.books[1]
      name = `${month}월 단원평가`
      evalType = 'score_max'
      subjects = [
        { name: `${book} 단원평가`, max: 50 },
        { name: lv.extra.name, max: lv.extra.max },
      ]
    } else if (kind === 'sr') {
      name = 'S.R. 레벨테스트'
      evalType = 'score'
      subjects = [{ name: 'S.R.', max: null }]
      memo = 'Star Reading 온라인 평가'
    } else {
      name = `${month}월 단어 등급평가`
      evalType = 'grade'
      subjects = [
        { name: '단어', max: null },
        { name: 'Speaking', max: null },
      ]
    }

    const exam = {
      id: examId,
      classId: cls.id,
      date,
      name,
      evalType,
      kind,
      monthIdx,
      subjects: subjects.map((s) => ({ id: randomUUID(), ...s })),
      grades:
        evalType === 'grade'
          ? GRADE_LABELS.map((label, i) => ({ id: randomUUID(), label, order: i + 1 }))
          : [],
      parts: [],
    }
    exams.push(exam)

    examRows.push({
      id: examId,
      academy_id: academyId,
      class_id: cls.id,
      exam_date: date,
      name,
      eval_type: evalType,
      memo,
      created_at: at(date, 9),
      updated_at: at(date, 9),
    })
    exam.subjects.forEach((s) =>
      subjectRows.push({
        id: s.id,
        exam_id: examId,
        name: s.name,
        max_score: s.max,
        created_at: at(date, 9),
        updated_at: at(date, 9),
      }),
    )
    exam.grades.forEach((g) =>
      gradeRows.push({
        id: g.id,
        exam_id: examId,
        label: g.label,
        order: g.order,
        created_at: at(date, 9),
        updated_at: at(date, 9),
      }),
    )

    // 응시자: 시험일에 재원 중이던(입학 후, 휴원/퇴원 전) 같은 반 학생, 약 4%는 결시
    const absentRate = kind === 'sr' ? 0.03 : 0.04
    const eligible = studentsByClass
      .get(cls.id)
      .filter((s) => s.enrolledAt <= date && (!s.leftAt || date < s.leftAt) && !chance(absentRate))

    eligible.forEach((s) => {
      const part = { id: randomUUID(), studentId: s.id, scores: {} }
      exam.parts.push(part)

      let comment = null
      if (kind === 'monthly' && chance(0.22)) comment = pick(TEACHER_COMMENTS[s.type])
      participantRows.push({
        id: part.id,
        exam_id: examId,
        student_id: s.id,
        student_name_snapshot: s.name,
        teacher_comment: comment,
        created_at: at(date, 20),
        updated_at: at(date, 20),
      })

      exam.subjects.forEach((subject) => {
        let score = null
        let gradeId = null
        let pct = null

        if (kind === 'sr') {
          score = srFor(s, Math.floor(monthIdx / 3))
          pct = score
        } else if (evalType === 'grade') {
          pct = pctFor(s, subject.name, monthIdx)
          const label = gradeLabelOf(pct)
          gradeId = exam.grades.find((g) => g.label === label).id
        } else if (chance(0.012)) {
          score = null // 점수 미입력
        } else if (evalType === 'score_max') {
          pct = pctFor(s, subject.name, monthIdx)
          score = clamp(Math.round((pct / 100) * subject.max), 0, subject.max)
          pct = (score / subject.max) * 100
        } else {
          pct = pctFor(s, subject.name, monthIdx)
          score = Math.round(pct)
          pct = score
        }

        part.scores[subject.name] = {
          subjectId: subject.id,
          score,
          gradeId,
          pct,
          rowIndex: scoreRows.length,
        }
        scoreRows.push({
          id: randomUUID(),
          participant_id: part.id,
          subject_id: subject.id,
          score,
          grade_id: gradeId,
          created_at: at(date, 20),
          updated_at: at(date, 20),
        })
      })
    })
    return exam
  }

  classes.forEach((cls, classIdx) => {
    const lv = LEVELS[cls.level]
    for (let month = 3; month <= 9; month++) {
      // 월말평가: 매달 4째 주 (반마다 하루씩 다르게)
      buildExam({
        cls,
        month,
        kind: 'monthly',
        date: toWeekday(`2026-${pad(month)}-${pad(23 + (classIdx % 4))}`),
      })
      // 단원평가: 4·6·8월
      if ([4, 6, 8].includes(month)) {
        buildExam({
          cls,
          month,
          kind: 'unit',
          date: toWeekday(`2026-${pad(month)}-${pad(12 + (classIdx % 5))}`),
        })
      }
      // S.R. 레벨테스트: 3·6·9월
      if ([3, 6, 9].includes(month)) {
        buildExam({
          cls,
          month,
          kind: 'sr',
          date: toWeekday(`2026-${pad(month)}-${pad(9 + (classIdx % 4))}`),
        })
      }
      // 단어 등급평가: Kids/Basic만 5·7·9월
      if (lv.wordGrade && [5, 7, 9].includes(month)) {
        buildExam({
          cls,
          month,
          kind: 'word',
          date: toWeekday(`2026-${pad(month)}-${pad(17 + (classIdx % 3))}`),
        })
      }
    }
  })

  // 엣지 케이스: 8월 월말평가 단어 시험에서 보완 학생 2명이 0점
  let zeroCount = 0
  for (const exam of exams) {
    if (zeroCount >= 2) break
    if (exam.kind !== 'monthly' || exam.monthIdx !== 5) continue
    for (const part of exam.parts) {
      const cell = part.scores['단어']
      if (cell && cell.score !== null && studentById.get(part.studentId).type === '보완') {
        cell.score = 0
        cell.pct = 0
        scoreRows[cell.rowIndex].score = 0
        zeroCount++
        break
      }
    }
  }

  await insertChunked(queryInterface, 'exams', examRows)
  await insertChunked(queryInterface, 'exam_subjects', subjectRows)
  await insertChunked(queryInterface, 'exam_grades', gradeRows)
  await insertChunked(queryInterface, 'exam_participants', participantRows)
  await insertChunked(queryInterface, 'exam_scores', scoreRows)

  // ---------------------------------------------------------------
  // 5. student_counselings
  //    ⚠ target ENUM은 '학생' / '학부모'만 허용
  // ---------------------------------------------------------------
  const counselingRows = []
  const addCounseling = (s, date, target, content, note) => {
    const cls = s.classId ? classById.get(s.classId) : null
    counselingRows.push({
      id: randomUUID(),
      student_id: s.id,
      counseling_date: date,
      target,
      counselor_name: cls ? cls.teacher : '김선주',
      content,
      note,
      created_at: at(date, 17, intBetween(0, 50)),
      updated_at: at(date, 17, intBetween(0, 50)),
    })
  }
  const weakSubjectOf = (s) => {
    const lv = s.classId ? LEVELS[classById.get(s.classId).level] : LEVELS.Basic
    return pick(lv.monthly)
  }
  const counselDate = (s) => {
    const from = s.enrolledAt > '2026-03-05' ? addDays(s.enrolledAt, 7) : '2026-03-05'
    const to = s.leftAt ? addDays(s.leftAt, -3) : '2026-09-30'
    return from < to ? toWeekday(randomDate(from, to)) : toWeekday(from)
  }
  const normalCounsel = (s) => {
    const target = chance(0.5) ? '학부모' : '학생'
    const fn = pick(target === '학부모' ? PARENT_COUNSEL : STUDENT_COUNSEL)
    return [target, fn(s.name, weakSubjectOf(s))]
  }

  // 일반 상담: 재원 학생 약 60%에게 1~3건
  const heavyTargets = students.filter(
    (s) => s.status === '재원' && s.classId && s.enrolledAt < '2026-03-01',
  )
  const heavyA = heavyTargets[10] // 13건 (페이지네이션 확인용)
  const heavyB = heavyTargets[40] // 11건
  students.forEach((s) => {
    if (s === heavyA || s === heavyB) return
    if (s.status === '재원' && chance(0.6)) {
      const count = weighted([
        [1, 5],
        [2, 3],
        [3, 1],
      ])
      const dates = Array.from({ length: count }, () => counselDate(s)).sort()
      dates.forEach((date) => {
        const [target, content] = normalCounsel(s)
        addCounseling(s, date, target, content, chance(0.3) ? pick(COUNSEL_NOTES) : null)
      })
    }
    if (s.status === '휴원' || s.status === '퇴원') {
      if (chance(0.6)) {
        const date = counselDate(s)
        const [target, content] = normalCounsel(s)
        addCounseling(s, date, target, content, null)
      }
      // 휴원/퇴원 직전 상담
      addCounseling(
        s,
        addDays(s.leftAt, -intBetween(2, 10)),
        '학부모',
        pick(LEAVE_COUNSEL[s.status]),
        '휴원/퇴원 처리 완료',
      )
    }
  })
  ;[
    [heavyA, 13],
    [heavyB, 11],
  ].forEach(([s, count]) => {
    for (let i = 0; i < count; i++) {
      const date = toWeekday(
        addDays('2026-03-09', Math.round((i * 200) / count) + intBetween(0, 4)),
      )
      const [target, content] = normalCounsel(s)
      addCounseling(s, date, target, content, chance(0.3) ? pick(COUNSEL_NOTES) : null)
    }
  })
  await insertChunked(queryInterface, 'student_counselings', counselingRows)

  // ---------------------------------------------------------------
  // 6. sms_templates
  // ---------------------------------------------------------------
  await queryInterface.bulkInsert(
    'sms_templates',
    SMS_TEMPLATES.map((t, i) => ({
      id: randomUUID(),
      academy_id: academyId,
      name: t.name,
      content: t.content,
      is_default: t.isDefault,
      created_at: at(`2026-03-0${i + 2}`, 10),
      updated_at: at(`2026-03-0${i + 2}`, 10),
    })),
  )

  // ---------------------------------------------------------------
  // 7. reports (저장 시점 스냅샷)
  // ---------------------------------------------------------------
  const partsByStudent = new Map()
  exams.forEach((exam) => {
    exam.parts.forEach((part) => {
      if (!partsByStudent.has(part.studentId)) partsByStudent.set(part.studentId, [])
      partsByStudent.get(part.studentId).push({ exam, part })
    })
  })
  const examAverage = (exam, subjectName) =>
    avg1(
      exam.parts
        .map((p) => p.scores[subjectName])
        .filter((c) => c && c.score !== null)
        .map((c) => Number(c.score)),
    )

  function subjectTier(name, values, student) {
    if (values.length === 0) return '보통'
    const last = values[values.length - 1]
    if (name === 'S.R.') {
      const gradeNum = Number(student.grade.slice(1))
      if (last - gradeNum >= 1.0) return '우수'
      if (values.length > 1 && last - values[0] >= 0.4) return '상승'
      if (last - gradeNum <= -1.2) return '보완'
      return '보통'
    }
    const prev = values.slice(-4, -1)
    const prevMean = prev.length ? prev.reduce((s, v) => s + v, 0) / prev.length : null
    if (last >= 88) return '우수'
    if (prevMean !== null && last - prevMean >= 4) return '상승'
    if (last <= 62 || (prevMean !== null && last - prevMean <= -4)) return '보완'
    return '보통'
  }

  const reportRows = []
  const shareLinkRows = []
  const reportMeta = [] // SMS 로그용
  const activeInClass = students.filter((s) => s.status === '재원' && s.classId)
  // 반마다 2명 + 추가 6명 = 30명
  const reportTargets = []
  classes.forEach((cls) => {
    shuffle(
      activeInClass.filter(
        (s) => s.classId === cls.id && (partsByStudent.get(s.id) || []).length >= 8,
      ),
    )
      .slice(0, 2)
      .forEach((s) => reportTargets.push(s))
  })
  shuffle(
    activeInClass.filter(
      (s) => !reportTargets.includes(s) && (partsByStudent.get(s.id) || []).length >= 8,
    ),
  )
    .slice(0, 6)
    .forEach((s) => reportTargets.push(s))

  reportTargets.forEach((student) => {
    const cls = classById.get(student.classId)
    const lv = LEVELS[cls.level]
    // 리포트 생성일: 8/25 ~ 10/2 (최근일수록 많이)
    const reportDate = weighted([
      [randomDate('2026-08-25', '2026-09-14'), 4],
      [randomDate('2026-09-15', '2026-09-27'), 5],
      [randomDate('2026-09-28', '2026-10-02'), 6],
    ])

    // 과목 선택: 월말평가 과목 일부(+ 가끔 S.R. / 단원평가)
    let subjectNames = shuffle(lv.monthly).slice(0, intBetween(3, lv.monthly.length))
    if (chance(0.33)) subjectNames.push('S.R.')
    if (chance(0.2)) subjectNames.push(`${lv.books[1]} 단원평가`)

    // 최근 10회 응시 기록(reportDate 이전)
    const history = (partsByStudent.get(student.id) || [])
      .filter((x) => x.exam.date <= reportDate)
      .sort((a, b) => (a.exam.date < b.exam.date ? 1 : a.exam.date > b.exam.date ? -1 : 0))
      .slice(0, 10)
      .reverse()

    const trend = {}
    const pctTrend = {}
    subjectNames.forEach((name) => {
      trend[name] = history
        .filter((x) => x.part.scores[name])
        .map((x) => {
          const cell = x.part.scores[name]
          return {
            examId: x.exam.id,
            examDate: x.exam.date,
            score: cell.score === null ? null : Number(cell.score),
            pct: cell.pct,
          }
        })
    })
    subjectNames = subjectNames.filter(
      (name) => trend[name].filter((t) => t.score !== null).length >= 2,
    )
    if (subjectNames.length === 0) return
    subjectNames.forEach((name) => {
      pctTrend[name] = trend[name].filter((t) => t.pct !== null).map((t) => t.pct)
    })

    const examIds = [...new Set(subjectNames.flatMap((name) => trend[name].map((t) => t.examId)))]
    const examById = new Map(exams.map((e) => [e.id, e]))

    // 단일 발송(60%)은 기준 시험이 있고, 일괄 발송(40%)은 기준 시험이 없다
    let baseExam = null
    if (chance(0.6)) {
      const monthlyExams = [...history]
        .reverse()
        .filter((x) => x.exam.kind === 'monthly' && examIds.includes(x.exam.id))
      if (monthlyExams.length) baseExam = monthlyExams[0].exam
    }

    const subjectStats = {}
    subjectNames.forEach((name) => {
      let personalVsExamAverage = null
      if (baseExam) {
        const myCell = baseExam.parts.find((p) => p.studentId === student.id)?.scores[name]
        let rank = null
        if (myCell && myCell.score !== null) {
          const higher = baseExam.parts.filter((p) => {
            const c = p.scores[name]
            return c && c.score !== null && Number(c.score) > Number(myCell.score)
          }).length
          rank = higher + 1
        }
        personalVsExamAverage = {
          score: myCell && myCell.score !== null ? Number(myCell.score) : null,
          examAverage: examAverage(baseExam, name),
          subjectRank: rank,
        }
      }
      subjectStats[name] = {
        personalVsExamAverage,
        recent10: trend[name].map(({ examId, examDate, score }) => ({ examId, examDate, score })),
        classAverageRecent10: trend[name].map((t) => ({
          examId: t.examId,
          examDate: t.examDate,
          average: examAverage(examById.get(t.examId), name),
        })),
      }
    })

    // AI 피드백 (과목별) / 선생님 피드백 (전체)
    const tiers = {}
    const aiFeedback = {}
    subjectNames.forEach((name) => {
      const tier = subjectTier(
        name,
        name === 'S.R.'
          ? trend[name].map((t) => t.score).filter((v) => v !== null)
          : pctTrend[name],
        student,
      )
      tiers[name] = tier
      aiFeedback[name] = fill(AI_FEEDBACK[subjectKey(name)][tier], student.name)
    })
    const tierCount = {}
    Object.values(tiers).forEach((t) => {
      tierCount[t] = (tierCount[t] || 0) + 1
    })
    const topTier = Object.entries(tierCount).sort((a, b) => b[1] - a[1])[0][0]
    const overallTier = tierCount[student.type] === tierCount[topTier] ? student.type : topTier
    const teacherFeedback = chance(0.3)
      ? null
      : fill(pick(TEACHER_FEEDBACK[overallTier]), student.name)

    const reportId = randomUUID()
    const createdAt = at(reportDate, intBetween(14, 21), intBetween(0, 59))
    reportRows.push({
      id: reportId,
      academy_id: academyId,
      student_id: student.id,
      exam_ids: JSON.stringify(examIds),
      subject_names: JSON.stringify(subjectNames),
      subject_stats: JSON.stringify(subjectStats),
      ai_feedback: JSON.stringify(aiFeedback),
      teacher_feedback: teacherFeedback === null ? null : JSON.stringify(teacherFeedback),
      created_at: createdAt,
      updated_at: createdAt,
    })

    // 공유 링크: 리포트의 약 80%, 유효기간 14일 (오래된 건 이미 만료됨)
    if (chance(0.8)) {
      const linkId = randomUUID()
      const linkCreated = new Date(createdAt.getTime() + intBetween(5, 60) * 60 * 1000)
      const expires = new Date(linkCreated.getTime() + 14 * 24 * 60 * 60 * 1000)
      shareLinkRows.push({
        id: linkId,
        report_id: reportId,
        token: randomBytes(24).toString('hex'),
        expires_at: expires,
        created_at: linkCreated,
        updated_at: linkCreated,
      })
      reportMeta.push({ student, linkId, linkCreated })
    }
  })
  await insertChunked(queryInterface, 'reports', reportRows)
  await insertChunked(queryInterface, 'report_share_links', shareLinkRows)

  // ---------------------------------------------------------------
  // 8. sms_send_logs — 리포트 링크 발송 + 일반 안내 문자
  // ---------------------------------------------------------------
  const smsRows = []
  const addSms = ({ student, message, linkId, sentAt, status }) => {
    smsRows.push({
      id: randomUUID(),
      academy_id: academyId,
      student_id: student.id,
      student_name_snapshot: student.name,
      recipient_phone: student.parentPhone,
      message,
      report_share_link_id: linkId,
      sent_at: sentAt,
      status,
      created_at: sentAt,
      updated_at: sentAt,
    })
  }
  reportMeta.forEach(({ student, linkId, linkCreated }) => {
    const sentAt = new Date(linkCreated.getTime() + intBetween(1, 30) * 60 * 1000)
    const message = fill(SMS_TEMPLATES[0].content, student.name)
    const ok = !chance(0.1)
    addSms({
      student,
      message,
      linkId,
      sentAt: sentAt > now ? now : sentAt,
      status: ok ? '성공' : '실패',
    })
    if (!ok && chance(0.6)) {
      // 실패 후 재발송
      const retry = new Date(sentAt.getTime() + intBetween(20, 600) * 60 * 1000)
      addSms({ student, message, linkId, sentAt: retry > now ? now : retry, status: '성공' })
    }
  })
  const smsTargets = students.filter((s) => s.status !== '퇴원')
  for (let i = 0; i < 50; i++) {
    const student = pick(smsTargets)
    const template = pick(SMS_TEMPLATES.slice(1))
    const day = toWeekday(randomDate('2026-08-03', TODAY))
    addSms({
      student,
      message: fill(template.content, student.name),
      linkId: null,
      sentAt: at(day, intBetween(9, 19), intBetween(0, 59)),
      status: chance(0.07) ? '실패' : '성공',
    })
  }
  await insertChunked(queryInterface, 'sms_send_logs', smsRows)
}

async function down(queryInterface) {
  // academies를 지우면 ON DELETE CASCADE로 연결된
  // users / classes / students / exams / exam_subjects / exam_grades /
  // exam_participants / exam_scores / reports / report_share_links /
  // sms_send_logs / sms_templates / student_counselings 가 전부 함께 삭제됩니다.
  // platform_admins는 0002-platform-admin.js가 별도로 관리하므로 여기서 건드리지 않습니다.
  await queryInterface.bulkDelete('academies', { slug: 'tomato' })
}

module.exports = { up, down }
