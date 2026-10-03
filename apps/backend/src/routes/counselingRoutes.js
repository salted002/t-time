const express = require('express')
const router = express.Router({ mergeParams: true })
const counselingController = require('../controllers/counselingController')
const { authenticateAcademy } = require('../middlewares/authAcademy')

router.get('/', authenticateAcademy, counselingController.list)
router.post('/', authenticateAcademy, counselingController.create)
router.get('/:counselingId', authenticateAcademy, counselingController.getById)
router.patch('/:counselingId', authenticateAcademy, counselingController.update)
router.delete('/:counselingId', authenticateAcademy, counselingController.remove)

module.exports = router
