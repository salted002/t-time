const { Op } = require('sequelize')
const db = require('../db/models')

const PREVIEW_LENGTH = 30
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function throwError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  throw error
}

function toPreview(content) {
  return content.length > PREVIEW_LENGTH ? `${content.slice(0, PREVIEW_LENGTH)}...` : content
}

function toTemplate(template) {
  return {
    id: template.id,
    name: template.name,
    content: template.content,
    isDefault: template.isDefault,
  }
}

function parseRequiredText(value, field) {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text) {
    throwError(400, `${field}은(는) 필수입니다.`)
  }
  return text
}

// 생략은 undefined, 그 외에는 boolean만 허용
function parseIsDefault(value) {
  if (value === undefined) {
    return undefined
  }
  if (typeof value !== 'boolean') {
    throwError(400, 'isDefault 값이 올바르지 않습니다.')
  }
  return value
}

async function findOwned({ academyId, templateId, transaction }) {
  const template = UUID_PATTERN.test(templateId)
    ? await db.SmsTemplate.findOne({ where: { id: templateId, academyId }, transaction })
    : null
  if (!template) {
    throwError(404, '템플릿을 찾을 수 없습니다.')
  }
  return template
}

// 학원당 기본 템플릿은 1개 — 새로 지정할 때 기존 기본 템플릿을 해제한다 (트랜잭션 안에서 호출)
async function clearOtherDefaults({ academyId, exceptId, transaction }) {
  const where = { academyId, isDefault: true }
  if (exceptId) {
    where.id = { [Op.ne]: exceptId }
  }
  await db.SmsTemplate.update({ isDefault: false }, { where, transaction })
}

// 기본 템플릿 먼저 → 생성일시 내림차순
async function list({ academyId }) {
  const rows = await db.SmsTemplate.findAll({
    where: { academyId },
    order: [
      ['isDefault', 'DESC'],
      ['createdAt', 'DESC'],
      ['id', 'DESC'],
    ],
  })

  return rows.map((template) => ({
    ...toTemplate(template),
    contentPreview: toPreview(template.content),
  }))
}

async function getById({ academyId, templateId }) {
  return toTemplate(await findOwned({ academyId, templateId }))
}

async function create({ academyId, name, content, isDefault }) {
  const values = {
    name: parseRequiredText(name, 'name'),
    content: parseRequiredText(content, 'content'),
    isDefault: parseIsDefault(isDefault) ?? false,
  }

  const created = await db.sequelize.transaction(async (transaction) => {
    if (values.isDefault) {
      await clearOtherDefaults({ academyId, transaction })
    }
    return db.SmsTemplate.create({ ...values, academyId }, { transaction })
  })

  return toTemplate(created)
}

async function update({ academyId, templateId, name, content, isDefault }) {
  const changes = {}
  if (name !== undefined) {
    changes.name = parseRequiredText(name, 'name')
  }
  if (content !== undefined) {
    changes.content = parseRequiredText(content, 'content')
  }
  const parsedIsDefault = parseIsDefault(isDefault)
  if (parsedIsDefault !== undefined) {
    changes.isDefault = parsedIsDefault
  }
  if (Object.keys(changes).length === 0) {
    throwError(400, '수정할 값이 없습니다.')
  }

  const updated = await db.sequelize.transaction(async (transaction) => {
    const template = await findOwned({ academyId, templateId, transaction })
    if (changes.isDefault) {
      await clearOtherDefaults({ academyId, exceptId: template.id, transaction })
    }
    return template.update(changes, { transaction })
  })

  return toTemplate(updated)
}

// 기본 템플릿을 지워도 다른 템플릿을 자동으로 기본으로 올리지 않는다
async function remove({ academyId, templateId }) {
  const template = await findOwned({ academyId, templateId })
  await template.destroy()
  return { id: template.id }
}

module.exports = { list, getById, create, update, remove }
