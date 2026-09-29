const jwt = require('jsonwebtoken');
const config = require('../config/env');

function throwError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

// 운영자(platform_admins) JWT 인증 미들웨어
function authenticateAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    throwError(401, '인증 토큰이 필요합니다.');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, config.jwt.secret); // { adminId, email }
  } catch {
    throwError(401, '유효하지 않은 토큰입니다.');
  }

  req.admin = decoded;
  next();
}

module.exports = { authenticateAdmin };
