const { Op } = require('sequelize')
const db = require('../db/models')
const crypto = require('crypto')
const examStatsService = require('./examStatsService')
const aiFeedbackService = require('./aiFeedbackService')
const smsService = require('./smsService')

const RECENT_TREND_LIMIT = 10 // 리포트는 학생 성적탭(6회)과 다르게 "최근 10회" 기준
const SHARE_LINK_TTL_MS = 14 * 24 * 60 * 60 * 1000 // 2주
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL

const PHONE_PATTERN = /^01[016789]-?\d{3,4}-?\d{4}$/

function throwError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  throw error
}

// 리포트 미리보기 — 단일 흐름: 이 시험 하나를 기준으로 리포트 미리보기 생성
async function previewSingle({ academy, student, examId, subscribed }) {
  const targetParticipant = await db.ExamParticipant.findOne({
    where: { studentId: student.id, examId },
    include: [
      {
        model: db.Exam,
        where: { academyId: academy.id },
        include: [{ model: db.ExamSubject }],
      },
      { model: db.ExamScore },
    ],
  })

  if (!targetParticipant) {
    throwError(404, '학생이 해당 시험의 응시자가 아닙니다.')
  }

  const exam = targetParticipant.Exam
  if (exam.evalType === 'grade') {
    throwError(422, '등급형 시험은 리포트를 생성할 수 없습니다.')
  }

  const subjectNames = exam.ExamSubjects.map((subject) => subject.name)

  // 같은 시험의 반 전체 응시자 (석차·반평균 계산용)
  const allParticipants = await db.ExamParticipant.findAll({
    where: { examId },
    include: [{ model: db.ExamScore }],
  })

  const withScoresBySubject = allParticipants.map((participant) => ({
    participantId: participant.id,
    scoresBySubject: new Map(participant.ExamScores.map((score) => [score.subjectId, score])),
  }))

  const { ranked, classAverageTotal } = examStatsService.computeTotals({
    isGradeExam: false,
    examSubjects: exam.ExamSubjects,
    participants: withScoresBySubject,
  })
  const subjectStatsThisExam = examStatsService.computeSubjectStats({
    examSubjects: exam.ExamSubjects,
    participants: withScoresBySubject,
  })

  const mine = ranked.find((p) => p.participantId === targetParticipant.id)
  const myScoresBySubject = new Map(
    targetParticipant.ExamScores.map((score) => [score.subjectId, score]),
  )

  const resultsRows = exam.ExamSubjects.map((subject) => {
    const myScore = myScoresBySubject.get(subject.id)
    const stats = subjectStatsThisExam.get(subject.id)
    const myRank = stats
      ? stats.ranks.find((rank) => rank.participantId === targetParticipant.id)
      : null

    return {
      subjectName: subject.name,
      score: myScore ? myScore.score : null,
      gradeLabel: null,
      maxScore: subject.maxScore,
      classAverage: stats ? stats.average : null,
      subjectRank: myRank ? myRank.rank : null,
    }
  })

  const maxScoreTotal =
    exam.evalType === 'score_max'
      ? exam.ExamSubjects.reduce(
          (sum, subject) => sum + (subject.maxScore ? Number(subject.maxScore) : 0),
          0,
        )
      : null

  const resultsTable = {
    rows: resultsRows,
    total: {
      score: mine ? mine.total : null,
      maxScoreTotal,
      classAverage: classAverageTotal,
      rank: mine ? mine.rank : null,
    },
  }

  const shared = await buildTrendAndFeedback({ academy, student, subjectNames, subscribed })

  // 단일 흐름만 personalVsExamAverage를 채운다 (이 시험 기준 개인점수 vs 시험평균)
  subjectNames.forEach((subjectName) => {
    const subject = exam.ExamSubjects.find((s) => s.name === subjectName)
    const myScore = myScoresBySubject.get(subject.id)
    const stats = subjectStatsThisExam.get(subject.id)
    const myRank = stats
      ? stats.ranks.find((rank) => rank.participantId === targetParticipant.id)
      : null

    shared.subjectStats[subjectName].personalVsExamAverage = {
      score: myScore ? myScore.score : null,
      examAverage: stats ? stats.average : null,
      subjectRank: myRank ? myRank.rank : null,
    }
  })

  return {
    studentId: student.id,
    studentName: student.name,
    className: student.Class ? student.Class.name : null,
    examId: exam.id,
    subjectNames,
    examIds: shared.examIds,
    resultsTable,
    subjectStats: shared.subjectStats,
    aiSubjectFeedback: shared.aiSubjectFeedback,
    aiOverallFeedback: shared.aiOverallFeedback,
    subscribed,
    linkExpiresAt: shared.linkExpiresAt,
  }
}

