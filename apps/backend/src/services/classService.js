const { fn, col } = require('sequelize');
const db = require('../db/models');

function throwError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

// 반 목록 조회 (페이지네이션 없음, 반 이름 오름차순)
async function list({ academyId }) {
  const academy = await db.Academy.findOne({ where: { id: academyId, deletedAt: null } });
  if (!academy) {
    throwError(401, '유효하지 않은 토큰입니다.');
  }

  const rows = await db.Class.findAll({
    where: { academyId },
    attributes: ['id', 'name', 'teacherName', [fn('COUNT', col('Students.id')), 'studentCount']],
    include: [{ model: db.Student, attributes: [], required: false }],
    group: ['Class.id'],
    order: [['name', 'ASC']],
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    teacherName: row.teacherName,
    studentCount: Number(row.get('studentCount')),
  }));
}

module.exports = { list };
