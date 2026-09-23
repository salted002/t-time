const jwt = require("jsonwebtoken");
const config = require('../config/env');

// auth 미들웨어
function authenticateAcademy (req, res, next) {
  const temp = req.headers.authorization || "";
  const token = temp.startsWith("Bearer ") ? temp.slice(7) : null;

  if(!token) {
    return res.status(401).json({sucess:false, message:"인증 토근이 필요합니다"});
  }
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.academy = decoded; // { userId, academyId, email }
    next();
  } catch(error) {
    return res.status(500).json({sucess:false, message: error.message});
  }
}

module.exports = { authenticateAcademy };