// 리포트 미리보기 — 일괄 흐름: 과목명 목록을 기준으로 리포트 미리보기 생성
// (특정 시험 하나가 아니라 "최근 10회" 전체가 대상)
async function previewBulk({ academy, student, subjectNames, subscribed }) {
  const recentSubjectNames = await examStatsService.getRecentExamSubjectNames({
    academyId: academy.id,
    studentId: student.id,
    limit: RECENT_TREND_LIMIT,
  })

  const resolvedSubjectNames = subjectNames.filter((name) => recentSubjectNames.has(name))

  if (resolvedSubjectNames.length === 0) {
    throwError(422, '선택한 과목 중 이 학생이 응시한 과목이 하나도 없습니다.')
  }

  const shared = await buildTrendAndFeedback({
    academy,
    student,
    subjectNames: resolvedSubjectNames,
    subscribed,
  })

  return {
    studentId: student.id,
    studentName: student.name,
    className: student.Class ? student.Class.name : null,
    examId: null,
    subjectNames: resolvedSubjectNames,
    examIds: shared.examIds,
    resultsTable: null,
    subjectStats: shared.subjectStats,
    aiSubjectFeedback: shared.aiSubjectFeedback,
    aiOverallFeedback: shared.aiOverallFeedback,
    subscribed,
    linkExpiresAt: shared.linkExpiresAt,
  }
}

// 리포트 미리보기
async function preview({ academyId, studentId, examId, subjectNames }) {
  const hasExamId = Boolean(examId)
  const hasSubjectNames = Array.isArray(subjectNames) && subjectNames.length > 0

  if (hasExamId === hasSubjectNames) {
    throwError(400, 'examId와 subjectNames 중 정확히 하나를 보내야 합니다.')
  }

  const academy = await db.Academy.findOne({ where: { id: academyId, deletedAt: null } })
  if (!academy) {
    throwError(401, '유효하지 않은 토큰입니다.')
  }

  const student = await db.Student.findOne({
    where: { id: studentId, academyId },
    include: [{ model: db.Class, attributes: ['id', 'name'], required: false }],
  })
  if (!student) {
    throwError(404, '학생을 찾을 수 없습니다.')
  }

  const subscribed = academy.subscriptionStatus === 'SUBSCRIBED'

  if (hasExamId) {
    return previewSingle({ academy, student, examId, subscribed })
  }

  return previewBulk({ academy, student, subjectNames, subscribed })
}

/**
 * 단일·일괄 흐름이 공통으로 쓰는 부분
 * [ 추이(recent10) + 반평균 추이 + AI 피드백 + 링크 만료 예정일 ]
 *
 * subjectStats는 여기서 "틀"만 만들고 (personalVsExamAverage는 항상 null),
 * 단일 흐름 쪽에서 자기 값으로 덮어쓴다. (일괄 흐름은 애초에 null이 맞는 값이라 덮어쓸 필요 없음)
 */
