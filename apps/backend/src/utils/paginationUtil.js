const DEFAULT_PAGE = 1;
const DEFAULT_SIZE = 20;
const MAX_SIZE = 200;

function parsePagination(query = {}) {
  const rawPage = Number.parseInt(query.page, 10);
  const rawSize = Number.parseInt(query.size, 10);

  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : DEFAULT_PAGE;
  const size = Number.isInteger(rawSize) && rawSize > 0 ? Math.min(rawSize, MAX_SIZE) : DEFAULT_SIZE;

  return {
    page,
    size,
    limit: size,
    offset: (page - 1) * size,
  };
}

module.exports = { parsePagination, DEFAULT_PAGE, DEFAULT_SIZE, MAX_SIZE };
