const reportService = require('../services/reportService')

async function preview(req, res) {
  const { academyId } = req.academy
  const { studentId, examId, subjectNames } = req.body

  const preview = await reportService.preview({ academyId, studentId, examId, subjectNames })

  return res.status(200).json({
    success: true,
    preview,
    message: '리포트 미리보기 생성 성공',
  })
}

async function create(req, res) {
  const { academyId } = req.academy
  const { studentId, examIds, subjectNames, teacherFeedback, aiFeedback } = req.body

  const report = await reportService.create({
    academyId,
    studentId,
    examIds,
    subjectNames,
    teacherFeedback,
    aiFeedback,
  })

  return res.status(201).json({
    success: true,
    report,
    message: '저장되었습니다.',
  })
}

async function createShareLink(req, res) {
  const { academyId } = req.academy
  const { reportId } = req.params

  const { isNew, shareLink } = await reportService.createShareLink({ academyId, reportId })

  return res.status(isNew ? 201 : 200).json({
    success: true,
    shareLink,
    message: isNew ? '공유 링크가 생성되었습니다.' : '기존 공유 링크를 반환합니다.',
  })
}

async function list(req, res) {
  const { academyId } = req.academy
  const { page, size, q } = req.query

  const {
    reports,
    count,
    page: currentPage,
    size: pageSize,
  } = await reportService.list({
    academyId,
    page,
    size,
    q,
  })

  return res.status(200).json({
    success: true,
    reports,
    count,
    page: currentPage,
    size: pageSize,
    message: '리포트 목록 조회 성공',
  })
}

async function getById(req, res) {
  const { academyId } = req.academy
  const { reportId } = req.params

  const report = await reportService.getById({ academyId, reportId })

  return res.status(200).json({
    success: true,
    report,
    message: '리포트 상세 조회 성공',
  })
}

async function update(req, res) {
  const { academyId } = req.academy
  const { reportId } = req.params
  const { teacherFeedback } = req.body

  const report = await reportService.update({ academyId, reportId, teacherFeedback })

  return res.status(200).json({
    success: true,
    report,
    message: '피드백이 수정되었습니다.',
  })
}

module.exports = { preview, create, createShareLink, list, getById, update }
