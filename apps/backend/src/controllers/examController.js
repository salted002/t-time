const examService = require('../services/examService')
const { parsePagination } = require('../utils/paginationUtil')

async function list(req, res) {
  const { academyId } = req.academy
  const { q } = req.query
  const { page, size, limit, offset } = parsePagination(req.query)

  const { exams, count } = await examService.list({ academyId, q, limit, offset })

  return res.status(200).json({
    success: true,
    exams,
    count,
    page,
    size,
    message: '시험 목록 조회 성공',
  })
}

async function create(req, res) {
  const { academyId } = req.academy

  const exam = await examService.create({ ...req.body, academyId })

  return res.status(201).json({
    success: true,
    exam,
    message: '시험이 생성되었습니다.',
  })
}

module.exports = { list, create }
