const { verifyAcademyToken } = require('../utils/jwtUtil');
const { assertActiveAcademy } = require('../services/academyService');

function throwError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

// 학원 관리자 JWT 인증 미들웨어
async function authenticateAcademy(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    throwError(401, '인증 토큰이 필요합니다.');
  }

  let decoded;
  try {
    decoded = verifyAcademyToken(token); // { userId, academyId, email }
  } catch {
    throwError(401, '유효하지 않은 토큰입니다.');
  }

  if (!decoded.academyId) {
    throwError(403, '학원 관리자 권한이 없습니다.');
  }

  await assertActiveAcademy(decoded.academyId);

  req.academy = decoded;
  next();
}

module.exports = { authenticateAcademy };