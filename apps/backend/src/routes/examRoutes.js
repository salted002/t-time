const express = require('express')
const router = express.Router()
const examController = require('../controllers/examController')
const { authenticateAcademy } = require('../middlewares/authAcademy')

router.get('/', authenticateAcademy, examController.list)
router.post('/', authenticateAcademy, examController.create)

module.exports = router
