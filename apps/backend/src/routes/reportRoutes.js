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
router.post('/send', authenticateAcademy, reportController.send)
router.post('/subject-options', authenticateAcademy, reportController.getSubjectOptions)
router.post('/batch-preview', authenticateAcademy, reportController.batchPreview)
router.post('/bulk', authenticateAcademy, reportController.createBulk)

module.exports = router
