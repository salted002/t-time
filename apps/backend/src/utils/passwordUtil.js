const bcrypt = require('bcrypt');
const config = require('../config/env');

async function hashPassword(password) {
  return bcrypt.hash(password, config.bcrypt.saltRounds);
}

async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

module.exports = { hashPassword, verifyPassword };
