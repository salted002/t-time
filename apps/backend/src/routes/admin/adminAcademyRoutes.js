const express = require('express');
const router = express.Router();
const adminAcademyController = require('../../controllers/admin/adminAcademyController');
const { authenticateAdmin } = require('../../middlewares/authAdmin');
const uploadFiles = require('../../middlewares/upload');

// GET /admin/academies
// 운영자 콘솔 - 서비스 등록 학원 목록 조회 (소프트 삭제 제외, 등록일자 내림차순 → 이름 오름차순 고정)
router.get('/', authenticateAdmin, adminAcademyController.list);

// GET /admin/academies/:academyId - 수정 화면 진입 시 폼을 채우기 위한 학원 + 관리자 상세 조회
router.get('/:academyId', authenticateAdmin, adminAcademyController.detail);

// PATCH /admin/academies/:academyId (multipart/form-data) - 학원 정보와 관리자(사용자) 정보 수정
router.patch(
  '/:academyId',
  authenticateAdmin,
  uploadFiles.single('logo'),
  adminAcademyController.update,
);

// DELETE /admin/academies/:academyId - 소프트 삭제(deleted_at)
router.delete('/:academyId', authenticateAdmin, adminAcademyController.remove);

module.exports = router;
