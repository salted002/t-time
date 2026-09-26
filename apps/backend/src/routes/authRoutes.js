const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')

// POST /auth/login
// 학원 관리자(User) 로그인. 이메일/비밀번호를 검증하고 JWT를 발급합니다.
router.post('/login', authController.login)

module.exports = router
