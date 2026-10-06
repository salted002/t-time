const express = require('express')
const router = express.Router()
const academyController = require('../controllers/academyController')
const uploadFiles = require('../middlewares/upload')
const { authenticateAcademy } = require('../middlewares/authAcademy')
const { blockDemo } = require('../middlewares/blockDemo')

router.post('/availability', academyController.checkAvailability)
router.post('/signup', uploadFiles.single('logo'), academyController.signup)
router.patch('/', authenticateAcademy, uploadFiles.single('logo'), academyController.updateAcademy)
router.delete('/', authenticateAcademy, blockDemo, academyController.deleteAcademy)

module.exports = router
