const academyService = require('../services/academyService');

const { buildFileUrl: buildLogoUrl } = require('../utils/storageUtil');

async function checkAvailability(req, res) {
  const { slug, businessNumber } = req.body;

  const { available, reasons } = await academyService.checkAvailability(slug, businessNumber);

  return res.status(200).json({
    success: true,
    available,
    reasons,
    message: '확인 완료',
  });
}

async function signup(req, res) {
  const logoFilename = req.file ? req.file.filename : null;

  const { academy, user, token } = await academyService.signup(req.body, logoFilename);

  return res.status(201).json({
    success: true,
    academy: {
      id: academy.id,
      name: academy.name,
      slug: academy.slug,
      businessNumber: academy.businessNumber,
      ownerName: academy.ownerName,
      phone: academy.phone,
      address: academy.address,
      logoUrl: buildLogoUrl(req, academy.logoUrl),
      smsSenderNumber: academy.smsSenderNumber,
      subscriptionStatus: academy.subscriptionStatus,
      createdAt: academy.createdAt,
    },
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
    token,
    message: '학원 계정이 개설되었습니다.',
  });
}

async function updateAcademy(req, res) {
  const { academyId } = req.academy;

  const academy = await academyService.updateAcademy(academyId, req.body, req.file);

  return res.status(200).json({
    success: true,
    academy: {
      id: academy.id,
      name: academy.name,
      slug: academy.slug,
      businessNumber: academy.businessNumber,
      ownerName: academy.ownerName,
      phone: academy.phone,
      address: academy.address,
      logoUrl: buildLogoUrl(req, academy.logoUrl),
      smsSenderNumber: academy.smsSenderNumber,
      subscriptionStatus: academy.subscriptionStatus,
      updatedAt: academy.updatedAt,
    },
    message: '학원 정보가 수정되었습니다.',
  });
}

async function deleteAcademy(req, res) {
  const { academyId } = req.academy;

  await academyService.deleteAcademy(academyId);

  return res.status(200).json({
    success: true,
    message: '학원 계정이 삭제되었습니다.',
  });
}

module.exports = { checkAvailability, signup, updateAcademy, deleteAcademy };