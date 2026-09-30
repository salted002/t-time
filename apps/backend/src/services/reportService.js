const db = require('../db/models')
const examStatsService = require('./examStatsService')
const aiFeedbackService = require('./aiFeedbackService')

const RECENT_TREND_LIMIT = 10 // 리포트는 학생 성적탭(6회)과 다르게 "최근 10회" 기준

function throwError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  throw error
}

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
    shared.subjectStats[subjectName].personalVsExamAverage = {
      score: myScore ? myScore.score : null,
      examAverage: stats ? stats.average : null,
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

async function create({
  academyId,
  studentId,
  examIds,
  subjectNames,
  teacherFeedback,
  aiFeedback,
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

  const subscribed = academy.subscriptionStatus === 'SUBSCRIBED'

  const report = await db.Report.create({
    academyId,
    studentId,
    examIds,
    subjectNames,
    teacherFeedback: teacherFeedback ?? null,
    aiFeedback: subscribed ? (aiFeedback ?? null) : null,
  })

  return {
    id: report.id,
    studentId: report.studentId,
    subjectNames: report.subjectNames,
    createdAt: report.createdAt,
  }
}

const crypto = require('crypto')

const SHARE_LINK_TTL_MS = 14 * 24 * 60 * 60 * 1000 // 2주
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL

function buildShareUrl(token) {
  return `${FRONTEND_BASE_URL}/share/${token}`
}

async function createShareLink({ academyId, reportId }) {
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
  const created = await db.ReportShareLink.create({
    reportId,
    token,
    expiresAt: new Date(now.getTime() + SHARE_LINK_TTL_MS),
  })

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

module.exports = { preview, create, createShareLink }
