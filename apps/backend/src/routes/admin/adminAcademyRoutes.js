const express = require('express');
const router = express.Router();
const adminAcademyController = require('../../controllers/admin/adminAcademyController');
const { authenticateAdmin } = require('../../middlewares/authAdmin');

// GET /admin/academies
// 운영자 콘솔 - 서비스 등록 학원 목록 조회 (소프트 삭제 제외, 등록일자 내림차순 → 이름 오름차순 고정)
router.get('/', authenticateAdmin, adminAcademyController.list);

module.exports = router;
