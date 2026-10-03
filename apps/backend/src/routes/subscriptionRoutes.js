const express = require('express')
const router = express.Router()
const subscriptionController = require('../controllers/subscriptionController')
const { authenticateAcademy } = require('../middlewares/authAcademy')

router.get('/', authenticateAcademy, subscriptionController.get)
router.post('/', authenticateAcademy, subscriptionController.subscribe)
router.delete('/', authenticateAcademy, subscriptionController.cancel)

module.exports = router
