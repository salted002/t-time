const templateService = require('../services/templateService')

async function list(req, res) {
  const { academyId } = req.academy

  const templates = await templateService.list({ academyId })

  return res.status(200).json({
    success: true,
    templates,
    message: '템플릿 목록 조회 성공',
  })
}

async function create(req, res) {
  const { academyId } = req.academy
  const { name, content, isDefault } = req.body

  const template = await templateService.create({ academyId, name, content, isDefault })

  return res.status(201).json({
    success: true,
    template,
    message: '템플릿이 추가되었습니다.',
  })
}

async function getById(req, res) {
  const { academyId } = req.academy
  const { templateId } = req.params

  const template = await templateService.getById({ academyId, templateId })

  return res.status(200).json({
    success: true,
    template,
    message: '템플릿 상세 조회 성공',
  })
}

async function update(req, res) {
  const { academyId } = req.academy
  const { templateId } = req.params
  const { name, content, isDefault } = req.body

  const template = await templateService.update({ academyId, templateId, name, content, isDefault })

  return res.status(200).json({
    success: true,
    template,
    message: '템플릿이 수정되었습니다.',
  })
}

async function remove(req, res) {
  const { academyId } = req.academy
  const { templateId } = req.params

  const template = await templateService.remove({ academyId, templateId })

  return res.status(200).json({
    success: true,
    template,
    message: '템플릿이 삭제되었습니다.',
  })
}

module.exports = { list, create, getById, update, remove }
