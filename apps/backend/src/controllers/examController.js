const examService = require('../services/examService')
const { parsePagination } = require('../utils/paginationUtil')

async function list(req, res) {
  const { academyId } = req.academy
  const { q } = req.query
  const { page, size, limit, offset } = parsePagination(req.query, 10)

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

async function getById(req, res) {
  const { academyId } = req.academy
  const { examId } = req.params

  const exam = await examService.getById({ academyId, examId })

  return res.status(200).json({
    success: true,
    exam,
    message: '시험 상세 조회 성공',
  })
}

async function saveResults(req, res) {
  const { academyId } = req.academy
  const { examId } = req.params
  const { participants } = req.body

  const result = await examService.saveResults({ academyId, examId, participants })

  return res.status(200).json({
    success: true,
    message: result.message,
  })
}

async function update(req, res) {
  const { academyId } = req.academy
  const { examId } = req.params

  const exam = await examService.update({ ...req.body, academyId, examId })

  return res.status(200).json({
    success: true,
    exam,
    message: '수정되었습니다.',
  })
}

async function updateParticipantComment(req, res) {
  const { academyId } = req.academy
  const { examId, participantId } = req.params
  const { teacherComment } = req.body

  const participant = await examService.updateParticipantComment({
    academyId,
    examId,
    participantId,
    teacherComment,
  })

  return res.status(200).json({
    success: true,
    participant,
    message: '피드백이 저장되었습니다.',
  })
}

async function remove(req, res) {
  const { academyId } = req.academy
  const { examId } = req.params

  const exam = await examService.remove({ academyId, examId })

  return res.status(200).json({
    success: true,
    exam,
    message: '시험이 삭제되었습니다.',
  })
}

async function copy(req, res) {
  const { academyId } = req.academy
  const { examId } = req.params
  const { classId, examDate, name } = req.body

  const exam = await examService.copy({ academyId, examId, classId, examDate, name })

  return res.status(201).json({
    success: true,
    exam: { id: exam.id, name: exam.name },
    message: '생성되었습니다.',
  })
}

module.exports = {
  list,
  create,
  getById,
  saveResults,
  update,
  updateParticipantComment,
  remove,
  copy,
}
