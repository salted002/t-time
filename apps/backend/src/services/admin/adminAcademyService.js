const { Op } = require('sequelize');
const db = require('../../db/models');
const { hashPassword } = require('../../utils/passwordUtil');
const { removeFile: removeLogoFile } = require('../../utils/storageUtil');

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

function throwError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function findActiveAcademy(academyId, options = {}) {
  // UUID 형식이 아니면 Postgres 오류(500) 대신 404로 처리한다.
  if (!UUID_REGEX.test(academyId)) throwError(404, '학원을 찾을 수 없습니다.');

  const academy = await db.Academy.findOne({
    where: { id: academyId, deletedAt: null },
    include: [{ model: db.User, required: false, where: { deleted_at: null } }],
    ...options,
  });
  if (!academy) throwError(404, '학원을 찾을 수 없습니다.');
  return academy;
}

async function detail(academyId) {
  const academy = await findActiveAcademy(academyId);
  return { academy, user: academy.User || null };
}

async function update(academyId, updateData, file) {
  try {
    const { name, slug, phone, address, businessNumber, ownerName, senderNumber } = updateData;
    const { userName, userEmail, userPassword } = updateData;

    const academy = await findActiveAcademy(academyId);
    const user = academy.User;

    // 필수 컬럼(allowNull: false)은 빈 값으로 덮어쓰지 않는다.
    const requiredFields = { name, slug, phone, businessNumber, ownerName, userName, userEmail };
    const emptyField = Object.entries(requiredFields).find(
      ([, value]) => value !== undefined && !String(value).trim(),
    );
    if (emptyField) throwError(400, `${emptyField[0]}은(는) 비워둘 수 없습니다.`);

    if (slug !== undefined && slug !== academy.slug) {
      const existing = await db.Academy.findOne({ where: { slug, deletedAt: null } });
      if (existing) throwError(409, '이미 사용 중인 슬러그입니다.');
    }
    if (businessNumber !== undefined && businessNumber !== academy.businessNumber) {
      const existing = await db.Academy.findOne({ where: { businessNumber, deletedAt: null } });
      if (existing) throwError(409, '이미 사용 중인 사업자번호입니다.');
    }
    if (userEmail !== undefined && user && userEmail !== user.email) {
      const existing = await db.User.findOne({ where: { email: userEmail, deleted_at: null } });
      if (existing) throwError(409, '이미 사용 중인 이메일입니다.');
    }

    const academyFields = {};
    if (name !== undefined) academyFields.name = name;
    if (slug !== undefined) academyFields.slug = slug;
    if (phone !== undefined) academyFields.phone = phone;
    if (address !== undefined) academyFields.address = address || null;
    if (businessNumber !== undefined) academyFields.businessNumber = businessNumber;
    if (ownerName !== undefined) academyFields.ownerName = ownerName;
    if (senderNumber !== undefined) academyFields.smsSenderNumber = senderNumber || null;

    const oldLogoFilename = file ? academy.logoUrl : null;
    if (file) academyFields.logoUrl = file.filename;

    const userFields = {};
    if (userName !== undefined) userFields.name = userName;
    if (userEmail !== undefined) userFields.email = userEmail;
    // 비밀번호는 비워두면 변경하지 않는다.
    if (userPassword) userFields.passwordHash = await hashPassword(userPassword);

    await db.sequelize.transaction(async (t) => {
      await academy.update(academyFields, { transaction: t });
      if (user && Object.keys(userFields).length > 0) {
        await user.update(userFields, { transaction: t });
      }
    });

    if (oldLogoFilename) removeLogoFile(oldLogoFilename);

    return { academy, user };
  } catch (error) {
    if (file) removeLogoFile(file.filename);
    throw error;
  }
}

// 소프트 삭제: 학원과 소속 사용자에 deleted_at을 기록한다.
async function remove(academyId) {
  const academy = await findActiveAcademy(academyId, { include: [] });

  const deletedAt = new Date();
  await db.sequelize.transaction(async (t) => {
    await academy.update({ deletedAt }, { transaction: t });
    await db.User.update({ deleted_at: deletedAt }, { where: { academyId }, transaction: t });
  });
}

module.exports = { list, detail, update, remove };
