const { fn, col, Op } = require('sequelize');
const db = require('../db/models');

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function throwError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

async function assertAcademy(academyId) {
  const academy = await db.Academy.findOne({ where: { id: academyId, deletedAt: null } });
  if (!academy) {
    throwError(401, '유효하지 않은 토큰입니다.');
  }
}

function parseName(name) {
  const trimmedName = typeof name === 'string' ? name.trim() : '';
  if (!trimmedName) {
    throwError(400, 'name은(는) 필수입니다.');
  }
  return trimmedName;
}

// null·빈 문자열은 담임 없음(null)
function parseTeacherName(teacherName) {
  if (teacherName !== undefined && teacherName !== null && typeof teacherName !== 'string') {
    throwError(400, 'teacherName 값이 올바르지 않습니다.');
  }
  return typeof teacherName === 'string' && teacherName.trim() ? teacherName.trim() : null;
}

// null·생략은 빈 배열, 중복 ID는 하나로 합침
function parseStudentIds(studentIds) {
  const ids = studentIds === undefined || studentIds === null ? [] : studentIds;
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== 'string' || !UUID_PATTERN.test(id))) {
    throwError(400, 'studentIds 값이 올바르지 않습니다.');
  }
  return [...new Set(ids)];
}

// ponytail: DB unique 제약이 없어 동시 요청 시 중복 가능, 필요하면 (academy_id, name) unique 인덱스 추가
async function assertNameAvailable(academyId, name, excludeClassId) {
  const where = { academyId, name };
  if (excludeClassId) {
    where.id = { [Op.ne]: excludeClassId };
  }
  const duplicate = await db.Class.findOne({ where });
  if (duplicate) {
    throwError(409, '이미 같은 이름의 반이 있습니다.');
  }
}

async function assertStudentsInAcademy(academyId, studentIds) {
  if (studentIds.length === 0) {
    return;
  }
  const found = await db.Student.count({ where: { id: { [Op.in]: studentIds }, academyId } });
  if (found !== studentIds.length) {
    throwError(400, '유효하지 않은 학생이 포함되어 있습니다.');
  }
}

async function findClass(academyId, classId) {
  if (!UUID_PATTERN.test(classId)) {
    throwError(404, '반을 찾을 수 없습니다.');
  }
  const targetClass = await db.Class.findOne({ where: { id: classId, academyId } });
  if (!targetClass) {
    throwError(404, '반을 찾을 수 없습니다.');
  }
  return targetClass;
}

function toResponse(classRow, studentCount) {
  return {
    id: classRow.id,
    name: classRow.name,
    teacherName: classRow.teacherName,
    studentCount,
  };
}

// 반 목록 조회 (페이지네이션 없음, 반 이름 오름차순)
async function list({ academyId }) {
  await assertAcademy(academyId);

  const rows = await db.Class.findAll({
    where: { academyId },
    attributes: ['id', 'name', 'teacherName', [fn('COUNT', col('Students.id')), 'studentCount']],
    include: [{ model: db.Student, attributes: [], required: false }],
    group: ['Class.id'],
    order: [['name', 'ASC']],
  });

  return rows.map((row) => toResponse(row, Number(row.get('studentCount'))));
}

// 반 상세 조회 (소속 학생 전체, 이름 오름차순 — 휴원·퇴원 포함)
async function getById({ academyId, classId }) {
  await assertAcademy(academyId);

  const targetClass = await findClass(academyId, classId);

  const students = await db.Student.findAll({
    where: { classId, academyId },
    attributes: ['id', 'name', 'status'],
    order: [
      ['name', 'ASC'],
      ['id', 'ASC'],
    ],
  });

  return {
    ...toResponse(targetClass, students.length),
    students: students.map((student) => ({ id: student.id, name: student.name, status: student.status })),
  };
}

// 반 생성 + 학생 배정 (다른 반 소속 학생은 새 반으로 이동)
async function create({ academyId, name, teacherName, studentIds }) {
  await assertAcademy(academyId);

  const trimmedName = parseName(name);
  const resolvedTeacherName = parseTeacherName(teacherName);
  const uniqueIds = parseStudentIds(studentIds);

  await assertNameAvailable(academyId, trimmedName);
  await assertStudentsInAcademy(academyId, uniqueIds);

  const createdClass = await db.sequelize.transaction(async (transaction) => {
    const newClass = await db.Class.create(
      { academyId, name: trimmedName, teacherName: resolvedTeacherName },
      { transaction },
    );

    if (uniqueIds.length > 0) {
      await db.Student.update(
        { classId: newClass.id },
        { where: { id: { [Op.in]: uniqueIds }, academyId }, transaction },
      );
    }

    return newClass;
  });

  return toResponse(createdClass, uniqueIds.length);
}

// 반 수정 (보낸 필드만 수정, studentIds는 소속 학생 전체 대체)
async function update({ academyId, classId, name, teacherName, studentIds }) {
  await assertAcademy(academyId);

  if (name === undefined && teacherName === undefined && studentIds === undefined) {
    throwError(400, '수정할 값이 없습니다.');
  }

  const targetClass = await findClass(academyId, classId);

  const changes = {};
  if (name !== undefined) {
    changes.name = parseName(name);
    await assertNameAvailable(academyId, changes.name, classId);
  }
  if (teacherName !== undefined) {
    changes.teacherName = parseTeacherName(teacherName);
  }

  const replaceStudents = studentIds !== undefined;
  const uniqueIds = replaceStudents ? parseStudentIds(studentIds) : [];
  if (replaceStudents) {
    await assertStudentsInAcademy(academyId, uniqueIds);
  }

  await db.sequelize.transaction(async (transaction) => {
    if (Object.keys(changes).length > 0) {
      await targetClass.update(changes, { transaction });
    }

    if (replaceStudents) {
      // 목록에서 빠진 학생은 반 해제 (빈 배열이면 전원 해제)
      const removedWhere = { classId, academyId };
      if (uniqueIds.length > 0) {
        removedWhere.id = { [Op.notIn]: uniqueIds };
      }
      await db.Student.update({ classId: null }, { where: removedWhere, transaction });
      // 새로 들어온 학생은 이 반으로 (다른 반 소속이면 이동)
      if (uniqueIds.length > 0) {
        await db.Student.update(
          { classId },
          { where: { id: { [Op.in]: uniqueIds }, academyId }, transaction },
        );
      }
    }
  });

  const studentCount = await db.Student.count({ where: { classId, academyId } });
  return toResponse(targetClass, studentCount);
}

// 반 삭제 (DB 외래키 ON DELETE SET NULL로 students/exams.class_id만 NULL, 기록은 유지)
async function remove({ academyId, classId }) {
  await assertAcademy(academyId);

  const targetClass = await findClass(academyId, classId);

  const deleted = { id: targetClass.id, name: targetClass.name };
  await targetClass.destroy();

  return deleted;
}

module.exports = { list, create, getById, update, remove };
