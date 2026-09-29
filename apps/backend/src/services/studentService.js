const { Op } = require('sequelize')
const db = require('../db/models')

const VALID_STATUSES = ['재원', '휴원', '퇴원']

function throwError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  throw error
}

function toDetailResponse(student) {
  return {
    id: student.id,
    name: student.name,
    school: student.school,
    grade: student.grade,
    classId: student.classId,
    className: student.Class ? student.Class.name : null,
    status: student.status,
    parentPhone: student.parentPhone,
    enrolledAt: student.enrolledAt,
  }
}

function findGradeLabel(exam, gradeId) {
  if (!gradeId) return null
  const grade = exam.ExamGrades.find((g) => g.id === gradeId)
  return grade ? grade.label : null
}

async function list({ academyId, classId, status, q, limit, offset }) {
  const where = { academyId }

  if (classId) {
    where.classId = classId
  }

  if (status) {
    const statuses = status
      .split(',')
      .map((value) => value.trim())
      .filter((value) => VALID_STATUSES.includes(value))
    if (statuses.length > 0) {
      where.status = { [Op.in]: statuses }
    }
  }

  if (q) {
    where.name = { [Op.iLike]: `%${q}%` }
  }

  const { rows, count } = await db.Student.findAndCountAll({
    where,
    include: [{ model: db.Class, attributes: ['id', 'name'], required: false }],
    order: [
      ['enrolledAt', 'DESC'],
      ['name', 'ASC'],
    ],
    limit,
    offset,
  })

  const students = rows.map((student) => ({
    id: student.id,
    name: student.name,
    classId: student.classId,
    className: student.Class ? student.Class.name : null,
    status: student.status,
    school: student.school,
    grade: student.grade,
    parentPhone: student.parentPhone,
    enrolledAt: student.enrolledAt,
  }))

  return { students, count }
}

async function create({
  academyId,
  name,
  classId,
  status,
  school,
  grade,
  parentPhone,
  enrolledAt,
}) {
  const academy = await db.Academy.findOne({ where: { id: academyId, deletedAt: null } })
  if (!academy) {
    throwError(400, '유효하지 않은 토큰입니다.')
  }

  const resolvedStatus = status || '재원'
  if (!VALID_STATUSES.includes(resolvedStatus)) {
    throwError(400, 'status 값이 올바르지 않습니다.')
  }

  const requiredFields = { name, school, grade, parentPhone }
  const missingField = Object.entries(requiredFields).find(([, value]) => !value)
  if (missingField) {
    throwError(400, `${missingField[0]}은(는) 필수입니다.`)
  }

  if (classId) {
    const studentClass = await db.Class.findOne({ where: { id: classId, academyId } })
    if (!studentClass) {
      throwError(400, '유효하지 않은 반입니다.')
    }
  }

  const student = await db.Student.create({
    academyId,
    name,
    classId: classId || null,
    status: resolvedStatus,
    school,
    grade,
    parentPhone,
    enrolledAt: enrolledAt || null,
  })

  return student
}

async function getById({ academyId, studentId }) {
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

  return toDetailResponse(student)
}

async function update({
  academyId,
  studentId,
  name,
  classId,
  status,
  school,
  grade,
  parentPhone,
  enrolledAt,
}) {
  const academy = await db.Academy.findOne({ where: { id: academyId, deletedAt: null } })
  if (!academy) {
    throwError(401, '유효하지 않은 토큰입니다.')
  }

  const resolvedStatus = status || '재원'
  if (!VALID_STATUSES.includes(resolvedStatus)) {
    throwError(400, 'status 값이 올바르지 않습니다.')
  }

  const requiredFields = { name, school, grade, parentPhone }
  const missingField = Object.entries(requiredFields).find(([, value]) => !value)
  if (missingField) {
    throwError(400, `${missingField[0]}은(는) 필수입니다.`)
  }

  const student = await db.Student.findOne({ where: { id: studentId, academyId } })
  if (!student) {
    throwError(404, '학생을 찾을 수 없습니다.')
  }

  if (classId) {
    const studentClass = await db.Class.findOne({ where: { id: classId, academyId } })
    if (!studentClass) {
      throwError(400, '유효하지 않은 반입니다.')
    }
  }

  await student.update({
    name,
    classId: classId || null,
    status: resolvedStatus,
    school,
    grade,
    parentPhone,
    enrolledAt: enrolledAt || null,
  })

  const updatedStudent = await db.Student.findOne({
    where: { id: studentId, academyId },
    include: [{ model: db.Class, attributes: ['id', 'name'], required: false }],
  })

  return toDetailResponse(updatedStudent)
}

