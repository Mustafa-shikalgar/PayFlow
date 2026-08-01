const nodemailer = require('nodemailer');

/**
 * Create a reusable transporter based on environment config.
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: parseInt(process.env.EMAIL_PORT || '587', 10) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send an email.
 * @param {Object} options - { to, subject, html, text }
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'PayFlow <no-reply@payflow.com>',
    to,
    subject,
    html,
    text,
  };
  return transporter.sendMail(mailOptions);
};

/**
 * Send email verification email.
 */
const sendVerificationEmail = async (user, token) => {
  const url = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 8px;">
      <h2 style="color: #1f2937; text-align: center;">Verify Your Email</h2>
      <p style="color: #4b5563; font-size: 16px;">Hi ${user.name},</p>
      <p style="color: #4b5563; font-size: 16px;">Thank you for registering with PayFlow. Please verify your email address by clicking the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${url}" style="background: #6366f1; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-size: 16px;">Verify Email</a>
      </div>
      <p style="color: #6b7280; font-size: 14px;">This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
    </div>
  `;
  return sendEmail({ to: user.email, subject: 'Verify your PayFlow account', html });
};

/**
 * Send password reset email.
 */
const sendPasswordResetEmail = async (user, token) => {
  const url = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 8px;">
      <h2 style="color: #1f2937; text-align: center;">Reset Your Password</h2>
      <p style="color: #4b5563; font-size: 16px;">Hi ${user.name},</p>
      <p style="color: #4b5563; font-size: 16px;">We received a request to reset your password. Click the button below to set a new one:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${url}" style="background: #6366f1; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-size: 16px;">Reset Password</a>
      </div>
      <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;
  return sendEmail({ to: user.email, subject: 'Reset your PayFlow password', html });
};

/**
 * Send payment receipt email.
 */
const sendPaymentReceiptEmail = async (user, payment, invoice) => {
  const amount = (payment.amount / 100).toFixed(2);
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 8px;">
      <h2 style="color: #1f2937; text-align: center;">Payment Receipt</h2>
      <p style="color: #4b5563; font-size: 16px;">Hi ${user.name},</p>
      <p style="color: #4b5563; font-size: 16px;">Your payment of <strong>${payment.currency} ${amount}</strong> was successful.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #ffffff; border-radius: 8px; overflow: hidden;">
        <tr style="background: #f3f4f6;">
          <td style="padding: 10px; font-weight: bold; color: #374151;">Payment ID</td>
          <td style="padding: 10px; color: #4b5563;">${payment.paymentId}</td>
        </tr>
        <tr>
          <td style="padding: 10px; font-weight: bold; color: #374151;">Amount</td>
          <td style="padding: 10px; color: #4b5563;">${payment.currency} ${amount}</td>
        </tr>
        <tr style="background: #f3f4f6;">
          <td style="padding: 10px; font-weight: bold; color: #374151;">Method</td>
          <td style="padding: 10px; color: #4b5563; text-transform: capitalize;">${payment.method}</td>
        </tr>
        <tr>
          <td style="padding: 10px; font-weight: bold; color: #374151;">Date</td>
          <td style="padding: 10px; color: #4b5563;">${new Date(payment.createdAt).toLocaleString()}</td>
        </tr>
        <tr style="background: #f3f4f6;">
          <td style="padding: 10px; font-weight: bold; color: #374151;">Invoice</td>
          <td style="padding: 10px; color: #4b5563;">${invoice ? invoice.invoiceNumber : 'N/A'}</td>
        </tr>
      </table>
      <p style="color: #6b7280; font-size: 14px;">Thank you for using PayFlow!</p>
    </div>
  `;
  return sendEmail({ to: user.email, subject: `Payment Receipt - ${payment.paymentId}`, html });
};

/**
 * Send refund status email.
 */
const sendRefundStatusEmail = async (user, refund, status) => {
  const amount = (refund.amount / 100).toFixed(2);
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 8px;">
      <h2 style="color: #1f2937; text-align: center;">Refund ${status}</h2>
      <p style="color: #4b5563; font-size: 16px;">Hi ${user.name},</p>
      <p style="color: #4b5563; font-size: 16px;">Your refund request of <strong>${refund.currency || 'INR'} ${amount}</strong> has been <strong>${status}</strong>.</p>
      <p style="color: #6b7280; font-size: 14px;">Refund ID: ${refund.refundId}</p>
      <p style="color: #6b7280; font-size: 14px;">If you have any questions, please contact support.</p>
    </div>
  `;
  return sendEmail({ to: user.email, subject: `Refund ${status} - ${refund.refundId}`, html });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPaymentReceiptEmail,
  sendRefundStatusEmail,
};