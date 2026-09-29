const { Op } = require('sequelize')
const db = require('../db/models')

const VALID_EVAL_TYPES = ['score', 'score_max', 'grade']

function throwError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  throw error
}

async function list({ academyId, q, limit, offset }) {
  const where = { academyId }
  if (q) {
    where.name = { [Op.iLike]: `%${q}%` }
  }

  const { rows, count } = await db.Exam.findAndCountAll({
    where,
    include: [
      {
        model: db.Class,
        attributes: ['id', 'name'],
        required: false,
      },
    ],
    order: [
      ['examDate', 'DESC'],
      ['createdAt', 'DESC'],
    ],
    limit,
    offset,
  })
  const exams = await Promise.all(
    rows.map(async (exam) => {
      const participantCount = await db.ExamParticipant.count({
        where: { examId: exam.id },
      })
      return {
        id: exam.id,
        examDate: exam.examDate,
        name: exam.name,
        className: exam.Class ? exam.Class.name : null,
        participantCount,
        createdAt: exam.createdAt,
      }
    }),
  )

  return { exams, count }
}

async function create({ academyId, examDate, classId, name, subjects, evalType, grades, memo }) {
  const requiredFields = { examDate, classId, name, subjects, evalType }
  const missingField = Object.entries(requiredFields).find(([, value]) => !value)

  if (missingField) {
    throwError(400, `${missingField[0]}은(는) 필수입니다.`)
  }

  if (!VALID_EVAL_TYPES.includes(evalType)) {
    throwError(400, 'evalType 값이 올바르지 않습니다.')
  }

  if (!Array.isArray(subjects) || subjects.length === 0 || subjects.length > 7) {
    throwError(400, '시험 과목은 최소 1개, 최대 7개여야 합니다.')
  }

  const missingSubjectName = subjects.some((subject) => !subject.name)
  if (missingSubjectName) {
    throwError(400, '과목명은 필수로 입력해야 합니다.')
  }

  if (evalType === 'score_max') {
    const missingMaxScore = subjects.some(
      (subject) => subject.maxScore === undefined || subject.maxScore === null,
    )
    if (missingMaxScore) {
      throwError(400, '만점값은 필수로 입력해야 합니다.')
    }
  }

  if (evalType === 'grade') {
    if (!Array.isArray(grades) || grades.length === 0 || grades.length > 7) {
      throwError(400, '등급 라벨은 최소 1개, 최대 7개여야 합니다.')
    }
  }

  const academy = await db.Academy.findOne({
    where: { id: academyId, deletedAt: null },
  })
  if (!academy) {
    throwError(401, '유효하지 않은 토큰입니다.')
  }

  const examClass = await db.Class.findOne({ where: { id: classId, academyId } })
  if (!examClass) {
    throwError(400, '유효하지 않은 반입니다.')
  }

  const enrolledStudents = await db.Student.findAll({
    where: { academyId, classId, status: '재원' },
  })

  const result = await db.sequelize.transaction(async (t) => {
    const exam = await db.Exam.create(
      { academyId, classId, examDate, name, evalType, memo: memo || null },
      { transaction: t },
    )

    await db.ExamSubject.bulkCreate(
      subjects.map((subject) => ({
        examId: exam.id,
        name: subject.name,
        maxScore: evalType === 'score_max' ? subject.maxScore : null,
      })),
      { transaction: t },
    )

    if (evalType === 'grade') {
      await db.ExamGrade.bulkCreate(
        grades.map((label, index) => ({
          examId: exam.id,
          label,
          order: index + 1,
        })),
        { transaction: t },
      )
    }

    const participants = await db.ExamParticipant.bulkCreate(
      enrolledStudents.map((student) => ({
        examId: exam.id,
        studentId: student.id,
        studentNameSnapshot: student.name,
      })),
      { transaction: t, returning: true },
    )

    return { exam, participants }
  })

  return {
    id: result.exam.id,
    examDate: result.exam.examDate,
    name: result.exam.name,
    classId: result.exam.classId,
    evalType: result.exam.evalType,
    participantIds: result.participants.map((participant) => participant.id),
  }
}

module.exports = { list, create }
