const express = require('express')
const router = express.Router()
const templateController = require('../controllers/templateController')
const { authenticateAcademy } = require('../middlewares/authAcademy')

router.get('/', authenticateAcademy, templateController.list)
router.post('/', authenticateAcademy, templateController.create)
router.get('/:templateId', authenticateAcademy, templateController.getById)
router.patch('/:templateId', authenticateAcademy, templateController.update)
router.delete('/:templateId', authenticateAcademy, templateController.remove)

module.exports = router
