import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, PaymentStatus, PaymentMethod, InvoiceLineItem } from './entities/invoice.entity';
import { PatientsService } from '../patients/patients.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationStage } from '../notification/entities/notification.entity';
import { ConcurrencyConflictException } from '../../common/filters/concurrency-exception.filter';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    private patientsService: PatientsService,
    private notificationService: NotificationService,
  ) {}

  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.invoiceRepository.count();
    const sequence = (count + 1).toString().padStart(4, '0');
    return `INV-${year}-${sequence}`;
  }

  async createInvoice(data: {
    patientId: string;
    consultationId?: string;
    prescriptionId?: string;
    lineItems: InvoiceLineItem[];
    discount?: number;
    notes?: string;
  }): Promise<Invoice> {
    const patient = await this.patientsService.findOne(data.patientId);

    const subtotal = data.lineItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const discount = data.discount || 0;
    const finalAmount = Math.max(0, subtotal - discount);

    const invoiceNumber = await this.generateInvoiceNumber();

    const invoice = this.invoiceRepository.create({
      invoiceNumber,
      patientId: patient.id,
      patientName: patient.fullName,
      consultationId: data.consultationId,
      prescriptionId: data.prescriptionId,
      totalAmount: subtotal,
      discount,
      finalAmount,
      paymentStatus: PaymentStatus.PENDING,
      paymentMethod: PaymentMethod.CASH,
      lineItems: data.lineItems,
      notes: data.notes,
    });

    const saved = await this.invoiceRepository.save(invoice);

    if (patient.email) {
      this.notificationService.sendInvoiceNotification(
        patient.email,
        patient.fullName,
        invoiceNumber,
        finalAmount,
      );
    }

    return saved;
  }

  async findAll(query?: { status?: PaymentStatus; patientId?: string }): Promise<Invoice[]> {
    const qb = this.invoiceRepository.createQueryBuilder('inv').orderBy('inv.createdAt', 'DESC');

    if (query?.status) {
      qb.andWhere('inv.paymentStatus = :status', { status: query.status });
    }
    if (query?.patientId) {
      qb.andWhere('inv.patientId = :patientId', { patientId: query.patientId });
    }

    return await qb.getMany();
  }

  async findOne(id: string): Promise<Invoice> {
    const inv = await this.invoiceRepository.findOne({ where: { id } });
    if (!inv) throw new NotFoundException('Invoice not found');
    return inv;
  }

  async processPayment(
    id: string,
    paymentMethod: PaymentMethod,
    version?: number,
  ): Promise<Invoice> {
    const inv = await this.findOne(id);

    if (version !== undefined && inv.version !== version) {
      throw new ConcurrencyConflictException('Invoice', id, inv.version);
    }

    inv.paymentStatus = PaymentStatus.PAID;
    inv.paymentMethod = paymentMethod;

    const saved = await this.invoiceRepository.save(inv);

    // Trigger Visit Completed Notification
    await this.notificationService.createStageNotification({
      title: `Payment Settled: ${inv.patientName}`,
      message: `Invoice ${inv.invoiceNumber} ($${inv.finalAmount}) settled via ${paymentMethod}. Clinical visit completed.`,
      recipientRole: 'RECEPTIONIST',
      stage: NotificationStage.PAYMENT_SETTLED,
      metadata: { patientId: inv.patientId, invoiceNumber: inv.invoiceNumber },
    });

    return saved;
  }
}
