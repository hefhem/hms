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

    // If patient email provided, dispatch SMTP notification
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

  async sendEmail(to: string, subject: string, text: string) {
    try {
      await this.transporter.sendMail({
        from: '"ApexCare Enterprise HMS" <notifications@clinic.com>',
        to,
        subject,
        text,
      });
      this.logger.log(`SMTP Email sent to ${to}: ${subject}`);
    } catch (err) {
      this.logger.warn(`Failed to send SMTP email to ${to}: ${err.message}`);
    }
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