async function buildTrendAndFeedback({ academy, student, subjectNames, subscribed }) {
  const trendBySubjectName = await examStatsService.getRecentTrendByStudent({
    academyId: academy.id,
    studentId: student.id,
    subjectNames,
    limit: RECENT_TREND_LIMIT,
  })

  const recentExamIds = [
    ...new Set(
      [...trendBySubjectName.values()].flatMap((history) => history.map((entry) => entry.examId)),
    ),
  ]

  const classAveragesByExam = await examStatsService.getClassAveragesBySubjectName({
    examIds: recentExamIds,
  })

  const subjectStats = {}
  subjectNames.forEach((subjectName) => {
    const personalHistory = trendBySubjectName.get(subjectName) || []
    const classAverageHistory = personalHistory.map((entry) => ({
      examId: entry.examId,
      examDate: entry.examDate,
      average: classAveragesByExam.get(entry.examId)?.get(subjectName) ?? null,
    }))

    subjectStats[subjectName] = {
      personalVsExamAverage: null,
      recent10: personalHistory,
      classAverageRecent10: classAverageHistory,
    }
  })

  let aiSubjectFeedback = null
  let aiOverallFeedback = null

  if (subscribed) {
    const feedbackEntries = await Promise.all(
      subjectNames.map(async (subjectName) => [
        subjectName,
        await aiFeedbackService.generateSubjectFeedback({
          subjectName,
          trendHistory: trendBySubjectName.get(subjectName) || [],
        }),
      ]),
    )
    aiSubjectFeedback = Object.fromEntries(feedbackEntries)
    aiOverallFeedback = await aiFeedbackService.generateOverallFeedback({
      studentName: student.name,
      subjectFeedbacks: aiSubjectFeedback,
    })
  }

  const linkExpiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 2주 뒤

  return {
    subjectStats,
    examIds: recentExamIds,
    aiSubjectFeedback,
    aiOverallFeedback,
    linkExpiresAt,
  }
}

// examIds 기준 subjectStats 스냅샷 계산 (저장 시점에 딱 한 번 호출)
async function buildSubjectStatsSnapshot({ academy, student, examId, examIds, subjectNames }) {
  const trendBySubjectName = await examStatsService.getTrendByExamIds({
    studentId: student.id,
    examIds,
    subjectNames,
  })
  const classAveragesByExam = await examStatsService.getClassAveragesBySubjectName({ examIds })

  const subjectRankByName = examId
    ? await computeSubjectRanksForExam({ academyId: academy.id, studentId: student.id, examId })
    : new Map()

  const subjectStats = {}
  subjectNames.forEach((subjectName) => {
    const personalHistory = trendBySubjectName.get(subjectName) || []
    const classAverageHistory = personalHistory.map((entry) => ({
      examId: entry.examId,
      examDate: entry.examDate,
      average: classAveragesByExam.get(entry.examId)?.get(subjectName) ?? null,
    }))

    let personalVsExamAverage = null
    if (examId) {
      const targetEntry = personalHistory.find((entry) => entry.examId === examId)
      personalVsExamAverage = {
        score: targetEntry ? targetEntry.score : null,
        examAverage: classAveragesByExam.get(examId)?.get(subjectName) ?? null,
        subjectRank: subjectRankByName.get(subjectName) ?? null,
      }
    }

    subjectStats[subjectName] = {
      personalVsExamAverage,
      recent10: personalHistory,
      classAverageRecent10: classAverageHistory,
    }
  })

  return subjectStats
}

