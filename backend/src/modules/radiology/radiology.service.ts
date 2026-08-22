import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RadiologyOrder, RadiologyStatus } from './entities/radiology-order.entity';
import { PatientsService } from '../patients/patients.service';
import { BillingService } from '../billing/billing.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationStage } from '../notification/entities/notification.entity';
import { ConcurrencyConflictException } from '../../common/filters/concurrency-exception.filter';

@Injectable()
export class RadiologyService {
  constructor(
    @InjectRepository(RadiologyOrder)
    private radiologyRepository: Repository<RadiologyOrder>,
    private patientsService: PatientsService,
    private billingService: BillingService,
    private notificationService: NotificationService,
  ) {}

  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.radiologyRepository.count();
    const sequence = (count + 1).toString().padStart(4, '0');
    return `RAD-${year}-${sequence}`;
  }

  async createOrder(data: {
    patientId: string;
    doctorId: string;
    doctorName: string;
    modality: string;
    procedureName: string;
    cost?: number;
  }): Promise<RadiologyOrder> {
    const patient = await this.patientsService.findOne(data.patientId);

    const orderNumber = await this.generateOrderNumber();
    const cost = data.cost || 85.0;

    const order = this.radiologyRepository.create({
      orderNumber,
      patientId: patient.id,
      patientName: patient.fullName,
      doctorId: data.doctorId,
      doctorName: data.doctorName,
      modality: data.modality,
      procedureName: data.procedureName,
      cost,
      status: RadiologyStatus.ORDERED,
    });

    const saved = await this.radiologyRepository.save(order);

    // Auto-create invoice draft
    await this.billingService.createInvoice({
      patientId: patient.id,
      lineItems: [
        {
          description: `Radiology Investigation: ${data.procedureName} (${orderNumber})`,
          unitPrice: cost,
          quantity: 1,
          total: cost,
        },
      ],
      notes: `Auto-generated from RIS Order #${orderNumber}`,
    });

    // Notify Radiology Technician / Admin
    await this.notificationService.createStageNotification({
      title: `Radiology Order: ${patient.fullName}`,
      message: `Modality ${data.modality} (${data.procedureName}) ordered for ${patient.fullName}.`,
      recipientRole: 'ADMIN',
      stage: NotificationStage.LAB_ORDERED,
      metadata: { patientId: patient.id, orderNumber },
    });

    return saved;
  }

  async findAll(): Promise<RadiologyOrder[]> {
    return await this.radiologyRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<RadiologyOrder> {
    const order = await this.radiologyRepository.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Radiology order not found');
    return order;
  }

  async submitReport(
    id: string,
    notes: string,
    impression: string,
    radiologistName: string,
    version?: number,
  ): Promise<RadiologyOrder> {
    const order = await this.findOne(id);

    if (version !== undefined && order.version !== version) {
      throw new ConcurrencyConflictException('RadiologyOrder', id, order.version);
    }

    order.radiologistNotes = notes;
    order.impression = impression;
    order.reportedBy = radiologistName || 'Lead Consultant Radiologist';
    order.status = RadiologyStatus.REPORTED;

    const saved = await this.radiologyRepository.save(order);

    // Notify Doctor
    await this.notificationService.createStageNotification({
      title: `Radiology Report Ready: ${order.patientName}`,
      message: `Imaging report for ${order.procedureName} (Order #${order.orderNumber}) is finalized.`,
      recipientRole: 'DOCTOR',
      stage: NotificationStage.LAB_RESULTED,
      metadata: { patientId: order.patientId },
    });

    return saved;
  }
}
