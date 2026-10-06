const express = require('express')
const router = express.Router()
const studentController = require('../controllers/studentController')
const { authenticateAcademy } = require('../middlewares/authAcademy')

router.get('/', authenticateAcademy, studentController.list)
router.post('/', authenticateAcademy, studentController.create)
router.post('/bulk', authenticateAcademy, studentController.bulkCreate);
router.get('/:studentId', authenticateAcademy, studentController.getById)
router.patch('/:studentId', authenticateAcademy, studentController.update)
router.delete('/:studentId', authenticateAcademy, studentController.remove)
router.get('/:studentId/exam-results', authenticateAcademy, studentController.getExamResults)
router.get(
  '/:studentId/exam-results/:examId',
  authenticateAcademy,
  studentController.getExamResultDetail,
)

module.exports = router
