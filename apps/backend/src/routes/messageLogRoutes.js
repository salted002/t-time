const express = require('express');
const router = express.Router();
const messageLogController = require('../controllers/messageLogController');
const { authenticateAcademy } = require('../middlewares/authAcademy');

router.get('/', authenticateAcademy, messageLogController.list);
router.get('/:logId', authenticateAcademy, messageLogController.getById);

module.exports = router;
