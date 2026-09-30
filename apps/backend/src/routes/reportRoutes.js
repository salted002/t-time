const express = require('express')
const router = express.Router()
const reportController = require('../controllers/reportController')
const { authenticateAcademy } = require('../middlewares/authAcademy')

router.post('/preview', authenticateAcademy, reportController.preview)
router.post('/', authenticateAcademy, reportController.create)
router.post('/:reportId/share-link', authenticateAcademy, reportController.createShareLink)
router.get('/', authenticateAcademy, reportController.list)
router.get('/:reportId', authenticateAcademy, reportController.getById)
router.patch('/:reportId', authenticateAcademy, reportController.update)

module.exports = router
