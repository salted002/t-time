const fs = require('fs');
const path = require('path');
const { isAzure, LOCAL_DIR, buildFileUrl } = require('../utils/storageUtil');

function throwError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

async function getFile(req, res) {
  const filename = path.basename(req.params.filename);

  if (isAzure()) {
    return res.redirect(buildFileUrl(req, filename));
  }

  const filePath = path.join(LOCAL_DIR, filename);

  if (!fs.existsSync(filePath)) {
    throwError(404, '파일을 찾을 수 없습니다.');
  }

  return res.sendFile(filePath);
}

module.exports = { getFile };