// 특정 시험에서 이 학생의 "과목별 석차"만 계산한다. (create 시점에 examId가 있을 때만 호출)
async function computeSubjectRanksForExam({ academyId, studentId, examId }) {
  const targetParticipant = await db.ExamParticipant.findOne({
    where: { studentId, examId },
    include: [{ model: db.Exam, where: { academyId }, include: [{ model: db.ExamSubject }] }],
  })
  if (!targetParticipant) return new Map()

  const exam = targetParticipant.Exam

  const allParticipants = await db.ExamParticipant.findAll({
    where: { examId },
    include: [{ model: db.ExamScore }],
  })
  const withScoresBySubject = allParticipants.map((participant) => ({
    participantId: participant.id,
    scoresBySubject: new Map(participant.ExamScores.map((score) => [score.subjectId, score])),
  }))

  const subjectStatsThisExam = examStatsService.computeSubjectStats({
    examSubjects: exam.ExamSubjects,
    participants: withScoresBySubject,
  })

  const rankBySubjectName = new Map()
  exam.ExamSubjects.forEach((subject) => {
    const stats = subjectStatsThisExam.get(subject.id)
    const myRank = stats
      ? stats.ranks.find((rank) => rank.participantId === targetParticipant.id)
      : null
    rankBySubjectName.set(subject.name, myRank ? myRank.rank : null)
  })

  return rankBySubjectName
}

// 리포트 생성
async function create({
  academyId,
  studentId,
  examId, // 단일 흐름이면 값 있고, 일괄 흐름이면 undefined
  examIds,
  subjectNames,
  teacherFeedback,
  aiFeedback,
  transaction,
}) {
  const requiredFields = { studentId, examIds, subjectNames }
  const missingField = Object.entries(requiredFields).find(([, value]) => !value)
  if (missingField) {
    throwError(400, `${missingField[0]}은(는) 필수입니다.`)
  }

  if (!Array.isArray(examIds) || examIds.length === 0) {
    throwError(400, 'examIds는 비어있지 않은 배열이어야 합니다.')
  }

  if (!Array.isArray(subjectNames) || subjectNames.length === 0) {
    throwError(400, 'subjectNames는 비어있지 않은 배열이어야 합니다.')
  }

  const academy = await db.Academy.findOne({ where: { id: academyId, deletedAt: null } })
  if (!academy) {
    throwError(401, '유효하지 않은 토큰입니다.')
  }

  const student = await db.Student.findOne({ where: { id: studentId, academyId } })
  if (!student) {
    throwError(404, '학생을 찾을 수 없습니다.')
  }

  // examIds가 전부 "이 학원 소속" 시험인지 검증 (다른 학원 시험 id 끼워넣기 방지)
  const validExamCount = await db.Exam.count({ where: { id: examIds, academyId } })
  if (validExamCount !== examIds.length) {
    throwError(400, '유효하지 않은 examId가 포함되어 있습니다.')
  }

  // 추가: examId가 있으면 examIds 안에 포함된 값이어야 함
  if (examId && !examIds.includes(examId)) {
    throwError(400, 'examId는 examIds에 포함되어 있어야 합니다.')
  }

  const subscribed = academy.subscriptionStatus === 'SUBSCRIBED'

  const subjectStats = await buildSubjectStatsSnapshot({
    academy,
    student,
    examId,
    examIds,
    subjectNames,
  })

  const report = await db.Report.create(
    {
      academyId,
      studentId,
      examIds,
      subjectNames,
      subjectStats,
      teacherFeedback: teacherFeedback ?? null,
      aiFeedback: subscribed ? (aiFeedback ?? null) : null,
    },
    { transaction },
  )

  return {
    id: report.id,
    studentId: report.studentId,
    subjectNames: report.subjectNames,
    createdAt: report.createdAt,
  }
}

