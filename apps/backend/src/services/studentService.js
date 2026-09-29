const { Op } = require('sequelize')
const db = require('../db/models')

const VALID_STATUSES = ['재원', '휴원', '퇴원']

function throwError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  throw error
}

function toDetailResponse(student) {
  return {
    id: student.id,
    name: student.name,
    school: student.school,
    grade: student.grade,
    classId: student.classId,
    className: student.Class ? student.Class.name : null,
    status: student.status,
    parentPhone: student.parentPhone,
    enrolledAt: student.enrolledAt,
  }
}

async function list({ academyId, classId, status, q, limit, offset }) {
  const where = { academyId }

  if (classId) {
    where.classId = classId
  }

  if (status) {
    const statuses = status
      .split(',')
      .map((value) => value.trim())
      .filter((value) => VALID_STATUSES.includes(value))
    if (statuses.length > 0) {
      where.status = { [Op.in]: statuses }
    }
  }

  if (q) {
    where.name = { [Op.iLike]: `%${q}%` }
  }

  const { rows, count } = await db.Student.findAndCountAll({
    where,
    include: [{ model: db.Class, attributes: ['id', 'name'], required: false }],
    order: [
      ['enrolledAt', 'DESC'],
      ['name', 'ASC'],
    ],
    limit,
    offset,
  })

  const students = rows.map((student) => ({
    id: student.id,
    name: student.name,
    classId: student.classId,
    className: student.Class ? student.Class.name : null,
    status: student.status,
    school: student.school,
    grade: student.grade,
    parentPhone: student.parentPhone,
    enrolledAt: student.enrolledAt,
  }))

  return { students, count }
}

async function create({
  academyId,
  name,
  classId,
  status,
  school,
  grade,
  parentPhone,
  enrolledAt,
}) {
  const academy = await db.Academy.findOne({ where: { id: academyId, deletedAt: null } })
  if (!academy) {
    throwError(400, '유효하지 않은 토큰입니다.')
  }

  const resolvedStatus = status || '재원'
  if (!VALID_STATUSES.includes(resolvedStatus)) {
    throwError(400, 'status 값이 올바르지 않습니다.')
  }

  const requiredFields = { name, school, grade, parentPhone }
  const missingField = Object.entries(requiredFields).find(([, value]) => !value)
  if (missingField) {
    throwError(400, `${missingField[0]}은(는) 필수입니다.`)
  }

  if (classId) {
    const studentClass = await db.Class.findOne({ where: { id: classId, academyId } })
    if (!studentClass) {
      throwError(400, '유효하지 않은 반입니다.')
    }
  }

  const student = await db.Student.create({
    academyId,
    name,
    classId: classId || null,
    status: resolvedStatus,
    school,
    grade,
    parentPhone,
    enrolledAt: enrolledAt || null,
  })

  return student
}

async function getById({ academyId, studentId }) {
  const academy = await db.Academy.findOne({ where: { id: academyId, deletedAt: null } })
  if (!academy) {
    throwError(401, '유효하지 않은 토큰입니다.')
  }

  const student = await db.Student.findOne({
    where: { id: studentId, academyId },
    include: [{ model: db.Class, attributes: ['id', 'name'], required: false }],
  })

  if (!student) {
    throwError(404, '학생을 찾을 수 없습니다.')
  }

  return toDetailResponse(student)
}

async function update({
  academyId,
  studentId,
  name,
  classId,
  status,
  school,
  grade,
  parentPhone,
  enrolledAt,
}) {
  const academy = await db.Academy.findOne({ where: { id: academyId, deletedAt: null } })
  if (!academy) {
    throwError(401, '유효하지 않은 토큰입니다.')
  }

  const resolvedStatus = status || '재원'
  if (!VALID_STATUSES.includes(resolvedStatus)) {
    throwError(400, 'status 값이 올바르지 않습니다.')
  }

  const requiredFields = { name, school, grade, parentPhone }
  const missingField = Object.entries(requiredFields).find(([, value]) => !value)
  if (missingField) {
    throwError(400, `${missingField[0]}은(는) 필수입니다.`)
  }

  const student = await db.Student.findOne({ where: { id: studentId, academyId } })
  if (!student) {
    throwError(404, '학생을 찾을 수 없습니다.')
  }

  if (classId) {
    const studentClass = await db.Class.findOne({ where: { id: classId, academyId } })
    if (!studentClass) {
      throwError(400, '유효하지 않은 반입니다.')
    }
  }

  await student.update({
    name,
    classId: classId || null,
    status: resolvedStatus,
    school,
    grade,
    parentPhone,
    enrolledAt: enrolledAt || null,
  })

  const updatedStudent = await db.Student.findOne({
    where: { id: studentId, academyId },
    include: [{ model: db.Class, attributes: ['id', 'name'], required: false }],
  })

  return toDetailResponse(updatedStudent)
}

async function remove({ academyId, studentId }) {
  const academy = await db.Academy.findOne({ where: { id: academyId, deletedAt: null } })
  if (!academy) {
    throwError(401, '유효하지 않은 토큰입니다.')
  }

  const student = await db.Student.findOne({ where: { id: studentId, academyId } })
  if (!student) {
    throwError(404, '학생을 찾을 수 없습니다.')
  }

  const deleted = { id: student.id, name: student.name }
  await student.destroy()

  return deleted
}

module.exports = { list, create, getById, update, remove }
