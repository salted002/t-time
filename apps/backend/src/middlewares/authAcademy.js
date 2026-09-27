const { verifyAcademyToken } = require('../utils/jwtUtil');

// 학원 관리자 JWT 인증 미들웨어
function authenticateAcademy(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: '인증 토큰이 필요합니다.' });
  }

  try {
    const decoded = verifyAcademyToken(token); // { userId, academyId, email }
    req.academy = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: '유효하지 않은 토큰입니다.' });
  }
}

module.exports = { authenticateAcademy };