import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import createHttpError from 'http-errors';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import fs from 'node:fs';
import path from 'node:path';
import Handlebars from 'handlebars';

import { User } from '../models/user.js';
import { Session } from '../models/session.js';

const REQUEST_PASSWORD_RESET_TEMPLATE = fs.readFileSync(
  path.resolve('src/templates/request-password-reset.html'),
  { encoding: 'utf-8' },
);

const ACCESS_TTL_MS = 15 * 60 * 1000;
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export async function registerUser(payload) {
  const existingUser = await User.findOne({ email: payload.email });

  if (existingUser !== null) {
    throw createHttpError(409, 'Email in use');
  }

  const hashedPassword = await bcrypt.hash(payload.password, 10);

  const newUser = await User.create({
    ...payload,
    password: hashedPassword,
  });

  return newUser;
}

export async function loginUser(email, password) {
  const user = await User.findOne({ email });

  if (user === null) {
    throw new createHttpError.Unauthorized('Email or password is incorrect');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (isMatch !== true) {
    throw new createHttpError.Unauthorized('Email or password is incorrect');
  }

  await Session.deleteOne({ userId: user._id });

  const accessToken = crypto.randomBytes(30).toString('base64');
  const refreshToken = crypto.randomBytes(30).toString('base64');

  const session = await Session.create({
    userId: user._id.toString(),
    accessToken,
    refreshToken,
    accessTokenValidUntil: new Date(Date.now() + ACCESS_TTL_MS),
    refreshTokenValidUntil: new Date(Date.now() + REFRESH_TTL_MS),
  });

  return { session, accessToken, refreshToken };
}

export async function logoutUser(sessionId) {
  await Session.deleteOne({ _id: sessionId });
}

export async function refreshSession(refreshToken) {
  const session = await Session.findOne({ refreshToken });

  if (session === null) {
    throw new createHttpError.Unauthorized('Session not found');
  }

  if (session.refreshToken !== refreshToken) {
    throw new createHttpError.Unauthorized('Refresh token is invalid');
  }

  if (session.refreshTokenValidUntil < new Date()) {
    await Session.deleteOne({ _id: session._id });
    throw new createHttpError.Unauthorized('Refresh token is expired');
  }

  await Session.deleteOne({ _id: session._id });

  const accessToken = crypto.randomBytes(30).toString('base64');
  const newRefreshToken = crypto.randomBytes(30).toString('base64');

  const newSession = await Session.create({
    userId: session.userId,
    accessToken,
    refreshToken: newRefreshToken,
    accessTokenValidUntil: new Date(Date.now() + ACCESS_TTL_MS),
    refreshTokenValidUntil: new Date(Date.now() + REFRESH_TTL_MS),
  });

  return { accessToken, refreshToken: newRefreshToken, session: newSession };
}

export async function sendResetPasswordEmailService(email) {
  const user = await User.findOne({ email });

  if (!user) {
    throw new createHttpError.NotFound('User not found!');
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new createHttpError.InternalServerError('JWT_SECRET is missing');
  }

  const token = jwt.sign({ email }, secret, { expiresIn: '5m' });

  const frontendDomain = process.env.APP_DOMAIN;
  const resetPasswordLink = `${frontendDomain.replace(
    /\/+$/,
    '',
  )}/reset-password?token=${token}`;

  const template = Handlebars.compile(REQUEST_PASSWORD_RESET_TEMPLATE);
  const html = template({ resetPasswordLink });

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } =
    process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD || !SMTP_FROM) {
    throw new createHttpError.InternalServerError(
      'SMTP configuration is incomplete',
    );
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });

  try {
    await transporter.sendMail({
      from: SMTP_FROM,
      to: email,
      subject: 'Reset password instruction',
      html,
    });
  } catch (err) {
    console.error('Failed to send email:', err);
    throw new createHttpError.InternalServerError(
      'Failed to send the email, please try again later.',
    );
  }

  return {};
}

export async function resetPassword(token, newPassword) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new createHttpError.InternalServerError('JWT_SECRET is missing');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, secret);
  } catch (err) {
    throw new createHttpError(401, 'Token is expired or invalid.');
  }

  const { email } = decoded;

  const user = await User.findOne({ email });
  if (!user) {
    throw new createHttpError.NotFound('User not found!');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await User.findByIdAndUpdate(user._id, { password: hashedPassword });

  await Session.deleteMany({ userId: user._id });

  return {};
}
