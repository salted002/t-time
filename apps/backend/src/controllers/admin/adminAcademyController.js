const adminAcademyService = require('../../services/admin/adminAcademyService');
const { parsePagination } = require('../../utils/paginationUtil');

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

module.exports = { list };
