const { removeFile: removeLogoFile } = require('../utils/storageUtil')
const db = require('../db/models')
const { hashPassword } = require('../utils/passwordUtil')
const { issueAcademyToken } = require('../utils/jwtUtil')
const { getSlugError } = require('../utils/slugUtil')
const { onlyDigits, normalizePhone, PHONE_PATTERN } = require('../utils/phoneUtil')

function throwError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  throw error
}

async function checkAvailability(slug, businessNumber) {
  if (!slug) {
    throwError(400, 'slug는 필수입니다.')
  }

  const slugError = getSlugError(slug)
  const existingSlug = slugError
    ? null
    : await db.Academy.findOne({ where: { slug, deletedAt: null } })

  let businessNumberAvailable = true
  if (businessNumber) {
    const existingBusinessNumber = await db.Academy.findOne({
      where: { businessNumber, deletedAt: null },
    })
    businessNumberAvailable = !existingBusinessNumber
  }

  const slugAvailable = !slugError && !existingSlug

  return {
    available: {
      slug: slugAvailable,
      businessNumber: businessNumberAvailable,
    },
    reasons: {
      slug: slugError ?? (slugAvailable ? null : '이미 등록된 슬러그입니다.'),
      businessNumber: businessNumberAvailable ? null : '이미 등록된 사업자번호입니다.',
    },
  }
}

async function signup(signupData, logoFilename) {
  try {
    const {
      academyName,
      businessNumber,
      ownerName,
      phone: rawPhone,
      slug,
      address,
      senderNumber: rawSender,
      name,
      email,
      password,
      passwordConfirm,
    } = signupData

    const phone = onlyDigits(rawPhone)
    const senderNumber = onlyDigits(rawSender)
    if (phone && !PHONE_PATTERN.test(phone)) throwError(400, '대표연락처 형식이 올바르지 않습니다.')
    if (senderNumber && !PHONE_PATTERN.test(senderNumber))
      throwError(400, '발신번호 형식이 올바르지 않습니다.')

    const requiredFields = {
      academyName,
      businessNumber,
      ownerName,
      phone,
      slug,
      name,
      email,
      password,
      passwordConfirm,
    }
    const missingField = Object.entries(requiredFields).find(([, value]) => !value)

    if (missingField) {
      throwError(400, `${missingField[0]}은(는) 필수입니다.`) // 객체로 묶어서 누락된 필드 이름까지 에러 메시지에 넣음
    }

    if (password !== passwordConfirm) {
      throwError(400, '비밀번호가 일치하지 않습니다.')
    }

    const slugError = getSlugError(slug)
    if (slugError) throwError(400, slugError)

    const [existingSlug, existingBusinessNumber, existingEmail] = await Promise.all([
      db.Academy.findOne({ where: { slug, deletedAt: null } }),
      db.Academy.findOne({ where: { businessNumber, deletedAt: null } }),
      db.User.findOne({ where: { email, deleted_at: null } }),
    ])

    if (existingSlug) throwError(409, '이미 사용 중인 슬러그입니다.')
    if (existingBusinessNumber) throwError(409, '이미 사용 중인 사업자번호입니다.')
    if (existingEmail) throwError(409, '이미 사용 중인 이메일입니다.')

    const passwordHash = await hashPassword(password)

    const result = await db.sequelize.transaction(async (t) => {
      const academy = await db.Academy.create(
        {
          name: academyName,
          slug,
          businessNumber,
          ownerName,
          phone,
          address: address || null,
          smsSenderNumber: senderNumber || null,
          logoUrl: logoFilename,
          subscriptionStatus: 'FREE',
        },
        { transaction: t },
      )

      const user = await db.User.create(
        { academyId: academy.id, name, email, passwordHash },
        { transaction: t },
      )

      return { academy, user }
    })

    const token = issueAcademyToken({
      userId: result.user.id,
      academyId: result.academy.id,
      email: result.user.email,
    })

    return { academy: result.academy, user: result.user, token }
  } catch (error) {
    if (logoFilename) removeLogoFile(logoFilename)
    throw error
  }
}

async function updateAcademy(academyId, updateData, file) {
  try {
    const { phone: rawPhone, address, slug, senderNumber: rawSender } = updateData

    const phone = normalizePhone(rawPhone)
    const senderNumber = normalizePhone(rawSender)

    if (phone && !PHONE_PATTERN.test(phone)) throwError(400, '대표연락처 형식이 올바르지 않습니다.')
    if (senderNumber && !PHONE_PATTERN.test(senderNumber))
      throwError(400, '발신번호 형식이 올바르지 않습니다.')

    const academy = await db.Academy.findOne({ where: { id: academyId, deletedAt: null } })
    if (!academy) throwError(404, '학원을 찾을 수 없습니다.')

    if (slug && slug !== academy.slug) {
      if (academy.isDemo) throwError(403, '데모 계정에서는 학원 슬러그를 변경할 수 없습니다.')

      const slugError = getSlugError(slug)
      if (slugError) throwError(400, slugError)

      const existingSlug = await db.Academy.findOne({ where: { slug, deletedAt: null } })
      if (existingSlug) throwError(409, '이미 사용 중인 슬러그입니다.')
    }

    const updateFields = {}
    if (phone !== undefined) updateFields.phone = phone
    if (address !== undefined) updateFields.address = address
    if (slug !== undefined) updateFields.slug = slug
    if (senderNumber !== undefined) updateFields.smsSenderNumber = senderNumber

    const oldLogoFilename = file ? academy.logoUrl : null
    if (file) {
      updateFields.logoUrl = file.filename
    }

    await academy.update(updateFields)

    if (oldLogoFilename) removeLogoFile(oldLogoFilename)

    return academy
  } catch (error) {
    if (file) removeLogoFile(file.filename)
    throw error
  }
}

async function deleteAcademy(academyId) {
  const academy = await db.Academy.findOne({ where: { id: academyId, deletedAt: null } })
  if (!academy) throwError(404, '학원을 찾을 수 없습니다.')

  const deletedAt = new Date()
  await db.sequelize.transaction(async (t) => {
    await academy.update({ deletedAt }, { transaction: t })
    await db.User.update({ deleted_at: deletedAt }, { where: { academyId }, transaction: t })
  })
}

async function assertActiveAcademy(academyId) {
  const academy = await db.Academy.findOne({
    where: { id: academyId },
    attributes: ['id', 'deletedAt'],
  })
  if (!academy || academy.deletedAt) {
    throwError(403, '삭제된 학원 계정입니다.')
  }
}

module.exports = { checkAvailability, signup, updateAcademy, deleteAcademy, assertActiveAcademy }