// 리포트 일괄 생성 흐름 2단계(과목선택)용 과목 목록 API
// 여러 학생이 각자 최근 10회 응시한 시험의 과목명을 중복 없이 합쳐서 반환 (일괄 생성 ② 과목 선택 단계용)
async function getSubjectOptions({ academyId, studentIds }) {
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    throwError(400, 'studentIds는 비어있지 않은 배열이어야 합니다.')
  }

  const academy = await db.Academy.findOne({ where: { id: academyId, deletedAt: null } })
  if (!academy) {
    throwError(401, '유효하지 않은 토큰입니다.')
  }

  // studentIds가 전부 이 학원 소속인지 검증
  const validStudentCount = await db.Student.count({ where: { id: studentIds, academyId } })
  if (validStudentCount !== studentIds.length) {
    throwError(400, '유효하지 않은 studentId가 포함되어 있습니다.')
  }

  const subjectNameSets = await Promise.all(
    studentIds.map((studentId) =>
      examStatsService.getRecentExamSubjectNames({
        academyId,
        studentId,
        limit: RECENT_TREND_LIMIT,
      }),
    ),
  )

  const merged = new Set()
  subjectNameSets.forEach((set) => set.forEach((name) => merged.add(name)))

  return [...merged].sort((a, b) => a.localeCompare(b, 'ko'))
}

// 리포트 목록 조회
async function list({ academyId, page, size, q }) {
  const pageNum = Number(page) > 0 ? Number(page) : 1
  const sizeNum = Number(size) > 0 ? Number(size) : 10

  const { count, rows } = await db.Report.findAndCountAll({
    where: { academyId },
    include: [
      {
        model: db.Student,
        attributes: ['id', 'name'],
        required: true,
        where: q ? { name: { [Op.iLike]: `%${q}%` } } : undefined,
      },
    ],
    order: [['createdAt', 'DESC']],
    limit: sizeNum,
    offset: (pageNum - 1) * sizeNum,
    distinct: true,
  })

  const reportIds = rows.map((report) => report.id)
  const shareLinks = await db.ReportShareLink.findAll({
    where: { reportId: reportIds },
    order: [['createdAt', 'DESC']],
  })

  const latestLinkByReport = new Map()
  shareLinks.forEach((link) => {
    if (!latestLinkByReport.has(link.reportId)) {
      latestLinkByReport.set(link.reportId, link)
    }
  })

  const now = new Date()
  const reports = rows.map((report) => {
    const latest = latestLinkByReport.get(report.id)
    let shareLinkStatus = '없음'
    if (latest) {
      shareLinkStatus = latest.expiresAt > now ? '유효' : '만료됨'
    }

    return {
      id: report.id,
      studentId: report.studentId,
      studentName: report.Student.name,
      subjectCount: report.subjectNames.length,
      createdAt: report.createdAt,
      shareLinkStatus,
      shareLinkExpiresAt: latest ? latest.expiresAt : null,
    }
  })

  return { reports, count, page: pageNum, size: sizeNum }
}

// 리포트 상세 조회 — 저장 시점 스냅샷을 그대로 반환 (재계산 없음)
async function getById({ academyId, reportId }) {
  const academy = await db.Academy.findOne({ where: { id: academyId, deletedAt: null } })
  if (!academy) {
    throwError(401, '유효하지 않은 토큰입니다.')
  }

  const report = await db.Report.findOne({
    where: { id: reportId, academyId },
    include: [
      {
        model: db.Student,
        attributes: ['id', 'name'],
        include: [{ model: db.Class, attributes: ['id', 'name'], required: false }],
      },
    ],
  })
  if (!report) {
    throwError(404, '리포트를 찾을 수 없습니다.')
  }

  const subscribed = academy.subscriptionStatus === 'SUBSCRIBED'

  const latestLink = await db.ReportShareLink.findOne({
    where: { reportId: report.id },
    order: [['createdAt', 'DESC']],
  })

  return {
    id: report.id,
    studentId: report.studentId,
    studentName: report.Student.name,
    className: report.Student.Class ? report.Student.Class.name : null,
    subjectNames: report.subjectNames,
    examIds: report.examIds,
    subjectStats: report.subjectStats,
    teacherFeedback: report.teacherFeedback,
    aiFeedback: subscribed ? report.aiFeedback : null,
    subscribed,
    shareLink: latestLink
      ? {
          url: buildShareUrl(latestLink.token),
          expiresAt: latestLink.expiresAt,
          expired: latestLink.expiresAt <= new Date(),
        }
      : null,
    createdAt: report.createdAt,
  }
}

