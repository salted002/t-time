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
  const { studentId, examId, examIds, subjectNames, teacherFeedback, aiFeedback } = req.body

  const report = await reportService.create({
    academyId,
    studentId,
    examId,
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
  const { teacherFeedback, aiFeedback } = req.body

  const report = await reportService.update({ academyId, reportId, teacherFeedback, aiFeedback })

  return res.status(200).json({
    success: true,
    report,
    message: '피드백이 수정되었습니다.',
  })
}

async function send(req, res) {
  const { academyId } = req.academy
  const { items } = req.body

  const { results, message } = await reportService.send({ academyId, items })

  return res.status(200).json({
    success: true,
    results,
    message,
  })
}

async function getSubjectOptions(req, res) {
  const { academyId } = req.academy
  const { studentIds } = req.body

  const subjectNames = await reportService.getSubjectOptions({ academyId, studentIds })

  return res.status(200).json({
    success: true,
    subjectNames,
    message: '과목 목록 조회 성공',
  })
}

async function batchPreview(req, res) {
  const { academyId } = req.academy
  const { studentIds, subjectNames } = req.body

  const { candidates, generatableCount } = await reportService.batchPreview({
    academyId,
    studentIds,
    subjectNames,
  })

  return res.status(200).json({
    success: true,
    candidates,
    generatableCount,
    message: `생성 가능한 리포트 ${generatableCount}건`,
  })
}

async function createBulk(req, res) {
  const { academyId } = req.academy
  const { reports } = req.body

  const created = await reportService.createBulk({ academyId, reports })

  return res.status(201).json({
    success: true,
    reports: created,
    message: `${created.length}건의 리포트가 저장되었습니다.`,
  })
}

module.exports = {
  preview,
  create,
  createShareLink,
  list,
  getById,
  update,
  send,
  getSubjectOptions,
  batchPreview,
  createBulk,
}
