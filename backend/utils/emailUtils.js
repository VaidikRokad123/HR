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

export const sendPasswordResetEmail = async (toEmail, userName, otp) => {
  try {
    console.log(`[Email] Sending password reset OTP to ${toEmail}`);

    const transporter = await createTransporter();

    const mailOptions = {
      from: `"HR Portal Support" <${getSenderEmail()}>`,
      to: toEmail,
      subject: 'Password Reset Request - HR Portal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <div style="background-color: #f7941d; padding: 20px; text-align: center;">
            <h2 style="color: white; margin: 0; font-size: 24px;">HR Management Portal</h2>
          </div>
          <div style="padding: 30px; background-color: #ffffff;">
            <p style="font-size: 16px; color: #333;">Hello <strong>${userName || 'there'}</strong>,</p>
            <p style="font-size: 16px; color: #555; line-height: 1.5;">
              We received a request to reset the password for your HR Portal account.
              Please use the following One-Time Password (OTP) to complete your password reset process.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="display: inline-block; padding: 15px 30px; background-color: #f8f9fa; border: 2px dashed #f7941d; border-radius: 6px; font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #333;">
                ${otp}
              </span>
            </div>
            <p style="font-size: 14px; color: #777; line-height: 1.5;">
              This OTP is valid for <strong>15 minutes</strong>. For your security, do not share this code with anyone.
            </p>
            <p style="font-size: 14px; color: #777; line-height: 1.5;">
              If you did not request a password reset, please ignore this email or contact the IT administrator if you have concerns.
            </p>
            <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
            <p style="font-size: 12px; color: #aaa; text-align: center;">
              This is an automated message, please do not reply.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`[Email] Password reset OTP sent to ${toEmail}. Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('[Email] Password reset email failed:', error.message);
    if (error.response) console.error('[Email] Provider response:', error.response);
    if (error.responseCode) console.error('[Email] Provider response code:', error.responseCode);
    return false;
  }
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
