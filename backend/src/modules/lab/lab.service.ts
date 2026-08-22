import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LabOrder, LabOrderStatus, LabTestParameter } from './entities/lab-order.entity';
import { PatientsService } from '../patients/patients.service';
import { BillingService } from '../billing/billing.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationStage } from '../notification/entities/notification.entity';
import { ConcurrencyConflictException } from '../../common/filters/concurrency-exception.filter';

@Injectable()
export class LabService {
  constructor(
    @InjectRepository(LabOrder)
    private labOrderRepository: Repository<LabOrder>,
    private patientsService: PatientsService,
    private billingService: BillingService,
    private notificationService: NotificationService,
  ) {}

  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.labOrderRepository.count();
    const sequence = (count + 1).toString().padStart(4, '0');
    return `LAB-${year}-${sequence}`;
  }

  private generateBarcode(): string {
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `BAR-2026-${rand}`;
  }

  async createOrder(data: {
    patientId: string;
    doctorId: string;
    doctorName: string;
    testName: string;
    specimenType?: string;
    cost?: number;
  }): Promise<LabOrder> {
    const patient = await this.patientsService.findOne(data.patientId);

    const orderNumber = await this.generateOrderNumber();
    const sampleBarcode = this.generateBarcode();
    const cost = data.cost || 45.0;

    const order = this.labOrderRepository.create({
      orderNumber,
      patientId: patient.id,
      patientName: patient.fullName,
      doctorId: data.doctorId,
      doctorName: data.doctorName,
      testName: data.testName,
      specimenType: data.specimenType || 'Venous Blood',
      sampleBarcode,
      cost,
      status: LabOrderStatus.ORDERED,
    });

    const savedOrder = await this.labOrderRepository.save(order);

    // Auto-create invoice draft for billing
    await this.billingService.createInvoice({
      patientId: patient.id,
      lineItems: [
        {
          description: `Laboratory Test Order: ${data.testName} (${orderNumber})`,
          unitPrice: cost,
          quantity: 1,
          total: cost,
        },
      ],
      notes: `Generated from LIS Order #${orderNumber}`,
    });

    return savedOrder;
  }

  async findAll(query?: { status?: LabOrderStatus; patientId?: string }): Promise<LabOrder[]> {
    const qb = this.labOrderRepository.createQueryBuilder('lab').orderBy('lab.createdAt', 'DESC');

    if (query?.status) {
      qb.andWhere('lab.status = :status', { status: query.status });
    }
    if (query?.patientId) {
      qb.andWhere('lab.patientId = :patientId', { patientId: query.patientId });
    }

    return await qb.getMany();
  }

  async findOne(id: string): Promise<LabOrder> {
    const order = await this.labOrderRepository.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Lab Order not found');
    return order;
  }

  async updateStatus(id: string, status: LabOrderStatus, version?: number): Promise<LabOrder> {
    const order = await this.findOne(id);

    if (version !== undefined && order.version !== version) {
      throw new ConcurrencyConflictException('LabOrder', id, order.version);
    }

    order.status = status;
    return await this.labOrderRepository.save(order);
  }

  async enterResults(
    id: string,
    params: LabTestParameter[],
    labNotes?: string,
    techName?: string,
    version?: number,
  ): Promise<LabOrder> {
    const order = await this.findOne(id);

    if (version !== undefined && order.version !== version) {
      throw new ConcurrencyConflictException('LabOrder', id, order.version);
    }

    order.testParameters = params;
    order.labNotes = labNotes;
    order.performedBy = techName || 'Lead Medical Lab Scientist';
    order.status = LabOrderStatus.RESULTED;

    const saved = await this.labOrderRepository.save(order);

    // Dispatch Notification to Doctor
    await this.notificationService.createStageNotification({
      title: `Lab Results Ready: ${order.patientName}`,
      message: `Laboratory Investigation results for [${order.testName}] (Order #${order.orderNumber}) are now finalized.`,
      recipientRole: 'DOCTOR',
      stage: NotificationStage.LAB_RESULTED,
      metadata: { patientId: order.patientId, orderId: order.id },
    });

    return saved;
  }
}
