const express = require('express')
const router = express.Router()
const shareController = require('../controllers/shareController')

// 인증 없음 (학부모용 공개 조회)
router.get('/:token', shareController.getByToken)

module.exports = router
