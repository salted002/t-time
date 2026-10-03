const db = require('../db/models')

const VALID_TARGETS = ['학생', '학부모']
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function throwError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  throw error
}

function assertUuid(id, statusCode, message) {
  if (typeof id !== 'string' || !UUID_PATTERN.test(id)) throwError(statusCode, message)
}

// 상담 테이블엔 academy_id가 없으므로, 학생이 이 학원 소속인지로 소속을 판단한다.
async function assertStudentInAcademy(academyId, studentId) {
  assertUuid(studentId, 404, '학생을 찾을 수 없습니다.')
  const student = await db.Student.findOne({
    where: { id: studentId, academyId },
    attributes: ['id'],
  })
  if (!student) throwError(404, '학생을 찾을 수 없습니다.')
}

async function findCounseling({ academyId, studentId, counselingId }) {
  await assertStudentInAcademy(academyId, studentId)
  assertUuid(counselingId, 404, '상담 기록을 찾을 수 없습니다.')
  const counseling = await db.StudentCounseling.findOne({ where: { id: counselingId, studentId } })
  if (!counseling) throwError(404, '상담 기록을 찾을 수 없습니다.')
  return counseling
}

function toResponse(c) {
  return {
    id: c.id,
    counselingDate: c.counselingDate,
    target: c.target,
    counselorName: c.counselorName,
    content: c.content,
    note: c.note,
    createdAt: c.createdAt,
  }
}

// requireAll: 등록(true)은 필수값 전부, 수정(false)은 들어온 값만 검사
function pickFields(body, requireAll) {
  const { counselingDate, target, counselorName, content, note } = body
  const fields = {}

  if (requireAll || counselingDate !== undefined) {
    if (!counselingDate) throwError(400, 'counselingDate은(는) 필수입니다.')
    fields.counselingDate = counselingDate
  }
  if (target !== undefined) {
    if (!VALID_TARGETS.includes(target)) throwError(400, 'target 값이 올바르지 않습니다.')
    fields.target = target
  }
  if (requireAll || counselorName !== undefined) {
    if (!counselorName || !String(counselorName).trim())
      throwError(400, 'counselorName은(는) 필수입니다.')
    fields.counselorName = String(counselorName).trim()
  }
  if (requireAll || content !== undefined) {
    if (!content || !String(content).trim()) throwError(400, 'content은(는) 필수입니다.')
    fields.content = String(content).trim()
  }
  if (note !== undefined) fields.note = note ? String(note).trim() || null : null

  return fields
}

async function list({ academyId, studentId, limit, offset }) {
  await assertStudentInAcademy(academyId, studentId)
  const { rows, count } = await db.StudentCounseling.findAndCountAll({
    where: { studentId },
    order: [
      ['counselingDate', 'DESC'],
      ['createdAt', 'DESC'],
    ],
    limit,
    offset,
  })
  return { counselings: rows.map(toResponse), count }
}

async function create({ academyId, studentId, body }) {
  await assertStudentInAcademy(academyId, studentId)
  const counseling = await db.StudentCounseling.create({ studentId, ...pickFields(body, true) })
  return toResponse(counseling)
}

async function getById({ academyId, studentId, counselingId }) {
  return toResponse(await findCounseling({ academyId, studentId, counselingId }))
}

async function update({ academyId, studentId, counselingId, body }) {
  const counseling = await findCounseling({ academyId, studentId, counselingId })
  await counseling.update(pickFields(body, false))
  return toResponse(counseling)
}

async function remove({ academyId, studentId, counselingId }) {
  const counseling = await findCounseling({ academyId, studentId, counselingId })
  await counseling.destroy()
}

module.exports = { list, create, getById, update, remove }
