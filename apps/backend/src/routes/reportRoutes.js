const express = require('express')
const router = express.Router()
const reportController = require('../controllers/reportController')
const { authenticateAcademy } = require('../middlewares/authAcademy')

router.post('/preview', authenticateAcademy, reportController.preview)
router.post('/', authenticateAcademy, reportController.create)
router.post('/:reportId/share-link', authenticateAcademy, reportController.createShareLink)

module.exports = router
