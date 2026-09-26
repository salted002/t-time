const authService = require('../services/authService');

async function login(req, res) {
  const { email, password } = req.body;

  const { user, token } = await authService.login(email, password);

  return res.status(200).json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    token,
    message: '로그인되었습니다.',
  });
}

module.exports = { login };