// 리포트 공유 링크 URL 조립
function buildShareUrl(token) {
  return `${FRONTEND_BASE_URL}/share/${token}`
}

// 리포트 공유 링크 생성: 만료 안 된 기존 링크가 있으면 재사용, 없으면 새로 발급
async function createShareLink({ academyId, reportId, transaction }) {
  const academy = await db.Academy.findOne({ where: { id: academyId, deletedAt: null } })
  if (!academy) {
    throwError(401, '유효하지 않은 토큰입니다.')
  }

  const report = await db.Report.findOne({ where: { id: reportId, academyId } })
  if (!report) {
    throwError(404, '리포트를 찾을 수 없습니다.')
  }

  const now = new Date()

  const existing = await db.ReportShareLink.findOne({
    where: { reportId },
    order: [['createdAt', 'DESC']],
    transaction,
  })

  if (existing && existing.expiresAt > now) {
    return {
      isNew: false,
      shareLink: {
        id: existing.id,
        token: existing.token,
        url: buildShareUrl(existing.token),
        expiresAt: existing.expiresAt,
      },
    }
  }

  const token = crypto.randomBytes(32).toString('hex')
  const created = await db.ReportShareLink.create(
    {
      reportId,
      token,
      expiresAt: new Date(now.getTime() + SHARE_LINK_TTL_MS),
    },
    { transaction },
  )

  return {
    isNew: true,
    shareLink: {
      id: created.id,
      token: created.token,
      url: buildShareUrl(created.token),
      expiresAt: created.expiresAt,
    },
  }
}

// 일괄 생성 결과 중 선택한 리포트들을 저장 + 공유 링크 생성 (하나의 트랜잭션)
async function createBulk({ academyId, reports }) {
  if (!Array.isArray(reports) || reports.length === 0) {
    throwError(400, 'reports는 비어있지 않은 배열이어야 합니다.')
  }

  return db.sequelize.transaction(async (transaction) => {
    const created = []

    for (const item of reports) {
      const { studentId, examIds, subjectNames, teacherFeedback, aiFeedback } = item

      const savedReport = await create({
        academyId,
        studentId,
        examIds,
        subjectNames,
        teacherFeedback,
        aiFeedback,
        transaction,
        // examId는 안 넘김 — 일괄 흐름은 항상 undefined
      })

      const student = await db.Student.findOne({
        where: { id: studentId, academyId },
        transaction,
      })

      const { shareLink } = await createShareLink({
        academyId,
        reportId: savedReport.id,
        transaction,
      })

      created.push({
        id: savedReport.id,
        studentId: savedReport.studentId,
        studentName: student.name,
        parentPhone: student.parentPhone,
        shareLink: {
          url: shareLink.url,
          expiresAt: shareLink.expiresAt,
        },
      })
    }

    return created
  })
}

// 리포트 상세 — 선생님 피드백 수정 (유일하게 수정 가능한 필드)
async function update({ academyId, reportId, teacherFeedback }) {
  if (teacherFeedback === undefined) {
    throwError(400, 'teacherFeedback은 필수입니다.')
  }

  const academy = await db.Academy.findOne({ where: { id: academyId, deletedAt: null } })
  if (!academy) {
    throwError(401, '유효하지 않은 토큰입니다.')
  }

  const report = await db.Report.findOne({ where: { id: reportId, academyId } })
  if (!report) {
    throwError(404, '리포트를 찾을 수 없습니다.')
  }

  await report.update({ teacherFeedback })

  return {
    id: report.id,
    teacherFeedback: report.teacherFeedback,
  }
}

