import {
  registerUser,
  loginUser,
  refreshSession,
  logoutUser,
  sendResetPasswordEmailService,
  resetPassword,
} from '../services/auth.js';

const isProd = process.env.NODE_ENV === 'production';

export const registerUserController = async (req, res) => {
  const user = await registerUser(req.body);
  const { password, ...safe } = user.toObject ? user.toObject() : user;

  res.status(201).json({
    status: 201,
    message: 'Successfully registered a user!',
    data: safe,
  });
};

export async function loginUserController(req, res) {
  const { email, password } = req.body;

  const { accessToken, refreshToken, session } = await loginUser(
    email,
    password,
  );

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    expires: session.refreshTokenValidUntil,
    path: '/',
  });

  res.cookie('sessionId', session._id.toString(), {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    expires: session.refreshTokenValidUntil,
    path: '/',
  });

  return res.status(200).json({
    status: 200,
    message: 'Successfully logged in an user!',
    data: { accessToken },
  });
}

export async function refreshSessionController(req, res) {
  const { refreshToken } = req.cookies || {};
  if (!refreshToken) {
    return res.status(401).json({ message: 'No refresh token provided' });
  }

  const {
    accessToken,
    refreshToken: newRefreshToken,
    session,
  } = await refreshSession(refreshToken);

  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    expires: session.refreshTokenValidUntil,
    path: '/',
  });

  res.cookie('sessionId', session._id.toString(), {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    expires: session.refreshTokenValidUntil,
    path: '/',
  });

  return res.status(200).json({
    status: 200,
    message: 'Successfully refreshed a session!',
    data: { accessToken },
  });
}

export async function logoutUserController(req, res) {
  const { sessionId } = req.cookies;

  if (typeof sessionId === 'string') {
    await logoutUser(sessionId);
  }

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/',
  });
  res.clearCookie('sessionId', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/',
  });

  return res.status(204).end();
}

export async function sendResetPasswordEmailController(req, res) {
  const { email } = req.body;

  await sendResetPasswordEmailService(email);

  res.status(200).json({
    status: 200,
    message: 'Reset password email has been successfully sent.',
    data: {},
  });
}

export async function resetPasswordController(req, res) {
  const { token, password } = req.body;

  await resetPassword(token, password);

  res.status(200).json({
    status: 200,
    message: 'Password has been successfully reset.',
    data: {},
  });
}
