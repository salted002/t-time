const express = require('express');
const router = express.Router();
const adminAuthController = require('../../controllers/admin/adminAuthController');

// POST /admin/auth/login
// 운영자(platform_admins) 로그인
router.post('/login', adminAuthController.login);

module.exports = router;
