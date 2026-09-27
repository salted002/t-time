const studentService = require("../services/studentService");
const { parsePagination } = require("../utils/paginationUtil");

async function list(req, res) {
  const { academyId } = req.academy;
  const { classId, status, q } = req.query;
  const { page, size, limit, offset } = parsePagination(req.query);

  const { students, count } = await studentService.list({
    academyId,
    classId,
    status,
    q,
    limit,
    offset,
  });

  return res.status(200).json({
    success: true,
    students,
    count,
    page,
    size,
    message: "학생 목록 조회 성공",
  });
}

async function create(req, res) {
  const { academyId } = req.academy;

  const student = await studentService.create({ ...req.body, academyId });

  return res.status(201).json({
    success: true,
    student: { id: student.id, name: student.name, status: student.status },
    message: "신규 학생 정보가 등록되었습니다.",
  });
}

async function getById(req, res) {
  const { academyId } = req.academy;
  const { studentId } = req.params;

  const student = await studentService.getById({ academyId, studentId });

  return res.status(200).json({
    success: true,
    student,
    message: "학생 상세 조회 성공",
  });
}

async function update(req, res) {
  const { academyId } = req.academy;
  const { studentId } = req.params;

  const student = await studentService.update({
    ...req.body,
    academyId,
    studentId,
  });

  return res.status(200).json({
    success: true,
    student,
    message: "학생 정보 수정 성공",
  });
}

async function remove(req, res) {
  const { academyId } = req.academy;
  const { studentId } = req.params;

  const student = await studentService.remove({ academyId, studentId });

  return res.status(200).json({
    success: true,
    student,
    message: '학생 정보 삭제 성공',
  });
}

module.exports = { list, create, getById, update, remove };
