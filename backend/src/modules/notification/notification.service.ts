import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';
import { Notification, NotificationStage } from './entities/notification.entity';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '1025', 10),
      secure: false,
      ignoreTLS: true,
    });
  }

  async createStageNotification(data: {
    title: string;
    message: string;
    recipientRole: string;
    recipientId?: string;
    stage: NotificationStage;
    metadata?: Record<string, any>;
    patientEmail?: string;
  }): Promise<Notification> {
    const notif = this.notificationRepository.create({
      title: data.title,
      message: data.message,
      recipientRole: data.recipientRole,
      recipientId: data.recipientId,
      stage: data.stage,
      metadata: data.metadata,
      isRead: false,
    });

    const saved = await this.notificationRepository.save(notif);
    this.logger.log(`[STAGE NOTIFICATION] [${data.stage}] to ${data.recipientRole}: ${data.title}`);

    if (data.patientEmail) {
      this.sendEmail(data.patientEmail, `ApexCare HMS Notification: ${data.title}`, data.message);
    }

    return saved;
  }

  async getNotificationsForRole(role: string): Promise<Notification[]> {
    return await this.notificationRepository.find({
      where: [
        { recipientRole: role },
        { recipientRole: 'ADMIN' },
      ],
      order: { createdAt: 'DESC' },
      take: 30,
    });
  }

  async markAsRead(id: string): Promise<void> {
    await this.notificationRepository.update(id, { isRead: true });
  }

  async markAllAsReadForRole(role: string): Promise<void> {
    await this.notificationRepository.update({ recipientRole: role }, { isRead: true });
  }

  async sendEmail(to: string, subject: string, text: string, html?: string) {
    try {
      await this.transporter.sendMail({
        from: '"ApexCare Enterprise HMS" <notifications@clinic.com>',
        to,
        subject,
        text,
        html,
      });
      this.logger.log(`SMTP Email dispatched to ${to}: ${subject}`);
    } catch (err) {
      this.logger.warn(`Failed to dispatch SMTP email to ${to}: ${err.message}`);
    }
  }

  async sendWelcomeEmail(recipientEmail: string, recipientName: string, role: string, tempPass: string) {
    const subject = 'Welcome to ApexCare Enterprise HMS - Staff Account Credentials';
    const text = `Dear ${recipientName},\n\nWelcome to ApexCare HMS. Your staff account has been created with role: ${role}.\n\nLogin Email: ${recipientEmail}\nTemporary Password: ${tempPass}\n\nPlease change your password upon your first login.\n\nRegards,\nApexCare System Administrator`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #0284c7; margin-top: 0;">Welcome to ApexCare Enterprise HMS</h2>
        <p>Dear <strong>${recipientName}</strong>,</p>
        <p>Your hospital staff account has been successfully onboarded with the following details:</p>
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; font-family: monospace; border: 1px solid #cbd5e1;">
          <p style="margin: 4px 0;"><strong>Role:</strong> ${role}</p>
          <p style="margin: 4px 0;"><strong>Email:</strong> ${recipientEmail}</p>
          <p style="margin: 4px 0;"><strong>Temporary Password:</strong> ${tempPass}</p>
        </div>
        <p style="margin-top: 20px;">Please login to the portal and update your password immediately.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 11px; color: #64748b;">ApexCare Hospital Management System &copy; 2026</p>
      </div>
    `;
    await this.sendEmail(recipientEmail, subject, text, html);
  }

  async sendPasswordResetEmail(recipientEmail: string, recipientName: string, resetToken: string) {
    const subject = 'Password Reset Request - ApexCare HMS';
    const text = `Dear ${recipientName},\n\nA password reset was requested for your account.\n\nReset Token: ${resetToken}\n\nIf you did not request this, please contact Security immediately.\n\nRegards,\nApexCare Security Team`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <h2 style="color: #0284c7; margin-top: 0;">Password Reset Authorization</h2>
        <p>Dear <strong>${recipientName}</strong>,</p>
        <p>A password reset request was initiated for your staff account.</p>
        <div style="background: #fff7ed; padding: 15px; border-radius: 8px; font-family: monospace; border: 1px solid #fdba74;">
          <p style="margin: 4px 0; color: #c2410c;"><strong>Reset Verification Token:</strong> ${resetToken}</p>
        </div>
        <p style="margin-top: 20px;">If you did not make this request, please contact your System Administrator immediately.</p>
      </div>
    `;
    await this.sendEmail(recipientEmail, subject, text, html);
  }

  async sendPasswordChangeConfirmationEmail(recipientEmail: string, recipientName: string) {
    const subject = 'Security Alert: Password Updated Successfully';
    const text = `Dear ${recipientName},\n\nYour account password was successfully updated on ${new Date().toLocaleString()}.\n\nIf you did not authorize this change, please report it immediately to IT Security.`;
    await this.sendEmail(recipientEmail, subject, text);
  }

  async sendAppointmentNotification(patientEmail: string, patientName: string, date: string, doctor: string) {
    const subject = 'Appointment Scheduled Confirmation';
    const text = `Dear ${patientName},\n\nYour appointment with ${doctor} is scheduled for ${date}.\n\nThank you,\nApexCare HMS Team`;
    await this.sendEmail(patientEmail, subject, text);
  }

  async sendInvoiceNotification(patientEmail: string, patientName: string, invoiceNumber: string, amount: number) {
    const subject = `Invoice ${invoiceNumber} Notification`;
    const text = `Dear ${patientName},\n\nAn invoice (${invoiceNumber}) for the amount of $${amount} has been generated for your recent visit.\n\nThank you,\nApexCare HMS Team`;
    await this.sendEmail(patientEmail, subject, text);
  }
}
