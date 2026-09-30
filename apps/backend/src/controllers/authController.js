const authService = require('../services/authService');

function buildLogoUrl(req, filename) {
  return filename ? `${req.protocol}://${req.get('host')}/files/${filename}` : null;
}

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
    academy: {
      slug: academy.slug,
      name: academy.name,
    },
    isDemo: false,
    message: '로그인에 성공했습니다.',
  });
}

async function getMe(req, res) {
  const { userId, academyId } = req.academy;

  const { user, academy } = await authService.getMe(userId, academyId);

  return res.status(200).json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    academy: {
      id: academy.id,
      name: academy.name,
      slug: academy.slug,
      logoUrl: buildLogoUrl(req, academy.logoUrl),
      subscriptionStatus: academy.subscriptionStatus,
    },
    isDemo: false,
    message: '내 정보 조회를 성공했습니다.',
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

module.exports = { login, changePassword, getMe };
