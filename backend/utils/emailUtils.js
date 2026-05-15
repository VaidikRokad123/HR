import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const OAuth2 = google.auth.OAuth2;

const createTransporter = async () => {
  console.log('📧 Creating email transporter...');
  
  // Validate email configuration
  const requiredEmailVars = [
    'EMAIL_CLIENT_ID',
    'EMAIL_CLIENT_SECRET',
    'EMAIL_REFRESH_TOKEN',
    'EMAIL_CLIENT_MAIL'
  ];
  
  console.log('🔍 Checking email environment variables...');
  requiredEmailVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${varName === 'EMAIL_CLIENT_MAIL' ? value : '***' + value.slice(-10)}`);
    } else {
      console.error(`❌ ${varName}: NOT SET`);
    }
  });
  
  const missingVars = requiredEmailVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing email configuration variables:', missingVars.join(', '));
    throw new Error(`Email configuration incomplete. Missing: ${missingVars.join(', ')}`);
  }

  console.log('🔐 Creating OAuth2 client...');
  const oauth2Client = new OAuth2(
    process.env.EMAIL_CLIENT_ID,
    process.env.EMAIL_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground" // standard redirect URI
  );

  console.log('🎫 Setting OAuth2 credentials...');
  oauth2Client.setCredentials({
    refresh_token: process.env.EMAIL_REFRESH_TOKEN,
  });

  console.log('🔑 Requesting access token...');
  const accessToken = await new Promise((resolve, reject) => {
    oauth2Client.getAccessToken((err, token) => {
      if (err) {
        console.error("❌ Failed to create access token");
        console.error("Error name:", err.name);
        console.error("Error message:", err.message);
        console.error("Error code:", err.code);
        console.error("Full error:", JSON.stringify(err, null, 2));
        reject(new Error("Failed to create access token: " + err.message));
      } else {
        console.log("✅ Access token obtained successfully");
        resolve(token);
      }
    });
  });

  console.log('📮 Creating nodemailer transporter...');
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.EMAIL_CLIENT_MAIL,
      accessToken,
      clientId: process.env.EMAIL_CLIENT_ID,
      clientSecret: process.env.EMAIL_CLIENT_SECRET,
      refreshToken: process.env.EMAIL_REFRESH_TOKEN,
    },
  });

  console.log('✅ Email transporter created successfully');
  return transporter;
};

export const sendPasswordResetEmail = async (toEmail, userName, otp) => {
  try {
    console.log('═══════════════════════════════════════════════════');
    console.log('📧 EMAIL SENDING PROCESS STARTED');
    console.log('═══════════════════════════════════════════════════');
    console.log(`📬 To: ${toEmail}`);
    console.log(`👤 User: ${userName}`);
    console.log(`🔢 OTP: ${otp}`);
    console.log('───────────────────────────────────────────────────');
    
    const transporter = await createTransporter();

    console.log('📝 Preparing email content...');
    const mailOptions = {
      from: `"HR Portal Support" <${process.env.EMAIL_CLIENT_MAIL}>`,
      to: toEmail,
      subject: "Password Reset Request - HR Portal",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <div style="background-color: #f7941d; padding: 20px; text-align: center;">
            <h2 style="color: white; margin: 0; font-size: 24px;">HR Management Portal</h2>
          </div>
          <div style="padding: 30px; background-color: #ffffff;">
            <p style="font-size: 16px; color: #333;">Hello <strong>${userName}</strong>,</p>
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

    console.log('📤 Sending email...');
    const info = await transporter.sendMail(mailOptions);
    
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ EMAIL SENT SUCCESSFULLY');
    console.log('═══════════════════════════════════════════════════');
    console.log(`📨 Message ID: ${info.messageId}`);
    console.log(`📬 Accepted: ${info.accepted?.join(', ')}`);
    console.log(`📭 Rejected: ${info.rejected?.join(', ') || 'None'}`);
    console.log(`📊 Response: ${info.response}`);
    console.log('═══════════════════════════════════════════════════');
    
    return true;
  } catch (error) {
    console.error('═══════════════════════════════════════════════════');
    console.error('❌ EMAIL SENDING FAILED');
    console.error('═══════════════════════════════════════════════════');
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Error stack:", error.stack);
    
    if (error.response) {
      console.error("───────────────────────────────────────────────────");
      console.error("Email service response:", error.response);
    }
    
    if (error.responseCode) {
      console.error("Response code:", error.responseCode);
    }
    
    if (error.command) {
      console.error("Failed command:", error.command);
    }
    
    console.error('═══════════════════════════════════════════════════');
    
    return false;
  }
};
