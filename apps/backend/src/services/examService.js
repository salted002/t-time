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

async function getById({ academyId, examId }) {
  const academy = await db.Academy.findOne({ where: { id: academyId, deletedAt: null } })
  if (!academy) {
    throwError(401, '유효하지 않은 토큰입니다.')
  }

  const exam = await db.Exam.findOne({
    where: { id: examId, academyId },
    include: [
      { model: db.Class, attributes: ['id', 'name'], require: false },
      { model: db.ExamSubject },
      { model: db.ExamGrade },
    ],
  })

  if (!exam) {
    throwError(404, '시험을 찾을 수 없습니다.')
  }

  const isGradeExam = exam.evalType === 'grade'

  const participants = await db.ExamParticipant.findAll({
    where: { examId },
    include: [
      { model: db.Student, attributes: ['id', 'name', 'status'], required: false },
      { model: db.ExamScore },
    ],
  })

  const activeParticipants = participants.filter(
    (participant) => !participant.Student || participant.Student.status === '재원',
  )

  const scored = activeParticipants.map((participant) => {
    const scoresBySubject = new Map(participant.ExamScores.map((score) => [score.subjectId, score]))

    const scores = exam.ExamSubjects.map((subject) => {
      const matchedScore = scoresBySubject.get(subject.id)
      return {
        subjectId: subject.id,
        score: matchedScore ? matchedScore.score : null,
        gradeId: matchedScore ? matchedScore.gradeId : null,
      }
    })

    const total = isGradeExam
      ? null
      : scores.reduce((sum, s) => (s.score !== null ? sum + Number(s.score) : sum), 0)

    return {
      participantId: participant.id,
      studentId: participant.studentId,
      studentName: participant.Student ? participant.Student.name : participant.studentNameSnapshot,
      scores,
      total,
      average: null,
      totalRank: null,
      teacherComment: participant.teacherComment,
    }
  })

  // 동점자일 경우 석차 처리: 공동 순위 + 다음 순위 건너뛰기
  if (!isGradeExam) {
    const sortedByTotal = [...scored].sort((a, b) => b.total - a.total)
    let currentRank = 0
    let previousTotal = null

    sortedByTotal.forEach((participant, index) => {
      if (participant.total !== previousTotal) {
        currentRank = index + 1
        previousTotal = participant.total
      }
      participant.totalRank = `${currentRank}/${sortedByTotal.length}`
      participant.average = exam.ExamSubjects.length
        ? Number((participant.total / exam.ExamSubjects.length).toFixed(1))
        : null
    })
  }

  const activeStudentIds = activeParticipants.map((p) => p.studentId).filter(Boolean)

  const excludedStudentRows = exam.classId
    ? await db.Student.findAll({
        where: {
          academyId,
          classId: exam.classId,
          status: '재원',
          id: { [Op.notIn]: activeStudentIds.length ? activeStudentIds : [null] },
        },
      })
    : []
  const classAverage = isGradeExam
    ? null
    : {
        bySubject: exam.ExamSubjects.map((subject) => {
          const values = scored
            .map((p) => p.scores.find((s) => s.subjectId === subject.id))
            .filter((s) => s && s.score !== null)
            .map((s) => Number(s.score))
          const average = values.length
            ? Number((values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(1))
            : null
          return { subjectId: subject.id, average }
        }),
        total: scored.length
          ? Number((scored.reduce((sum, p) => sum + (p.total || 0), 0) / scored.length).toFixed(1))
          : null,
      }
  return {
    id: exam.id,
    examDate: exam.examDate,
    classId: exam.classId,
    className: exam.Class ? exam.Class.name : null,
    name: exam.name,
    evalType: exam.evalType,
    memo: exam.memo,
    subjects: exam.ExamSubjects.map((subject) => ({
      id: subject.id,
      name: subject.name,
      maxScore: subject.maxScore,
    })),
    grades: exam.ExamGrades.map((grade) => ({
      id: grade.id,
      label: grade.label,
      order: grade.order,
    })),
    participants: scored,
    excludedStudents: excludedStudentRows.map((student) => ({
      studentId: student.id,
      name: student.name,
    })),
    classAverage,
  }
}

// 성적 입력 및 수정: PUT /exams/{examId}/results
async function saveResults({ academyId, examId, participants }) {
  if (!Array.isArray(participants)) {
    throwError(400, 'participants는 배열이어야 합니다.')
  }

  const academy = await db.Academy.findOne({ where: { id: academyId, deletedAt: null } })
  if (!academy) {
    throwError(401, '유효하지 않은 토큰입니다.')
  }

  const exam = await db.Exam.findOne({
    where: { id: examId, academyId },
    include: [{ model: db.ExamSubject }, { model: db.ExamGrade }],
  })
  if (!exam) {
    throwError(404, '시험을 찾을 수 없습니다.')
  }

  const isGradeExam = exam.evalType === 'grade'
  const validSubjectIds = new Set(exam.ExamSubjects.map((subject) => subject.id))
  const maxScoreBySubject = new Map(
    exam.ExamSubjects.map((subject) => [subject.id, subject.maxScore]),
  )
  const validGradeIds = new Set(exam.ExamGrades.map((grade) => grade.id))

  participants.forEach((item) => {
    if (!item.participantId && !item.studentId) {
      throwError(400, 'participantId 또는 studentId가 필요합니다.')
    }

    Object.entries(item.scores || {}).forEach(([subjectId, value]) => {
      if (!validSubjectIds.has(subjectId)) {
        throwError(400, '해당 시험에 없는 과목입니다.')
      }
      if (value === null) return

      if (isGradeExam) {
        if (!validGradeIds.has(value)) {
          throwError(400, '유효하지 않은 등급입니다.')
        }
        return
      }

      if (typeof value !== 'number' || value < 0) {
        throwError(400, '점수는 0 이상의 숫자여야 합니다.')
      }

      const maxScore = maxScoreBySubject.get(subjectId)
      if (exam.evalType === 'score_max' && maxScore !== null && value > Number(maxScore)) {
        throwError(400, '만점을 초과하는 점수입니다.')
      }
    })
  })

  const existingParticipants = await db.ExamParticipant.findAll({ where: { examId } })
  const existingById = new Map(
    existingParticipants.map((participant) => [participant.id, participant]),
  )

  participants.forEach((item) => {
    if (item.participantId && !existingById.has(item.participantId)) {
      throwError(400, '존재하지 않는 응시자입니다.')
    }
  })

  const incomingParticipantIds = new Set(
    participants.filter((item) => item.participantId).map((item) => item.participantId),
  )
  const toDelete = existingParticipants.filter(
    (participant) => !incomingParticipantIds.has(participant.id),
  )

  await db.sequelize.transaction(async (t) => {
    for (const participant of toDelete) {
      await db.ExamScore.destroy({ where: { participantId: participant.id }, transaction: t })
      await participant.destroy({ transaction: t })
    }

    for (const item of participants) {
      let participant

      if (item.participantId) {
        participant = existingById.get(item.participantId)
        await participant.update(
          { teacherComment: item.teacherComment ?? null },
          { transaction: t },
        )
        await db.ExamScore.destroy({ where: { participantId: participant.id }, transaction: t })
      } else {
        const student = await db.Student.findOne({ where: { id: item.studentId, academyId } })
        if (!student) {
          throwError(400, '유효하지 않은 학생입니다.')
        }

        participant = await db.ExamParticipant.create(
          {
            examId,
            studentId: student.id,
            studentNameSnapshot: student.name,
            teacherComment: item.teacherComment ?? null,
          },
          { transaction: t },
        )
      }

      const scoreRows = Object.entries(item.scores || {})
        .filter(([, value]) => value !== null)
        .map(([subjectId, value]) => ({
          participantId: participant.id,
          subjectId,
          score: isGradeExam ? null : value,
          gradeId: isGradeExam ? value : null,
        }))

      if (scoreRows.length > 0) {
        await db.ExamScore.bulkCreate(scoreRows, { transaction: t })
      }
    }
  })

  return { message: '저장되었습니다.' }
}

async function update({ academyId, examId, examDate, name, subjects, memo }) {
  const academy = await db.Academy.findOne({ where: { id: academyId, deletedAt: null } })
  if (!academy) {
    throwError(401, '유효하지 않은 토큰입니다.')
  }

  const exam = await db.Exam.findOne({
    where: { id: examId, academyId },
    include: [{ model: db.ExamSubject }],
  })
  if (!exam) {
    throwError(404, '시험을 찾을 수 없습니다.')
  }

  const updates = {}
  if (examDate !== undefined) updates.examDate = examDate
  if (name !== undefined) updates.name = name
  if (memo !== undefined) updates.memo = memo

  if (subjects !== undefined) {
    if (exam.evalType !== 'score_max') {
      throwError(400, '만점값은 점수(만점)형 시험만 수정할 수 있습니다.')
    }

    if (!Array.isArray(subjects)) {
      throwError(400, 'subjects는 배열이어야 합니다.')
    }

    const subjectById = new Map(exam.ExamSubjects.map((subject) => [subject.id, subject]))

    for (const item of subjects) {
      const subject = subjectById.get(item.subjectId)
      if (!subject) {
        throwError(400, '해당 시험에 없는 과목입니다.')
      }
      if (typeof item.maxScore !== 'number' || item.maxScore <= 0) {
        throwError(400, '만점값은 0보다 큰 숫자여야 합니다.')
      }

      const overMaxScore = await db.ExamScore.findOne({
        where: { subjectId: subject.id, score: { [Op.gt]: item.maxScore } },
      })
      if (overMaxScore) {
        throwError(400, '점수가 만점값을 초과합니다.')
      }
    }
  }

  await db.sequelize.transaction(async (t) => {
    if (Object.keys(updates).length > 0) {
      await exam.update(updates, { transaction: t })
    }

    if (subjects !== undefined) {
      for (const item of subjects) {
        await db.ExamSubject.update(
          { maxScore: item.maxScore },
          { where: { id: item.subjectId }, transaction: t },
        )
      }
    }
  })

  const updatedExam = await db.Exam.findOne({
    where: { id: examId },
    include: [
      { model: db.ExamSubject },
      { model: db.Class, attributes: ['id', 'name'], required: false },
    ],
  })

  return {
    id: updatedExam.id,
    examDate: updatedExam.examDate,
    classId: updatedExam.classId,
    className: updatedExam.Class ? updatedExam.Class.name : null,
    name: updatedExam.name,
    evalType: updatedExam.evalType,
    memo: updatedExam.memo,
    subjects: updatedExam.ExamSubjects.map((subject) => ({
      id: subject.id,
      name: subject.name,
      maxScore: subject.maxScore,
    })),
  }
}

async function updateParticipantComment({ academyId, examId, participantId, teacherComment }) {
  const academy = await db.Academy.findOne({ where: { id: academyId, deletedAt: null } })
  if (!academy) {
    throwError(401, '유효하지 않은 토큰입니다.')
  }

  const exam = await db.Exam.findOne({ where: { id: examId, academyId } })
  if (!exam) {
    throwError(404, '시험을 찾을 수 없습니다.')
  }

  const participant = await db.ExamParticipant.findOne({ where: { id: participantId, examId } })
  if (!participant) {
    throwError(404, '응시자를 찾을 수 없습니다.')
  }

  await participant.update({ teacherComment: teacherComment ?? null })

  return { participantId: participant.id, teacherComment: participant.teacherComment }
}

async function remove({ academyId, examId }) {
  const academy = await db.Academy.findOne({ where: { id: academyId, deletedAt: null } })
  if (!academy) {
    throwError(401, '유효하지 않은 토큰입니다.')
  }

  const exam = await db.Exam.findOne({ where: { id: examId, academyId } })
  if (!exam) {
    throwError(404, '시험을 찾을 수 없습니다.')
  }

  const participantIds = (
    await db.ExamParticipant.findAll({ where: { examId }, attributes: ['id'] })
  ).map((participant) => participant.id)

  const deleted = { id: exam.id, name: exam.name }

  await db.sequelize.transaction(async (t) => {
    if (participantIds.length > 0) {
      await db.ExamScore.destroy({ where: { participantId: participantIds }, transaction: t })
    }
    await db.ExamParticipant.destroy({ where: { examId }, transaction: t })
    await db.ExamSubject.destroy({ where: { examId }, transaction: t })
    await db.ExamGrade.destroy({ where: { examId }, transaction: t })
    await exam.destroy({ transaction: t })
  })

  return deleted
}

module.exports = { list, create, getById, saveResults, update, updateParticipantComment, remove }
