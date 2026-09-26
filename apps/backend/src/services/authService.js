const db = require('../db/models');
const { verifyPassword } = require('../utils/passwordUtil');
const { issueAcademyToken } = require('../utils/jwtUtil');

function throwError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

async function login(email, password) {
  if (!email || !password) {
    throwError(400, '이메일과 비밀번호는 필수입니다.');
  }

  const user = await db.User.findOne({ where: { email } });
  if (!user) {
    throwError(401, '이메일 또는 비밀번호가 올바르지 않습니다.');
  }

  const isPasswordValid = await verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    throwError(401, '이메일 또는 비밀번호가 올바르지 않습니다.');
  }

  const academy = await db.Academy.findOne({ where: { id: user.academyId, deletedAt: null } });
  if (!academy) {
    throwError(401, '이메일 또는 비밀번호가 올바르지 않습니다.');
  }

  const token = issueAcademyToken({ userId: user.id, academyId: academy.id, email: user.email });

  return { user, token };
}

module.exports = { login };
