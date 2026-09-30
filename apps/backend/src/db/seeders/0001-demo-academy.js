/**
 * 티타임(T-Time) 데모/개발용 시드 데이터 — 학원(hanbit) 데이터
 * -----------------------------------------------------
 * 기준 문서: 03_티타임_테이블정의서_v1.2.md, claude/티타임_디렉토리구조_v1.2.md
 * 규모: 학원 1개 / 학생 80명 (재원 65 · 휴원 10 · 퇴원 5)
 *
 * ⚠ 원본(팀원 작성본) 대비 수정 사항
 *   1) student_counselings.target: '보호자' → '학부모'
 *      (0016-apply-table-spec-v1.2.js에서 이미 ENUM 값이 '학부모'로 변경됨.
 *       실제 레포 StudentCounseling.js 모델도 ENUM('학생','학부모')만 허용 — '보호자'로 넣으면
 *       invalid input value for enum 에러가 남)
 *   2) reports.ai_feedback: 순수 텍스트 문자열 → {과목명: 피드백} 형태의 JSON 객체로 변경
 *      (0016에서 TEXT → JSON으로 이미 변환됨. 실제 레포 Report.js 모델도 JSON.
 *       텍스트를 그대로 넣으면 invalid input syntax for type json 에러 위험)
 *   3) reports.teacher_feedback: 컬럼이 0016에서 추가됐는데 누락되어 있었음 → 명시적으로 null 추가
 *   4) report_share_links.expires_at: 7일 → 14일(2주)로 수정
 *      (테이블정의서 v1.2 12번 항목 + constants/policy.js "공유 링크 유효기간 14일")
 *   5) 이 파일은 학원(academies) 관련 데이터만 담당합니다. platform_admins는
 *      0002-platform-admin.js로 분리했습니다 — 디렉토리구조_v1.2.md 계획대로,
 *      이 파일은 데모 데이터 "주기적 초기화용"이라 자주 undo/재실행되는데,
 *      한 파일에 platform_admins까지 같이 있으면 초기화할 때마다 운영자 계정도
 *      지워졌다 다시 생겨서 운영자 로그인/이력이 끊깁니다.
 *
 * 실행 명령어 (레포 루트에 seed alias가 없어 backend workspace 지정 필요)
 *   npm run seed --workspace=apps/backend
 *   (내부적으로 sequelize-cli db:seed:all 실행 — seeders 폴더의 모든 시더를 순서대로 실행)
 *
 * 되돌리기(삭제) — 다시 실행하기 전에 꼭 먼저 지워주세요, 안 그러면 학원이 중복 생성됩니다
 *   npx sequelize-cli db:seed:undo --seed 0001-demo-academy.js
 *
 * 데모 로그인 정보
 *   학원 관리자: admin@hanbit.kr / Ttime1234!
 */

'use strict'

const bcrypt = require('bcrypt')
const { randomUUID, randomBytes } = require('crypto')

