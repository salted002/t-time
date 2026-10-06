const adminAcademyService = require('../../services/admin/adminAcademyService');
const { parsePagination } = require('../../utils/paginationUtil');
const { buildFileUrl: buildLogoUrl } = require('../../utils/storageUtil');

async function list(req, res) {
  const { q } = req.query;
  const { page, size, limit, offset } = parsePagination(req.query);

  const { academies, count } = await adminAcademyService.list({ q, limit, offset });

  return res.status(200).json({
    success: true,
    academies,
    count,
    page,
    size,
    message: '학원 목록 조회 성공',
  });
}

function serializeAcademy(req, academy) {
  return {
    id: academy.id,
    name: academy.name,
    slug: academy.slug,
    phone: academy.phone,
    address: academy.address,
    businessNumber: academy.businessNumber,
    ownerName: academy.ownerName,
    logoUrl: buildLogoUrl(req, academy.logoUrl),
    smsSenderNumber: academy.smsSenderNumber,
    subscriptionStatus: academy.subscriptionStatus,
  };
}

function serializeUser(user) {
  return user ? { id: user.id, name: user.name, email: user.email } : null;
}

async function detail(req, res) {
  const { academy, user } = await adminAcademyService.detail(req.params.academyId);

  return res.status(200).json({
    success: true,
    academy: serializeAcademy(req, academy),
    user: serializeUser(user),
    message: '학원 상세 조회 성공',
  });
}

async function update(req, res) {
  const { academy, user } = await adminAcademyService.update(
    req.params.academyId,
    req.body,
    req.file,
  );

  return res.status(200).json({
    success: true,
    academy: serializeAcademy(req, academy),
    user: serializeUser(user),
    message: '학원 정보가 수정되었습니다.',
  });
}

async function remove(req, res) {
  await adminAcademyService.remove(req.params.academyId);

  return res.status(200).json({
    success: true,
    message: '학원 정보가 삭제되었습니다.',
  });
}

module.exports = { list, detail, update, remove };
