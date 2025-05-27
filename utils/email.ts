import nodemailer, { Transporter } from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Nodemailer transporter
const transporter: Transporter = nodemailer.createTransport({
  service: 'gmail', // Use SendGrid/AWS SES in production
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Function to send password reset email
export const sendResetEmail = async (email: string, token: string): Promise<void> => {
  // Validate environment variables
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !process.env.FRONTEND_URL) {
    throw new Error('Missing email configuration in environment variables');
  }

  // Construct reset URL
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  // Define email options
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset Request',
    html: `
      <p>You requested a password reset for your Blog API account.</p>
      <p>Click <a href="${resetUrl}">this link</a> to reset your password.</p>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request this, please ignore this email.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error: any) {
    throw new Error(`Error sending email: ${error.message}`);
  }
};
