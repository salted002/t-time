const { parsePagination } = require('../utils/paginationUtil')
const counselingService = require('../services/counselingService')

async function list(req, res) {
  const { academyId } = req.academy
  const { studentId } = req.params
  const { page, size, limit, offset } = parsePagination(req.query, 10)

  const { counselings, count } = await counselingService.list({
    academyId,
    studentId,
    limit,
    offset,
  })

  return res.status(200).json({
    success: true,
    counselings,
    count,
    page,
    size,
    message: '상담 이력 조회 성공',
  })
}
async function create(req, res) {
  const { academyId } = req.academy
  const { studentId } = req.params
  const counseling = await counselingService.create({ academyId, studentId, body: req.body })
  return res.status(201).json({ success: true, counseling, message: '상담이 등록되었습니다.' })
}

async function getById(req, res) {
  const { academyId } = req.academy
  const { studentId, counselingId } = req.params
  const counseling = await counselingService.getById({ academyId, studentId, counselingId })
  return res.status(200).json({ success: true, counseling, message: '상담 상세 조회 성공' })
}

async function update(req, res) {
  const { academyId } = req.academy
  const { studentId, counselingId } = req.params
  const counseling = await counselingService.update({
    academyId,
    studentId,
    counselingId,
    body: req.body,
  })
  return res.status(200).json({ success: true, counseling, message: '상담이 수정되었습니다.' })
}

async function remove(req, res) {
  const { academyId } = req.academy
  const { studentId, counselingId } = req.params
  await counselingService.remove({ academyId, studentId, counselingId })
  return res.status(200).json({ success: true, message: '상담이 삭제되었습니다.' })
}

module.exports = { list, create, getById, update, remove }
