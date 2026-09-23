const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const db = require('../db/models');
const config = require('../config/env');

function throwError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

async function checkAvailability(slug, businessNumber) {
  if (!slug) {
    throwError(400, 'slug는 필수입니다.');
  }

  const existingSlug = await db.Academy.findOne({ where: { slug, deletedAt: null } });

  let businessNumberAvailable = true;
  if (businessNumber) {
    const existingBusinessNumber = await db.Academy.findOne({ where: { businessNumber, deletedAt: null } });
    businessNumberAvailable = !existingBusinessNumber;
  }

  return {
    slug: !existingSlug,
    businessNumber: businessNumberAvailable,
  };
}

async function signup(signupData, logoFilename) {
  const {
    academyName,
    businessNumber,
    ownerName,
    phone,
    slug,
    address,
    senderNumber,
    name,
    email,
    password,
    passwordConfirm,
  } = signupData;

  const requiredFields = { academyName, businessNumber, ownerName, phone, slug, name, email, password, passwordConfirm };
  const missingField = Object.entries(requiredFields).find(([, value]) => !value);

  if (missingField) { 
    throwError(400, `${missingField[0]}은(는) 필수입니다.`); // 객체로 묶어서 누락된 필드 이름까지 에러 메시지에 넣음
  }

  if (password !== passwordConfirm) {
    throwError(400, '비밀번호가 일치하지 않습니다.');
  }

  const [existingSlug, existingBusinessNumber, existingEmail] = await Promise.all([
    db.Academy.findOne({ where: { slug, deletedAt: null } }),
    db.Academy.findOne({ where: { businessNumber, deletedAt: null } }),
    db.User.findOne({ where: { email } }),
  ]);

  if (existingSlug) throwError(409, '이미 사용 중인 슬러그입니다.');
  if (existingBusinessNumber) throwError(409, '이미 사용 중인 사업자번호입니다.');
  if (existingEmail) throwError(409, '이미 사용 중인 이메일입니다.');

  const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);

  const result = await db.sequelize.transaction(async (t) => {
    const academy = await db.Academy.create(
      {
        name: academyName,
        slug,
        businessNumber,
        ownerName,
        phone,
        address: address || null,
        smsSenderNumber: senderNumber || null,
        logoUrl: logoFilename,
        subscriptionStatus: 'FREE',
      },
      { transaction: t }
    );

    const user = await db.User.create(
      { academyId: academy.id, name, email, passwordHash },
      { transaction: t }
    );

    return { academy, user };
  });

  const token = jwt.sign(
    { userId: result.user.id, academyId: result.academy.id, email: result.user.email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  return { academy: result.academy, user: result.user, token };
}

async function updateAcademy(academyId, updateData, file) {
  const { phone, address, slug, senderNumber } = updateData;

  const academy = await db.Academy.findOne({ where: { id: academyId, deletedAt: null } });
  if (!academy) throwError(404, '학원을 찾을 수 없습니다.');

  if (slug && slug !== academy.slug) {
    const existingSlug = await db.Academy.findOne({ where: { slug, deletedAt: null } });
    if (existingSlug) throwError(409, '이미 사용 중인 슬러그입니다.');
  }

  const updateFields = {};
  if (phone !== undefined) updateFields.phone = phone;
  if (address !== undefined) updateFields.address = address;
  if (slug !== undefined) updateFields.slug = slug;
  if (senderNumber !== undefined) updateFields.smsSenderNumber = senderNumber;

  if (file) {
    const oldLogoFilename = academy.logoUrl;
    updateFields.logoUrl = file.filename;

    if (oldLogoFilename) {
      const oldLogoPath = path.join(__dirname, '../files', oldLogoFilename);
      fs.unlink(oldLogoPath, (err) => {
        if (err) console.error('이전 로고 파일 삭제 실패:', err);
      });
    }
  }

  await academy.update(updateFields);

  return academy;
}

async function deleteAcademy(userId, academyId, password) {
  if (!password) throwError(400, '비밀번호는 필수입니다.');

  const academy = await db.Academy.findOne({ where: { id: academyId, deletedAt: null } });
  if (!academy) throwError(404, '학원을 찾을 수 없습니다.');

  const user = await db.User.findOne({ where: { id: userId } });
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) throwError(401, '비밀번호가 일치하지 않습니다.');

  await academy.update({ deletedAt: new Date() });
}

module.exports = { checkAvailability, signup, updateAcademy, deleteAcademy };