const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const { authenticateAcademy } = require('../middlewares/authAcademy')

// POST /auth/login
// 학원 관리자(User) 로그인. 이메일/비밀번호를 검증하고 JWT를 발급합니다.
router.post('/login', authController.login)

// PATCH /auth/password
// 로그인한 관리자의 비밀번호 변경
router.patch('/password', authenticateAcademy, authController.changePassword)

module.exports = router
