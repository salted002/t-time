const express = require('express');
const router = express.Router();
const adminAuthRoutes = require('./adminAuthRoutes');
const adminAcademyRoutes = require('./adminAcademyRoutes');

// /admin 하위 라우터 통합 등록
router.use('/auth', adminAuthRoutes);
router.use('/academies', adminAcademyRoutes);

module.exports = router;
