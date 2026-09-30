const jwt = require('jsonwebtoken');
const db = require('../../db/models');
const config = require('../../config/env');
const { verifyPassword } = require('../../utils/passwordUtil');

function throwError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

async function login(email, password) {
  if (!email || !password) {
    throwError(400, '이메일과 비밀번호는 필수입니다.');
  }

  const admin = await db.PlatformAdmin.findOne({ where: { email } });
  if (!admin) {
    throwError(401, '이메일 또는 비밀번호가 올바르지 않습니다.');
  }

  const isPasswordValid = await verifyPassword(password, admin.passwordHash);
  if (!isPasswordValid) {
    throwError(401, '이메일 또는 비밀번호가 올바르지 않습니다.');
  }

  const token = jwt.sign({ adminId: admin.id, email: admin.email }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });

  return { admin, token };
}

module.exports = { login };
