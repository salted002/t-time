const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const { authenticateAcademy } = require('../middlewares/authAcademy')
const { blockDemo } = require('../middlewares/blockDemo')


// POST /auth/login
// 학원 관리자(User) 로그인. 이메일/비밀번호를 검증하고 JWT를 발급합니다.
router.post('/login', authController.login)

// GET /auth/me
// 로그인한 관리자 본인 정보 + 소속 학원 정보 조회
router.get('/me', authenticateAcademy, authController.getMe)

// PATCH /auth/password
// 로그인한 관리자의 비밀번호 변경 (*데모 계정의 경우 기능 블락)
router.patch('/password', authenticateAcademy, blockDemo, authController.changePassword)

module.exports = router
