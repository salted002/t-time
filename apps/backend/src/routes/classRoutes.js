const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { authenticateAcademy } = require('../middlewares/authAcademy');
const classRouter = require('./routes/classRoutes');

router.get('/', authenticateAcademy, classController.list);

module.exports = router;
