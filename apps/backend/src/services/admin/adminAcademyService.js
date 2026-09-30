const { Op } = require('sequelize');
const db = require('../../db/models');

function buildSearchWhere(q) {
  const where = { deletedAt: null };
  const keyword = typeof q === 'string' ? q.trim() : '';
  if (keyword) {
    where.name = { [Op.iLike]: `%${keyword}%` };
  }
  return where;
}

async function list({ q, limit, offset }) {
  const { rows, count } = await db.Academy.findAndCountAll({
    where: buildSearchWhere(q),
    include: [{ model: db.User, attributes: ['email'], required: false }],
    order: [
      ['createdAt', 'DESC'],
      ['name', 'ASC'],
    ],
    limit,
    offset,
  });

  const academyIds = rows.map((academy) => academy.id);

  const studentCounts = academyIds.length
    ? await db.Student.findAll({
        attributes: ['academyId', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'studentCount']],
        where: { academyId: { [Op.in]: academyIds }, status: '재원' },
        group: ['academyId'],
        raw: true,
      })
    : [];

  const studentCountMap = new Map(studentCounts.map((row) => [row.academyId, Number(row.studentCount)]));

  const academies = rows.map((academy) => ({
    id: academy.id,
    name: academy.name,
    phone: academy.phone,
    ownerName: academy.ownerName,
    studentCount: studentCountMap.get(academy.id) || 0,
    loginEmail: academy.User ? academy.User.email : null,
  }));

  return { academies, count };
}

module.exports = { list };
