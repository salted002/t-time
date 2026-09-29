const authService = require('../services/authService');

async function login(req, res) {
  const { email, password } = req.body;

  const { user, token, academy } = await authService.login(email, password);

  return res.status(200).json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      academySlug: academy.slug,
    },
    token,
    message: '로그인되었습니다.',
  });
}

async function changePassword(req, res) {
  const { userId, academyId } = req.academy;
  const { currentPassword, newPassword, newPasswordConfirm } = req.body;

  await authService.changePassword(userId, academyId, currentPassword, newPassword, newPasswordConfirm);

  return res.status(200).json({
    success: true,
    message: '관리자 비밀번호를 변경하였습니다.',
  });
}

module.exports = { login, changePassword };