async function up(queryInterface) {
  const now = new Date()
  const passwordHash = bcrypt.hashSync('Ttime1234!', 10)

  // ---------------------------------------------------------------
  // 1. academies (1개)
  // ---------------------------------------------------------------
  const academyId = randomUUID()
  await queryInterface.bulkInsert('academies', [
    {
      id: academyId,
      name: '한빛영어학원',
      slug: 'hanbit',
      business_number: '123-45-67890',
      owner_name: '김선주',
      logo_url: null,
      phone: '02-1234-5678',
      address: '서울특별시 강남구 테헤란로 123',
      sms_sender_number: '01012345678',
      subscription_status: 'FREE',
      subscribed_at: null,
      is_demo: true,
      deleted_at: null,
      created_at: now,
      updated_at: now,
    },
  ])

  // ---------------------------------------------------------------
  // 2. users (학원 관리자 계정 1개)
  // ---------------------------------------------------------------
  await queryInterface.bulkInsert('users', [
    {
      id: randomUUID(),
      academy_id: academyId,
      name: '김선주',
      email: 'admin@hanbit.kr',
      password_hash: passwordHash,
      created_at: now,
      updated_at: now,
    },
  ])

  // ---------------------------------------------------------------
  // 3. classes (5개)
  // ---------------------------------------------------------------
  const classDefs = [
    { name: '초급반 A', teacher: '박민지' },
    { name: '초급반 B', teacher: '이현우' },
    { name: '중급반 A', teacher: '최수진' },
    { name: '중급반 B', teacher: '정다은' },
    { name: '고급반', teacher: '한지훈' },
  ]
  const classIds = classDefs.map(() => randomUUID())
  await queryInterface.bulkInsert(
    'classes',
    classDefs.map((c, i) => ({
      id: classIds[i],
      academy_id: academyId,
      name: c.name,
      teacher_name: c.teacher,
      created_at: now,
      updated_at: now,
    })),
  )

  // ---------------------------------------------------------------
  // 4. students (80명: 재원 65 / 휴원 10 / 퇴원 5)
  // ---------------------------------------------------------------
  const lastNames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임']
  const firstNames = [
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
  const schools = ['한빛초등학교', '서울초등학교', '강남초등학교', '대치초등학교', '도곡초등학교']
  const gradeLabelsForStudents = ['1학년', '2학년', '3학년', '4학년', '5학년', '6학년']

  const students = []
  for (let i = 0; i < 80; i++) {
    let status = '재원'
    if (i >= 65 && i < 75) status = '휴원'
    if (i >= 75) status = '퇴원'

    // 10명은 반 미배정(class_id = null) 상태로 남겨서 화면에서 테스트 가능하게 함
    const classId = i % 8 === 7 ? null : classIds[i % classIds.length]

    students.push({
      id: randomUUID(),
      name: lastNames[i % lastNames.length] + firstNames[(i * 3 + 1) % firstNames.length],
      status,
      classId,
    })
  }

  await queryInterface.bulkInsert(
    'students',
    students.map((s, i) => ({
      id: s.id,
      academy_id: academyId,
      name: s.name,
      class_id: s.classId,
      status: s.status,
      school: schools[i % schools.length],
      grade: gradeLabelsForStudents[i % gradeLabelsForStudents.length],
      parent_phone: `010-${String(1000 + i).padStart(4, '0')}-${String(5000 + i).padStart(4, '0')}`,
      enrolled_at: '2026-03-02',
      created_at: now,
      updated_at: now,
    })),
  )

  // ---------------------------------------------------------------
  // 5. student_counselings (재원 학생 25명에게 1건씩)
  //    ⚠ target ENUM은 '학생' / '학부모'만 허용 (구 값 '보호자' 사용 금지)
  // ---------------------------------------------------------------
  const counselingTargets = students.filter((s) => s.status === '재원').slice(0, 25)
  await queryInterface.bulkInsert(
    'student_counselings',
    counselingTargets.map((s, i) => ({
      id: randomUUID(),
      student_id: s.id,
      counseling_date: '2026-09-10',
      target: i % 3 === 0 ? '학부모' : '학생',
      counselor_name: classDefs[i % classDefs.length].teacher,
      content: `${s.name} 학생의 학습 태도 및 진도 관련 정기 상담 내용입니다.`,
      note: i % 4 === 0 ? '학부모 요청으로 추가 상담 예정' : null,
      created_at: now,
      updated_at: now,
    })),
  )

  // ---------------------------------------------------------------
  // 6. exams (6개: score 2 / score_max 2 / grade 2)
  // ---------------------------------------------------------------
  const examDefs = [
    { name: '8월 정기고사', evalType: 'score', date: '2026-08-05' },
    { name: '9월 정기고사', evalType: 'score', date: '2026-09-05' },
    { name: 'SR 모의고사 1회', evalType: 'score_max', date: '2026-08-20' },
    { name: 'SR 모의고사 2회', evalType: 'score_max', date: '2026-09-20' },
    { name: '단어시험 등급평가 1회', evalType: 'grade', date: '2026-08-15' },
    { name: '단어시험 등급평가 2회', evalType: 'grade', date: '2026-09-15' },
  ]

  const examIds = examDefs.map(() => randomUUID())
  await queryInterface.bulkInsert(
    'exams',
    examDefs.map((e, i) => ({
      id: examIds[i],
      academy_id: academyId,
      class_id: classIds[i % classIds.length],
      exam_date: e.date,
      name: e.name,
      eval_type: e.evalType,
      memo: null,
      created_at: now,
      updated_at: now,
    })),
  )

  // ---------------------------------------------------------------
  // 7. exam_subjects (시험당 2~3과목)
  // ---------------------------------------------------------------
  const subjectPool = ['리딩', '문법', '어휘', '듣기', '말하기']
  const examSubjects = []
  examDefs.forEach((e, i) => {
    const subjectCount = i % 2 === 0 ? 2 : 3
    for (let j = 0; j < subjectCount; j++) {
      examSubjects.push({
        id: randomUUID(),
        examId: examIds[i],
        name: subjectPool[j % subjectPool.length],
        maxScore: e.evalType === 'score_max' ? 50 : null,
      })
    }
  })
  await queryInterface.bulkInsert(
    'exam_subjects',
    examSubjects.map((s) => ({
      id: s.id,
      exam_id: s.examId,
      name: s.name,
      max_score: s.maxScore,
      created_at: now,
      updated_at: now,
    })),
  )

  // ---------------------------------------------------------------
  // 8. exam_grades (grade 타입 시험 2개 × 5등급)
  // ---------------------------------------------------------------
  const gradeLabelsList = ['A', 'B', 'C', 'D', 'F']
  const gradeExamIds = examDefs
    .map((e, i) => (e.evalType === 'grade' ? examIds[i] : null))
    .filter((v) => v !== null)

  const examGrades = []
  gradeExamIds.forEach((examId) => {
    gradeLabelsList.forEach((label, order) => {
      examGrades.push({ id: randomUUID(), examId, label, order: order + 1 })
    })
  })
  await queryInterface.bulkInsert(
    'exam_grades',
    examGrades.map((g) => ({
      id: g.id,
      exam_id: g.examId,
      label: g.label,
      order: g.order,
      created_at: now,
      updated_at: now,
    })),
  )

  // ---------------------------------------------------------------
  // 9. exam_participants (시험당 재원 학생 30~40명 응시)
  // ---------------------------------------------------------------
  const activeStudents = students.filter((s) => s.status === '재원')
  const participants = []

  examDefs.forEach((e, i) => {
    const count = 30 + (i % 3) * 5 // 30, 35, 40 반복
    for (let k = 0; k < count && k < activeStudents.length; k++) {
      const student = activeStudents[(k + i * 7) % activeStudents.length]
      participants.push({
        id: randomUUID(),
        examId: examIds[i],
        studentId: student.id,
        name: student.name,
      })
    }
  })

  await queryInterface.bulkInsert(
    'exam_participants',
    participants.map((p, i) => ({
      id: p.id,
      exam_id: p.examId,
      student_id: p.studentId,
      student_name_snapshot: p.name,
      teacher_comment: i % 5 === 0 ? '이번 시험에서 특히 어휘 영역이 향상되었습니다.' : null,
      created_at: now,
      updated_at: now,
    })),
  )

  // ---------------------------------------------------------------
  // 10. exam_scores (응시자 × 해당 시험 과목 수)
  // ---------------------------------------------------------------
  const examScores = []
  participants.forEach((p, i) => {
    const examIndex = examIds.indexOf(p.examId)
    const evalType = examDefs[examIndex].evalType
    const subjectsForExam = examSubjects.filter((s) => s.examId === p.examId)
    const gradesForExam = examGrades.filter((g) => g.examId === p.examId)

    subjectsForExam.forEach((subject, j) => {
      let score = null
      let gradeId = null

      if (evalType === 'score') {
        score = Math.round((40 + ((i * 7 + j * 13) % 60)) * 10) / 10 // 40.0~99.9
      } else if (evalType === 'score_max') {
        const max = subject.maxScore || 50
        score = Math.round((((i * 5 + j * 11) % (max * 10 + 1)) / 10) * 10) / 10 // 0~max
      } else if (evalType === 'grade' && gradesForExam.length > 0) {
        gradeId = gradesForExam[(i + j) % gradesForExam.length].id
      }

      examScores.push({
        id: randomUUID(),
        participant_id: p.id,
        subject_id: subject.id,
        score,
        grade_id: gradeId,
        created_at: now,
        updated_at: now,
      })
    })
  })
  await queryInterface.bulkInsert('exam_scores', examScores)

  // ---------------------------------------------------------------
  // 11. sms_templates (2개, 1개는 기본값)
  // ---------------------------------------------------------------
  await queryInterface.bulkInsert('sms_templates', [
    {
      id: randomUUID(),
      academy_id: academyId,
      name: '성적표 안내 (기본)',
      content:
        '안녕하세요, {학생명} 학부모님. 이번 시험 성적표가 도착했습니다.\n아래 링크에서 확인해주세요.\n{리포트링크}',
      is_default: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: randomUUID(),
      academy_id: academyId,
      name: '상담 예약 안내',
      content:
        '안녕하세요, {학생명} 학생 상담 일정 관련하여 안내드립니다. 담당 선생님께 문의 부탁드립니다.',
      is_default: false,
      created_at: now,
      updated_at: now,
    },
  ])

  // ---------------------------------------------------------------
  // 12. reports (6개)
  //     ⚠ ai_feedback / teacher_feedback은 0016에서 JSON 컬럼으로 변경됨
  //        → {과목명: 피드백} 형태의 JSON 객체로 저장 (순수 텍스트 금지)
  // ---------------------------------------------------------------
  const reportTargets = activeStudents.slice(0, 6)
  const reportIds = reportTargets.map(() => randomUUID())
  await queryInterface.bulkInsert(
    'reports',
    reportTargets.map((s, i) => {
      const relatedExamIds = examIds.slice(0, 2 + (i % 2))
      const relatedSubjectNames = subjectPool.slice(0, 2 + (i % 2))

      const aiFeedback =
        i % 2 === 0
          ? JSON.stringify(
              relatedSubjectNames.reduce((acc, subjectName) => {
                acc[subjectName] =
                  `${s.name} 학생은 ${subjectName} 영역에서 최근 꾸준한 향상을 보이고 있습니다.`
                return acc
              }, {}),
            )
          : null

      return {
        id: reportIds[i],
        academy_id: academyId,
        student_id: s.id,
        exam_ids: JSON.stringify(relatedExamIds),
        subject_names: JSON.stringify(relatedSubjectNames),
        ai_feedback: aiFeedback,
        teacher_feedback: null,
        created_at: now,
        updated_at: now,
      }
    }),
  )

  // ---------------------------------------------------------------
  // 13. report_share_links (reports 중 3개)
  //     ⚠ 유효기간 14일(2주) — 테이블정의서 v1.2 / policy.js 기준
  // ---------------------------------------------------------------
  const shareLinkTargets = reportIds.slice(0, 3)
  const shareLinkIds = shareLinkTargets.map(() => randomUUID())
  const expiresAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
  await queryInterface.bulkInsert(
    'report_share_links',
    shareLinkTargets.map((reportId, i) => ({
      id: shareLinkIds[i],
      report_id: reportId,
      token: randomBytes(24).toString('hex'),
      expires_at: expiresAt,
      created_at: now,
      updated_at: now,
    })),
  )

  // ---------------------------------------------------------------
  // 14. sms_send_logs (18건, 일부는 공유링크 연결)
  // ---------------------------------------------------------------
  const smsTargets = activeStudents.slice(0, 18)
  await queryInterface.bulkInsert(
    'sms_send_logs',
    smsTargets.map((s, i) => ({
      id: randomUUID(),
      academy_id: academyId,
      student_id: s.id,
      student_name_snapshot: s.name,
      recipient_phone: `010-${String(1000 + i).padStart(4, '0')}-${String(5000 + i).padStart(4, '0')}`,
      message: `안녕하세요, ${s.name} 학부모님. 이번 시험 성적표가 도착했습니다.`,
      report_share_link_id: i < shareLinkIds.length ? shareLinkIds[i] : null,
      sent_at: now,
      status: i % 9 === 0 ? '실패' : '성공',
      created_at: now,
      updated_at: now,
    })),
  )
}

async function down(queryInterface) {
  // academies를 지우면 ON DELETE CASCADE로 연결된
  // users / classes / students / exams / exam_subjects / exam_grades /
  // exam_participants / exam_scores / reports / report_share_links /
  // sms_send_logs / sms_templates 가 전부 함께 삭제됩니다.
  // platform_admins는 0002-platform-admin.js가 별도로 관리하므로 여기서 건드리지 않습니다.
  await queryInterface.bulkDelete('academies', { slug: 'hanbit' })
}

module.exports = { up, down }
