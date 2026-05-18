import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const OAuth2 = google.auth.OAuth2;

const mask = (value = '') => {
  if (!value) return 'NOT SET';
  return value.length <= 8 ? '***' : `***${value.slice(-8)}`;
};

const hasAllEnv = (names) => names.every((name) => Boolean(process.env[name]));

const getSenderEmail = () => process.env.EMAIL_CLIENT_MAIL || process.env.EMAIL_USER;

const createOAuthTransporter = async () => {
  const oauth2Client = new OAuth2(
    process.env.EMAIL_CLIENT_ID,
    process.env.EMAIL_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.EMAIL_REFRESH_TOKEN,
  });

  const accessTokenResponse = await oauth2Client.getAccessToken();
  const token =
    typeof accessTokenResponse === 'string'
      ? accessTokenResponse
      : accessTokenResponse?.token;

  if (!token) {
    throw new Error('Failed to create Gmail OAuth access token.');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.EMAIL_CLIENT_MAIL,
      accessToken: token,
      clientId: process.env.EMAIL_CLIENT_ID,
      clientSecret: process.env.EMAIL_CLIENT_SECRET,
      refreshToken: process.env.EMAIL_REFRESH_TOKEN,
    },
  });
};

const createAppPasswordTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
};

const createTransporter = async () => {
  const oauthVars = [
    'EMAIL_CLIENT_ID',
    'EMAIL_CLIENT_SECRET',
    'EMAIL_REFRESH_TOKEN',
    'EMAIL_CLIENT_MAIL',
  ];
  const appPasswordVars = ['EMAIL_USER', 'EMAIL_APP_PASSWORD'];

  console.log('[Email] Checking email configuration...');
  console.log(`[Email] EMAIL_CLIENT_MAIL: ${process.env.EMAIL_CLIENT_MAIL || 'NOT SET'}`);
  console.log(`[Email] EMAIL_CLIENT_ID: ${mask(process.env.EMAIL_CLIENT_ID)}`);
  console.log(`[Email] EMAIL_CLIENT_SECRET: ${mask(process.env.EMAIL_CLIENT_SECRET)}`);
  console.log(`[Email] EMAIL_REFRESH_TOKEN: ${mask(process.env.EMAIL_REFRESH_TOKEN)}`);
  console.log(`[Email] EMAIL_USER: ${process.env.EMAIL_USER || 'NOT SET'}`);

  if (hasAllEnv(oauthVars)) {
    console.log('[Email] Using Gmail OAuth2 transporter.');
    return createOAuthTransporter();
  }

  if (hasAllEnv(appPasswordVars)) {
    console.log('[Email] Using Gmail app-password transporter.');
    return createAppPasswordTransporter();
  }

  throw new Error(
    'Email configuration incomplete. Set OAuth2 vars (EMAIL_CLIENT_ID, EMAIL_CLIENT_SECRET, EMAIL_REFRESH_TOKEN, EMAIL_CLIENT_MAIL) or app-password vars (EMAIL_USER, EMAIL_APP_PASSWORD).'
  );
};

/**
 * Generic email sender used by the RabbitMQ email consumer for automated HR reminders.
 */
export const sendEmail = async (toEmail, subject, htmlBody) => {
  try {
    const transporter = await createTransporter();

    const info = await transporter.sendMail({
      from: `"Saeculum HRMS" <${getSenderEmail()}>`,
      to: toEmail,
      subject,
      html: htmlBody,
    });

    console.log(`[Email] Sent to ${toEmail} | Subject: ${subject} | ID: ${info.messageId}`);
  } catch (err) {
    console.error(`[Email] Failed to send to ${toEmail}:`, err.message);
    throw err;
  }
};
