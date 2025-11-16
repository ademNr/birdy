import nodemailer from 'nodemailer';

// Check if SMTP is configured
function isSMTPConfigured(): boolean {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASSWORD
  );
}

// Create transporter only if SMTP is configured
let transporter: nodemailer.Transporter | null = null;

if (isSMTPConfigured()) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false, // For development, set to true in production
    },
  });
}

export async function sendVerificationCode(email: string, code: string): Promise<{ success: boolean; error?: string }> {
  if (!isSMTPConfigured()) {
    const error = 'SMTP is not configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD in your .env.local file.';
    console.error(error);
    return { success: false, error };
  }

  if (!transporter) {
    const error = 'Email transporter not initialized.';
    console.error(error);
    return { success: false, error };
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Verify your Examly account - Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">Welcome to Examly!</h1>
        <p>Thank you for signing up. Please use the verification code below to complete your registration:</p>
        <div style="background-color: #F3F4F6; border: 2px dashed #4F46E5; padding: 20px; text-align: center; margin: 30px 0; border-radius: 8px;">
          <h2 style="color: #4F46E5; font-size: 32px; letter-spacing: 8px; margin: 0; font-family: monospace;">
            ${code}
          </h2>
        </div>
        <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
        <p style="color: #666; font-size: 14px;">If you didn't create an account, please ignore this email.</p>
      </div>
    `,
    text: `Welcome to Examly! Your verification code is: ${code}. This code will expire in 10 minutes.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification code sent successfully to ${email}`);
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred while sending email';
    console.error('Error sending email:', errorMessage);
    console.error('Full error:', error);
    return { success: false, error: errorMessage };
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Reset your Examly password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">Password Reset Request</h1>
        <p>You requested to reset your password. Click the button below to reset it:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Reset Password
        </a>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #666; word-break: break-all;">${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `,
  };

  if (!transporter) {
    console.error('Email transporter not initialized.');
    return false;
  }

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