// 리포트 SMS 발송 (단일/다중 공용) — items 길이가 1이면 단일 발송
async function send({ academyId, items }) {
  if (!Array.isArray(items) || items.length === 0) {
    throwError(400, 'items는 비어있지 않은 배열이어야 합니다.')
  }

  const academy = await db.Academy.findOne({ where: { id: academyId, deletedAt: null } })
  if (!academy) {
    throwError(401, '유효하지 않은 토큰입니다.')
  }

  if (!academy.smsSenderNumber) {
    throwError(400, '학원 발신번호가 등록되지 않았습니다.')
  }

  const results = []

  for (const item of items) {
    const { reportId, recipientPhone, message } = item

    try {
      if (!PHONE_PATTERN.test(recipientPhone)) {
        throwError(400, '수신번호 형식 오류')
      }

      const report = await db.Report.findOne({
        where: { id: reportId, academyId },
        include: [{ model: db.Student, attributes: ['id', 'name'] }],
      })
      if (!report) {
        throwError(404, '리포트를 찾을 수 없습니다.')
      }

      // 유효한 공유 링크가 없으면(만료 포함) createShareLink가 알아서 새로 만들어줌
      const { shareLink } = await createShareLink({ academyId, reportId })
      const fullMessage = `${message}\n${shareLink.url}`

      let status = '성공'
      let failReason = null

      // if 블록은 데모 계정일 경우 건너뛰고 '성공'으로 로그만 남긴다.
      if (!academy.isDemo) {
        try {
          await smsService.sendOne({
            to: recipientPhone,
            from: academy.smsSenderNumber,
            text: fullMessage,
          })
        } catch (smsError) {
          status = '실패'
          failReason = smsError.message
        }
      }

      const log = await db.SmsSendLog.create({
        academyId,
        studentId: report.studentId,
        studentNameSnapshot: report.Student.name,
        recipientPhone,
        message: fullMessage,
        reportShareLinkId: shareLink.id,
        sentAt: new Date(),
        status,
      })

      results.push({
        reportId,
        status,
        messageLogId: log.id,
        ...(failReason ? { reason: failReason } : {}),
      })
    } catch (err) {
      // 수신번호 형식 오류, 리포트 없음 등 — 로그를 만들 만한 정보(studentId 등)가 부족해 로그 없이 실패만 기록
      results.push({ reportId, status: '실패', reason: err.message })
    }
  }

  const successCount = results.filter((r) => r.status === '성공').length
  return { results, message: `${items.length}건 중 ${successCount}건 발송 완료` }
}

async function batchPreview({ academyId, studentIds, subjectNames }) {
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    throwError(400, 'studentIds는 비어있지 않은 배열이어야 합니다.')
  }
  if (!Array.isArray(subjectNames) || subjectNames.length === 0) {
    throwError(400, 'subjectNames는 비어있지 않은 배열이어야 합니다.')
  }

  const academy = await db.Academy.findOne({ where: { id: academyId, deletedAt: null } })
  if (!academy) {
    throwError(401, '유효하지 않은 토큰입니다.')
  }

  const students = await db.Student.findAll({ where: { id: studentIds, academyId } })
  if (students.length !== studentIds.length) {
    throwError(400, '유효하지 않은 studentId가 포함되어 있습니다.')
  }

  const studentsById = new Map(students.map((student) => [student.id, student]))

  const candidates = await Promise.all(
    studentIds.map(async (studentId) => {
      const student = studentsById.get(studentId)
      const recentSubjectNames = await examStatsService.getRecentExamSubjectNames({
        academyId,
        studentId,
        limit: RECENT_TREND_LIMIT,
      })
      const availableSubjects = subjectNames.filter((name) => recentSubjectNames.has(name))

      return {
        studentId,
        studentName: student.name,
        availableSubjects,
        generatable: availableSubjects.length > 0,
      }
    }),
  )

  const generatableCount = candidates.filter((c) => c.generatable).length

  return { candidates, generatableCount }
}

module.exports = {
  preview,
  create,
  list,
  getById,
  createShareLink,
  update,
  send,
  getSubjectOptions,
  batchPreview,
  createBulk,
}
