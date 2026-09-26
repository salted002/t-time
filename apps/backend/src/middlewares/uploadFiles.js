const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const UPLOAD_DIR = path.join(__dirname, '../files');

try {
  fs.readdirSync(UPLOAD_DIR);
} catch (error) {
  fs.mkdirSync(UPLOAD_DIR);
}

const storage = multer.diskStorage({
  destination: (req, file, done) => {
    done(null, UPLOAD_DIR);
  },
  filename: (req, file, done) => {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const uniqueName = `${baseName}${crypto.randomUUID()}${ext}`;
    done(null, uniqueName);
  },
});

const fileFilter = (req, file, done) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    done(null, true);
  } else {
    done(new Error('허용되지 않는 파일 형식입니다.'));
  }
};

const uploadFiles = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = uploadFiles;