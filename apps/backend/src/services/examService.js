const { Op } = require('sequelize')
const db = require('../db/models')

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

module.exports = { list }
