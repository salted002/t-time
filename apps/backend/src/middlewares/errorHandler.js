const { Sequelize } = require("sequelize");
const multer = require("multer");

function errorHandler(err, req, res, next) {
  console.error("======error handler========");
  console.error(err.message);

  if (err.statusCode) {
    return res
      .status(err.statusCode)
      .json({ success: false, message: err.message });
  } else if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "파일 크기는 5MB를 넘을 수 없습니다."
        : "파일 업로드 요청이 올바르지 않습니다.";
    return res.status(400).json({ success: false, message });
  } else if (err instanceof Sequelize.UniqueConstraintError) {
    return res
      .status(409)
      .json({
        success: false,
        message: "Unique constraint violation: duplicate data",
      });
  } else if (err instanceof Sequelize.ValidationError) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Validation error: invalid data format",
      });
  } else if (err instanceof Sequelize.ForeignKeyConstraintError) {
    return res
      .status(400)
      .json({ success: false, message: "Foreign key constraint error" });
  } else if (
    err instanceof Sequelize.ConnectionError ||
    err instanceof Sequelize.ConnectionRefusedError
  ) {
    return res
      .status(500)
      .json({ success: false, message: "Database connection error" });
  } else if (err instanceof Sequelize.TimeoutError) {
    return res
      .status(504)
      .json({ success: false, message: "Internal Server Error" });
  } else {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
}

module.exports = errorHandler;
