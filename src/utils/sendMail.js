import nodemailer from 'nodemailer';
import createHttpError from 'http-errors';
import { getEnvVariable } from './getEnvVariable.js'; // якщо маєш утиліту для безпечного читання змінних

export async function sendMail({ to, subject, html }) {
  const transporter = nodemailer.createTransport({
    host: getEnvVariable('SMTP_HOST'),
    port: Number(getEnvVariable('SMTP_PORT')),
    secure: Number(getEnvVariable('SMTP_PORT')) === 465,
    auth: {
      user: getEnvVariable('SMTP_USER'),
      pass: getEnvVariable('SMTP_PASSWORD'),
    },
  });

  try {
    await transporter.sendMail({
      from: getEnvVariable('SMTP_FROM'),
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error('Email sending error:', error);
    throw new createHttpError.InternalServerError(
      'Failed to send the email, please try again later.',
    );
  }
}
