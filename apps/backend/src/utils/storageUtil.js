const fs = require('fs');
const path = require('path');
const { BlobServiceClient } = require('@azure/storage-blob');
const config = require('../config/env');

const isAzure = () => config.storage.type === 'azure';

// local 저장 경로: src/ 기준 상대 경로 (기본값 files → src/files)
const LOCAL_DIR = path.resolve(__dirname, '..', config.storage.localPath);

let containerClient = null;
function getContainerClient() {
  if (!containerClient) {
    containerClient = BlobServiceClient.fromConnectionString(
      config.azure.connectionString,
    ).getContainerClient(config.azure.containerName);
  }
  return containerClient;
}

// 응답에 내려줄 파일 URL (azure: Blob URL, local: /files/{filename})
function buildFileUrl(req, filename) {
  if (!filename) return null;
  if (isAzure()) return getContainerClient().getBlobClient(filename).url;
  return `${req.protocol}://${req.get('host')}/files/${filename}`;
}

// 저장된 파일 삭제 (실패해도 요청 흐름에는 영향 없음)
function removeFile(filename) {
  if (isAzure()) {
    getContainerClient()
      .getBlobClient(filename)
      .deleteIfExists()
      .catch((err) => console.error('로고 파일 삭제 실패:', err));
    return;
  }
  fs.unlink(path.join(LOCAL_DIR, filename), (err) => {
    if (err) console.error('로고 파일 삭제 실패:', err);
  });
}

module.exports = { isAzure, LOCAL_DIR, buildFileUrl, removeFile };
