const db = require('../db/models')
const { hashPassword, verifyPassword } = require('../utils/passwordUtil')
const { issueAcademyToken } = require('../utils/jwtUtil')

function throwError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  throw error
}

async function login(email, password) {
  if (!email || !password) {
    throwError(400, '이메일과 비밀번호는 필수입니다.')
  }

  const user = await db.User.findOne({ where: { email } })
  if (!user) {
    throwError(401, '이메일 또는 비밀번호가 올바르지 않습니다.')
  }

  const isPasswordValid = await verifyPassword(password, user.passwordHash)
  if (!isPasswordValid) {
    throwError(401, '이메일 또는 비밀번호가 올바르지 않습니다.')
  }

  const academy = await db.Academy.findOne({ where: { id: user.academyId, deletedAt: null } })
  if (!academy) {
    throwError(401, '이메일 또는 비밀번호가 올바르지 않습니다.')
  }

  const token = issueAcademyToken({ userId: user.id, academyId: academy.id, email: user.email })

  return { user, token, academy }
}

async function changePassword(userId, academyId, currentPassword, newPassword, newPasswordConfirm) {
  if (!currentPassword || !newPassword || !newPasswordConfirm) {
    throwError(400, '현재 비밀번호와 새 비밀번호는 필수입니다.')
  }

  if (newPassword !== newPasswordConfirm) {
    throwError(400, '새 비밀번호가 일치하지 않습니다.')
  }

  const user = await db.User.findOne({ where: { id: userId, academyId } })
  if (!user) {
    throwError(404, '사용자를 찾을 수 없습니다.')
  }

  const isPasswordValid = await verifyPassword(currentPassword, user.passwordHash)
  if (!isPasswordValid) {
    throwError(401, '현재 비밀번호가 일치하지 않습니다.')
  }

  const passwordHash = await hashPassword(newPassword)
  await user.update({ passwordHash })
}

module.exports = { login, changePassword }
