const adminAuthService = require('../../services/admin/adminAuthService');

async function login(req, res) {
  const { email, password } = req.body;

  const { admin, token } = await adminAuthService.login(email, password);

  return res.status(200).json({
    success: true,
    token,
    admin: {
      id: admin.id,
      email: admin.email,
    },
    message: '로그인에 성공했습니다.',
  });
}

module.exports = { login };