async function remove({ academyId, studentId }) {
  const academy = await db.Academy.findOne({ where: { id: academyId, deletedAt: null } })
  if (!academy) {
    throwError(401, '유효하지 않은 토큰입니다.')
  }

  const student = await db.Student.findOne({ where: { id: studentId, academyId } })
  if (!student) {
    throwError(404, '학생을 찾을 수 없습니다.')
  }

  const deleted = { id: student.id, name: student.name }
  await student.destroy()

  return deleted
}

// 학생 상세 성적탭 — 시험 목록 조회 : GET /students/{studentId}/exam-results
async function getExamResults({ academyId, studentId, limit, offset }) {
  const student = await db.Student.findOne({ where: { id: studentId, academyId } })
  if (!student) {
    throwError(404, '학생을 찾을 수 없습니다.')
  }

  const { rows, count } = await db.ExamParticipant.findAndCountAll({
    where: { studentId },
    include: [
      {
        model: db.Exam,
        include: [
          { model: db.Class, attributes: ['id', 'name'], required: false },
          { model: db.ExamSubject },
        ],
      },
    ],
    order: [
      [db.Exam, 'examDate', 'DESC'],
      [db.Exam, 'createdAt', 'DESC'],
    ],
    limit,
    offset,
  })

  const examResults = rows.map((participant) => ({
    examId: participant.Exam.id,
    examDate: participant.Exam.examDate,
    className: participant.Exam.Class ? participant.Exam.Class.name : null,
    examName: participant.Exam.name,
    subjectCount: participant.Exam.ExamSubjects.length,
    evalType: participant.Exam.evalType,
    memo: participant.Exam.memo,
  }))

  return { examResults, count }
}

