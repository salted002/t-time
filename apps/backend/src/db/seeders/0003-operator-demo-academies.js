/**
 * 티타임(T-Time) 운영자 콘솔 시연용 학원 시더
 * -----------------------------------------------------
 * 운영자 콘솔(학원 목록)에서 "학생 수"가 다양하게 보이도록 학원 7개를 추가합니다.
 * 학원 정보는 필수 컬럼만 채우고, 학생은 이름·학교·학년·학부모 번호만 넣습니다. (모두 재원, 반 미배정)
 *
 * 0001-demo-academy.js(토마토영어학원, 주기적 초기화용)와 분리해서 관리합니다 —
 * 데모 학원을 undo/재실행해도 운영자 콘솔용 학원 데이터는 그대로 유지됩니다.
 *
 * 실행 명령어
 *   npm run seed --workspace=apps/backend   (sequelize-cli db:seed:all)
 *
 * 되돌리기(삭제)
 *   npx sequelize-cli db:seed:undo --seed 0003-operator-demo-academies.js
 *
 * 로그인 정보 (학원마다 관리자 1명)
 *   admin@{slug}.kr / Ttime1234!   예) admin@haneul.kr
 */

'use strict'

const bcrypt = require('bcrypt')
const { randomUUID } = require('crypto')

// [이름, slug, 대표자, 전화, 사업자번호, 재원 학생 수, 구독 여부, 가입일]
const ACADEMIES = [
  ['하늘영어학원', 'haneul', '이하늘', '0323451001', '214-81-10001', 8, false, '2026-03-12'],
  [
    '스마트잉글리시',
    'smart-english',
    '박지훈',
    '0323451002',
    '214-81-10002',
    13,
    false,
    '2026-04-02',
  ],
  ['별빛영어교습소', 'byeolbit', '정유진', '0323451003', '214-81-10003', 21, true, '2026-04-28'],
  ['위너스영어', 'winners', '최민석', '0323451004', '214-81-10004', 29, false, '2026-05-19'],
  ['글로벌키즈영어', 'global-kids', '강서윤', '0323451005', '214-81-10005', 44, true, '2026-06-24'],
  ['새싹영어학원', 'saessak', '윤재호', '0323451006', '214-81-10006', 58, false, '2026-07-15'],
  ['리딩플러스학원', 'readingplus', '한소연', '0323451007', '214-81-10007', 76, true, '2026-08-20'],
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
]
const SCHOOLS = ['햇살초', '푸른초', '누리초', '한솔초', '미래초', '샛별초']
const GRADES = ['초1', '초2', '초3', '초4', '초5', '초6']

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

async function up(queryInterface) {
  const rand = mulberry32(30031)
  const pick = (arr) => arr[Math.floor(rand() * arr.length)]
  const passwordHash = bcrypt.hashSync('Ttime1234!', 10)

  const academyRows = []
  const userRows = []
  const studentRows = []

  ACADEMIES.forEach(
    ([name, slug, owner, phone, businessNumber, studentCount, subscribed, joinedAt]) => {
      const academyId = randomUUID()
      const createdAt = new Date(`${joinedAt}T10:00:00+09:00`)
      academyRows.push({
        id: academyId,
        name,
        slug,
        business_number: businessNumber,
        owner_name: owner,
        logo_url: null,
        phone,
        address: null,
        sms_sender_number: null,
        subscription_status: subscribed ? 'SUBSCRIBED' : 'FREE',
        subscribed_at: subscribed ? new Date(createdAt.getTime() + 20 * 24 * 60 * 60 * 1000) : null,
        is_demo: false,
        deleted_at: null,
        created_at: createdAt,
        updated_at: createdAt,
      })
      userRows.push({
        id: randomUUID(),
        academy_id: academyId,
        name: owner,
        email: `admin@${slug}.kr`,
        password_hash: passwordHash,
        created_at: createdAt,
        updated_at: createdAt,
      })
      for (let i = 0; i < studentCount; i++) {
        const enrolledAt = new Date(
          createdAt.getTime() + Math.floor(rand() * 40) * 24 * 60 * 60 * 1000,
        )
        studentRows.push({
          id: randomUUID(),
          academy_id: academyId,
          name: pick(LAST_NAMES) + pick(FIRST_NAMES), // 이름 중복 허용
          class_id: null,
          status: '재원',
          school: pick(SCHOOLS),
          grade: pick(GRADES),
          parent_phone: `010${1000 + Math.floor(rand() * 9000)}${1000 + Math.floor(rand() * 9000)}`,
          enrolled_at: enrolledAt.toISOString().slice(0, 10),
          created_at: enrolledAt,
          updated_at: enrolledAt,
        })
      }
    },
  )

  await queryInterface.bulkInsert('academies', academyRows)
  await queryInterface.bulkInsert('users', userRows)
  await queryInterface.bulkInsert('students', studentRows)
}

async function down(queryInterface) {
  // academies 삭제 시 ON DELETE CASCADE로 users / students도 함께 삭제됩니다.
  await queryInterface.bulkDelete('academies', { slug: ACADEMIES.map((a) => a[1]) })
}

module.exports = { up, down }
