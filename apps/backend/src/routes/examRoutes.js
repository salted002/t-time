const express = require('express')
const router = express.Router()
const examController = require('../controllers/examController')
const { authenticateAcademy } = require('../middlewares/authAcademy')

router.get('/', authenticateAcademy, examController.list)

module.exports = router
