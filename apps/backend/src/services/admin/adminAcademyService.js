const { Op } = require('sequelize')
const db = require('../../db/models')
const { hashPassword } = require('../../utils/passwordUtil')
const { removeFile: removeLogoFile } = require('../../utils/storageUtil')
const { getSlugError } = require('../../utils/slugUtil')
const { normalizePhone } = require('../../utils/phoneUtil')

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8 // 프런트(types/account.ts)와 같은 기준

// 문자열이면 앞뒤 공백 제거, 아니면 그대로 (undefined는 "보내지 않음"이라 유지)
const trimmed = (value) => (typeof value === 'string' ? value.trim() : value)

function buildSearchWhere(q) {
  const where = { deletedAt: null }
  const keyword = typeof q === 'string' ? q.trim() : ''
  if (keyword) {
    where.name = { [Op.iLike]: `%${keyword}%` }
  }
  return where
}

async function list({ q, limit, offset }) {
  const { rows, count } = await db.Academy.findAndCountAll({
    where: buildSearchWhere(q),
    include: [{ model: db.User, attributes: ['email'], required: false }],
    order: [
      ['createdAt', 'DESC'],
      ['name', 'ASC'],
    ],
    limit,
    offset,
  })

  const academyIds = rows.map((academy) => academy.id)

  const studentCounts = academyIds.length
    ? await db.Student.findAll({
        attributes: [
          'academyId',
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'studentCount'],
        ],
        where: { academyId: { [Op.in]: academyIds }, status: '재원' },
        group: ['academyId'],
        raw: true,
      })
    : []

  const studentCountMap = new Map(
    studentCounts.map((row) => [row.academyId, Number(row.studentCount)]),
  )

  const academies = rows.map((academy) => ({
    id: academy.id,
    name: academy.name,
    phone: academy.phone,
    ownerName: academy.ownerName,
    studentCount: studentCountMap.get(academy.id) || 0,
    loginEmail: academy.User ? academy.User.email : null,
  }))

  return { academies, count }
}

function throwError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  throw error
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function findActiveAcademy(academyId, options = {}) {
  // UUID 형식이 아니면 Postgres 오류(500) 대신 404로 처리한다.
  if (!UUID_REGEX.test(academyId)) throwError(404, '학원을 찾을 수 없습니다.')

  const academy = await db.Academy.findOne({
    where: { id: academyId, deletedAt: null },
    include: [{ model: db.User, required: false, where: { deleted_at: null } }],
    ...options,
  })
  if (!academy) throwError(404, '학원을 찾을 수 없습니다.')
  return academy
}

async function detail(academyId) {
  const academy = await findActiveAcademy(academyId)
  return { academy, user: academy.User || null }
}

async function update(academyId, updateData, file) {
  try {
    const name = trimmed(updateData.name)
    const slug = trimmed(updateData.slug)
    const phone = normalizePhone(trimmed(updateData.phone))
    const address = trimmed(updateData.address)
    const businessNumber = trimmed(updateData.businessNumber)
    const ownerName = trimmed(updateData.ownerName)
    const senderNumber = normalizePhone(trimmed(updateData.senderNumber))
    const userName = trimmed(updateData.userName)
    const userEmail = trimmed(updateData.userEmail)
    const { userPassword } = updateData // 비밀번호는 공백이 의미 있을 수 있어 값은 trim하지 않는다

    const academy = await findActiveAcademy(academyId)
    const user = academy.User

    // 필수 컬럼(allowNull: false)은 빈 값으로 덮어쓰지 않는다.
    const requiredFields = { name, slug, phone, businessNumber, ownerName, userName, userEmail }
    const emptyField = Object.entries(requiredFields).find(
      ([, value]) => value !== undefined && !String(value).trim(),
    )
    if (emptyField) throwError(400, `${emptyField[0]}은(는) 비워둘 수 없습니다.`)

    if (slug !== undefined && slug !== academy.slug) {
      const slugError = getSlugError(slug)
      if (slugError) throwError(400, slugError)

      const existing = await db.Academy.findOne({ where: { slug, deletedAt: null } })
      if (existing) throwError(409, '이미 사용 중인 슬러그입니다.')
    }
    if (businessNumber !== undefined && businessNumber !== academy.businessNumber) {
      const existing = await db.Academy.findOne({ where: { businessNumber, deletedAt: null } })
      if (existing) throwError(409, '이미 사용 중인 사업자번호입니다.')
    }
    if (userEmail !== undefined && user && userEmail !== user.email) {
      if (!EMAIL_PATTERN.test(userEmail)) throwError(400, '올바른 이메일 형식이 아닙니다.')

      const existing = await db.User.findOne({ where: { email: userEmail, deleted_at: null } })
      if (existing) throwError(409, '이미 사용 중인 이메일입니다.')
    }

    // 비밀번호: 비어 있거나 공백뿐이면 "변경 안 함". 값이 있으면 길이를 검사한다.
    const hasNewPassword = typeof userPassword === 'string' && userPassword.trim() !== ''
    if (hasNewPassword && userPassword.length < MIN_PASSWORD_LENGTH) {
      throwError(400, `비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`)
    }

    const academyFields = {}
    if (name !== undefined) academyFields.name = name
    if (slug !== undefined) academyFields.slug = slug
    if (phone !== undefined) academyFields.phone = phone
    if (address !== undefined) academyFields.address = address || null
    if (businessNumber !== undefined) academyFields.businessNumber = businessNumber
    if (ownerName !== undefined) academyFields.ownerName = ownerName
    if (senderNumber !== undefined) academyFields.smsSenderNumber = senderNumber || null

    const oldLogoFilename = file ? academy.logoUrl : null
    if (file) academyFields.logoUrl = file.filename

    const userFields = {}
    if (userName !== undefined) userFields.name = userName
    if (userEmail !== undefined) userFields.email = userEmail
    if (hasNewPassword) userFields.passwordHash = await hashPassword(userPassword)

    await db.sequelize.transaction(async (t) => {
      await academy.update(academyFields, { transaction: t })
      if (user && Object.keys(userFields).length > 0) {
        await user.update(userFields, { transaction: t })
      }
    })

    if (oldLogoFilename) removeLogoFile(oldLogoFilename)

    return { academy, user }
  } catch (error) {
    if (file) removeLogoFile(file.filename)
    throw error
  }
}

// 소프트 삭제: 학원과 소속 사용자에 deleted_at을 기록한다.
async function remove(academyId) {
  const academy = await findActiveAcademy(academyId, { include: [] })

  const deletedAt = new Date()
  await db.sequelize.transaction(async (t) => {
    await academy.update({ deletedAt }, { transaction: t })
    await db.User.update({ deleted_at: deletedAt }, { where: { academyId }, transaction: t })
  })
}

module.exports = { list, detail, update, remove }
