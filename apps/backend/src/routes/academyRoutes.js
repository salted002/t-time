const express = require('express');
const router = express.Router();
const academyController = require('../controllers/academyController');
const uploadFiles = require('../middlewares/uploadFiles');
const { authenticateAcademy } = require('../middlewares/authAcademy');

router.post('/availability', academyController.checkAvailability);
router.post('/signup', uploadFiles.single('logo'), academyController.signup);
router.patch('/', authenticateAcademy, uploadFiles.single('logo'), academyController.updateAcademy);
router.delete('/', authenticateAcademy, academyController.deleteAcademy);

module.exports = router;