const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { MulterAzureStorage } = require('multer-azure-blob-storage');
const config = require('../config/env');
const { LOCAL_DIR } = require('../utils/storageUtil');

// 파일명 생성: 원본명 + UUID + 확장자
function generateFilename(file) {
  const ext = path.extname(file.originalname);
  const baseName = path.basename(file.originalname, ext);
  return `${baseName}${crypto.randomUUID()}${ext}`;
}

// Azure Blob Storage
// multer-azure-blob-storage는 file.blobName만 채우므로, 기존 코드가 쓰는 file.filename에도 맞춰준다.
function createAzureStorage() {
  const azureStorage = new MulterAzureStorage({
    connectionString: config.azure.connectionString,
    containerName: config.azure.containerName,
    blobName: (req, file) => Promise.resolve(generateFilename(file)),
    containerAccessLevel: 'blob',
  });

  return {
    _handleFile(req, file, done) {
      azureStorage._handleFile(req, file, (error, info) => {
        if (error) return done(error);
        done(null, { ...info, filename: info.blobName });
      });
    },
    _removeFile(req, file, done) {
      azureStorage._removeFile(req, { ...file, blobName: file.blobName || file.filename }, done);
    },
  };
}

// Local Disk Storage
function createLocalStorage() {
  fs.mkdirSync(LOCAL_DIR, { recursive: true });

  return multer.diskStorage({
    destination: (req, file, done) => {
      done(null, LOCAL_DIR);
    },
    filename: (req, file, done) => {
      done(null, generateFilename(file));
    },
  });
}

const storage = config.storage.type === 'azure' ? createAzureStorage() : createLocalStorage();

const fileFilter = (req, file, done) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    done(null, true);
  } else {
    const error = new Error('허용되지 않는 파일 형식입니다.');
    error.statusCode = 400;
    done(error);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = upload;
