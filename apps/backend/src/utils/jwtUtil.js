const jwt = require('jsonwebtoken');
const config = require('../config/env');

function issueAcademyToken({ userId, academyId, email }) {
  return jwt.sign({ userId, academyId, email }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

function verifyAcademyToken(token) {
  return jwt.verify(token, config.jwt.secret);
}

module.exports = { issueAcademyToken, verifyAcademyToken };
