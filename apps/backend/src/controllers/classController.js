const classService = require('../services/classService');

async function list(req, res) {
  const { academyId } = req.academy;

  const classes = await classService.list({ academyId });

  return res.status(200).json({
    success: true,
    classes,
    message: '반 목록 조회 성공',
  });
}

async function create(req, res) {
  const { academyId } = req.academy;
  const { name, teacherName, studentIds } = req.body;

  const createdClass = await classService.create({ academyId, name, teacherName, studentIds });

  return res.status(201).json({
    success: true,
    class: createdClass,
    message: '반이 생성되었습니다.',
  });
}

async function update(req, res) {
  const { academyId } = req.academy;
  const { classId } = req.params;
  const { name, teacherName, studentIds } = req.body;

  const updatedClass = await classService.update({ academyId, classId, name, teacherName, studentIds });

  return res.status(200).json({
    success: true,
    class: updatedClass,
    message: '반 정보가 수정되었습니다.',
  });
}

async function remove(req, res) {
  const { academyId } = req.academy;
  const { classId } = req.params;

  const deletedClass = await classService.remove({ academyId, classId });

  return res.status(200).json({
    success: true,
    class: deletedClass,
    message: '반이 삭제되었습니다.',
  });
}

module.exports = { list, create, update, remove };