async function getExamResultDetail({ academyId, studentId, examId }) {
  const academy = await db.Academy.findOne({ where: { id: academyId, deletedAt: null } })
  if (!academy) {
    throwError(401, '유효하지 않은 토큰입니다.')
  }

  const student = await db.Student.findOne({ where: { id: studentId, academyId } })
  if (!student) {
    throwError(404, '학생을 찾을 수 없습니다.')
  }

  const targetParticipant = await db.ExamParticipant.findOne({
    where: { studentId, examId },
    include: [
      {
        model: db.Exam,
        where: { academyId },
        include: [
          { model: db.Class, attributes: ['id', 'name'], required: false },
          { model: db.ExamSubject },
          { model: db.ExamGrade },
        ],
      },
      { model: db.ExamScore },
    ],
  })

  if (!targetParticipant) {
    throwError(404, '응시 기록을 찾을 수 없습니다.')
  }

  const exam = targetParticipant.Exam
  const isGradeExam = exam.evalType === 'grade'

  const allParticipants = await db.ExamParticipant.findAll({
    where: { examId },
    include: [
      { model: db.Student, attributes: ['id', 'status'], required: false },
      { model: db.ExamScore },
    ],
  })

  const activeParticipants = allParticipants.filter(
    (participant) => !participant.Student || participant.Student.status === '재원',
  )

  const withTotals = activeParticipants.map((participant) => {
    const scoresBySubject = new Map(participant.ExamScores.map((score) => [score.subjectId, score]))
    const total = isGradeExam
      ? null
      : exam.ExamSubjects.reduce((sum, subject) => {
          const score = scoresBySubject.get(subject.id)
          return score && score.score !== null ? sum + Number(score.score) : sum
        }, 0)
    return { participantId: participant.id, total, scoresBySubject }
  })

  let myTotalRank = null
  let myTotal = null

  if (!isGradeExam) {
    const sorted = [...withTotals].sort((a, b) => b.total - a.total)
    let currentRank = 0
    let previousTotal = null

    sorted.forEach((p, index) => {
      if (p.total !== previousTotal) {
        currentRank = index + 1
        previousTotal = p.total
      }
      p.totalRank = `${currentRank}/${sorted.length}`
    })

    const mine = sorted.find((p) => p.participantId === targetParticipant.id)
    myTotalRank = mine ? mine.totalRank : null
    myTotal = mine ? mine.total : null
  }

  const subjectStats = new Map()

  if (!isGradeExam) {
    exam.ExamSubjects.forEach((subject) => {
      const values = withTotals
        .map((p) => {
          const score = p.scoresBySubject.get(subject.id)
          return score && score.score !== null
            ? { participantId: p.participantId, score: Number(score.score) }
            : null
        })
        .filter(Boolean)

      const sorted = [...values].sort((a, b) => b.score - a.score)
      let currentRank = 0
      let previousScore = null

      sorted.forEach((v, index) => {
        if (v.score !== previousScore) {
          currentRank = index + 1
          previousScore = v.score
        }
        v.rank = `${currentRank}/${sorted.length}`
      })

      const average = values.length
        ? Number((values.reduce((sum, v) => sum + v.score, 0) / values.length).toFixed(1))
        : null

      subjectStats.set(subject.id, { average, ranks: sorted })
    })
  }

  const myScoresBySubject = new Map(
    targetParticipant.ExamScores.map((score) => [score.subjectId, score]),
  )

  const results = exam.ExamSubjects.map((subject) => {
    const myScore = myScoresBySubject.get(subject.id)
    const stats = subjectStats.get(subject.id)
    const myRankEntry = stats
      ? stats.ranks.find((rank) => rank.participantId === targetParticipant.id)
      : null

    return {
      subjectId: subject.id,
      score: isGradeExam ? null : myScore ? myScore.score : null,
      gradeLabel: isGradeExam ? findGradeLabel(exam, myScore ? myScore.gradeId : null) : null,
      classAverage: stats ? stats.average : null,
      subjectRank: myRankEntry ? myRankEntry.rank : null,
    }
  })

  const maxScoreTotal =
    exam.evalType === 'score_max'
      ? exam.ExamSubjects.reduce(
          (sum, subject) => sum + (subject.maxScore ? Number(subject.maxScore) : 0),
          0,
        )
      : null

  const classAverageTotal =
    !isGradeExam && withTotals.length
      ? Number(
          (withTotals.reduce((sum, p) => sum + (p.total || 0), 0) / withTotals.length).toFixed(1),
        )
      : null

  let subjectComparison = null
  let recentTrend = null

  if (!isGradeExam) {
    subjectComparison = exam.ExamSubjects.map((subject) => {
      const myScore = myScoresBySubject.get(subject.id)
      const stats = subjectStats.get(subject.id)
      return {
        subjectId: subject.id,
        personalScore: myScore ? myScore.score : null,
        examAverage: stats ? stats.average : null,
      }
    })

    // 각 학생이 응시한 시험을 최신순으로 정렬하여 6개까지만 가져온다.
    const recentExamParticipants = await db.ExamParticipant.findAll({
      where: { studentId },
      include: [
        { model: db.Exam, where: { academyId }, include: [{ model: db.ExamSubject }] },
        { model: db.ExamScore },
      ],
      order: [[db.Exam, 'examDate', 'DESC']],
      limit: 6,
    })

    // 최신순 6개 시험을 거꾸로 정렬.
    const chronological = [...recentExamParticipants].reverse()

    /**
     * 시험 과목마다 "이름이 같은" 과목을 찾는다. (subjectId는 매번 다름)
     * .filter(Boolean)으로 null을 걸러낸다. (Boolean(null)은 false)
     * */
    recentTrend = exam.ExamSubjects.map((subject) => ({
      subjectId: subject.id,
      history: chronological
        .map((participant) => {
          const matchedSubject = participant.Exam.ExamSubjects.find((s) => s.name === subject.name)
          if (!matchedSubject) return null

          const score = participant.ExamScores.find((s) => s.subjectId === matchedSubject.id)
          return {
            examId: participant.Exam.id,
            examDate: participant.Exam.examDate,
            score: score ? score.score : null,
          }
        })
        .filter(Boolean),
    }))
  }

  return {
    examInfo: {
      examDate: exam.examDate,
      className: exam.Class ? exam.Class.name : null,
      examName: exam.name,
      evalType: exam.evalType,
      memo: exam.memo,
      subjectCount: exam.ExamSubjects.length,
      grades: exam.ExamGrades.map((grade) => ({
        id: grade.id,
        label: grade.label,
        order: grade.order,
      })),
    },
    participantId: targetParticipant.id,
    subjects: exam.ExamSubjects.map((subject) => ({
      subjectId: subject.id,
      name: subject.name,
      maxScore: subject.maxScore,
    })),
    results,
    total: {
      score: myTotal,
      maxScoreTotal,
      classAverage: classAverageTotal,
      rank: myTotalRank,
    },
    teacherComment: targetParticipant.teacherComment,
    subjectComparison,
    recentTrend,
    gradeDistribution: null,
  }
}

module.exports = { list, create, getById, update, remove, getExamResults, getExamResultDetail }
