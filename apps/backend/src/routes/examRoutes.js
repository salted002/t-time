const express = require('express')
const router = express.Router()
const examController = require('../controllers/examController')
const { authenticateAcademy } = require('../middlewares/authAcademy')

router.get('/', authenticateAcademy, examController.list)
router.post('/', authenticateAcademy, examController.create)
router.post('/:examId/copy', authenticateAcademy, examController.copy)
router.get('/:examId', authenticateAcademy, examController.getById)
router.put('/:examId/results', authenticateAcademy, examController.saveResults)
router.post('/:examId/copy', authenticateAcademy, examController.copy)
router.patch('/:examId', authenticateAcademy, examController.update)
router.patch(
  '/:examId/participants/:participantId',
  authenticateAcademy,
  examController.updateParticipantComment,
)
router.delete('/:examId', authenticateAcademy, examController.remove)

module.exports = router
