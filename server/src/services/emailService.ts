// =============================================================
// EMAIL SERVICE - Nodemailer-powered email notifications
// =============================================================
import nodemailer from 'nodemailer';
import logger from '../config/logger.js';

// Use Ethereal (fake SMTP) for demo — no real email config needed
let transporter: nodemailer.Transporter | null = null;

async function getTransporter() {
  if (transporter) return transporter;

  // Create a test account on Ethereal for demo
  const testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  logger.info('📧 Email transporter ready (Ethereal test account)', { user: testAccount.user });
  return transporter;
}

export async function sendExpenseNotificationEmail(to: string, subject: string, body: {
  expenseDescription: string;
  amount: number;
  currency: string;
  action: string;
  actionBy?: string;
  comments?: string;
}) {
  try {
    const transport = await getTransporter();
    const html = `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">ReimburseFlow</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Expense ${body.action}</p>
        </div>
        <div style="padding: 32px;">
          <p style="color: #374151; font-size: 16px; margin: 0 0 16px;">Your expense has been <strong>${body.action}</strong>.</p>
          <div style="background: white; border-radius: 12px; padding: 20px; border: 1px solid #e5e7eb;">
            <p style="margin: 0 0 8px;"><strong>Description:</strong> ${body.expenseDescription}</p>
            <p style="margin: 0 0 8px;"><strong>Amount:</strong> ${body.currency} ${body.amount.toLocaleString()}</p>
            ${body.actionBy ? `<p style="margin: 0 0 8px;"><strong>${body.action} by:</strong> ${body.actionBy}</p>` : ''}
            ${body.comments ? `<p style="margin: 0;"><strong>Comments:</strong> ${body.comments}</p>` : ''}
          </div>
          <p style="color: #6b7280; font-size: 12px; margin: 24px 0 0;">This is an automated notification from ReimburseFlow.</p>
        </div>
      </div>
    `;

    const info = await transport.sendMail({
      from: '"ReimburseFlow" <noreply@reimburseflow.app>',
      to,
      subject: `[ReimburseFlow] ${subject}`,
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    logger.info('📧 Email sent', { to, subject, previewUrl });
    return { success: true, previewUrl };
  } catch (error) {
    logger.error('Email send failed', { error, to });
    return { success: false };
  }
}
