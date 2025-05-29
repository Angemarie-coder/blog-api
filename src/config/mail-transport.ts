import nodemailer from 'nodemailer';

export async function createTransporter() {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Missing email credentials');
    }
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
      },
    });
  
    try {
      await transporter.verify();
    } catch (error) {
      console.error('Email configuration nodemailer error:', error);
      throw new Error('Failed to connect to email service. Please check your email cnfigurations.');
    }
    return transporter;
  }