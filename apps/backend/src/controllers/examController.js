const examService = require('../services/examService')
const { parsePagination } = require('../utils/paginationUtil')

async function list(req, res) {
  const { academyId } = req.academyId
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

module.exports = { list }
