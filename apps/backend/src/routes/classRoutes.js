const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { authenticateAcademy } = require('../middlewares/authAcademy');

router.get('/', authenticateAcademy, classController.list);
router.post('/', authenticateAcademy, classController.create);
router.patch('/:classId', authenticateAcademy, classController.update);
router.delete('/:classId', authenticateAcademy, classController.remove);

module.exports = router
