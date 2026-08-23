import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Drug } from './entities/drug.entity';
import { DrugBatch } from './entities/drug-batch.entity';
import { Prescription, PrescriptionStatus } from '../emr/entities/prescription.entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationStage } from '../notification/entities/notification.entity';
import { ConcurrencyConflictException } from '../../common/filters/concurrency-exception.filter';

@Injectable()
export class PharmacyService {
  constructor(
    @InjectRepository(Drug)
    private drugRepository: Repository<Drug>,
    @InjectRepository(DrugBatch)
    private batchRepository: Repository<DrugBatch>,
    @InjectRepository(Prescription)
    private prescriptionRepository: Repository<Prescription>,
    private dataSource: DataSource,
    private notificationService: NotificationService,
  ) {}

  async createDrug(data: Partial<Drug>): Promise<Drug> {
    const drug = this.drugRepository.create(data);
    return await this.drugRepository.save(drug);
  }

  async findAllDrugs(): Promise<Drug[]> {
    return await this.drugRepository.find({
      order: { name: 'ASC' },
    });
  }

  async updateDrug(id: string, data: Partial<Drug>): Promise<Drug> {
    const drug = await this.drugRepository.findOne({ where: { id } });
    if (!drug) throw new NotFoundException('Drug not found in catalog');

    if (data.version !== undefined && drug.version !== data.version) {
      throw new ConcurrencyConflictException('Drug', id, drug.version);
    }

    Object.assign(drug, data);
    return await this.drugRepository.save(drug);
  }

  async deleteDrug(id: string): Promise<void> {
    const drug = await this.drugRepository.findOne({ where: { id } });
    if (!drug) return;

    let rxCount = 0;
    let batchCount = 0;

    try {
      rxCount = await this.dataSource.getRepository('Prescription').count({
        where: [{ drugName: drug.name }, { drugName: drug.code }],
      });
    } catch (e) {}

    try {
      batchCount = await this.batchRepository.count({ where: { drugId: id } });
    } catch (e) {}

    const totalUsage = rxCount + batchCount;
    if (totalUsage > 0) {
      throw new BadRequestException(
        `Cannot delete Medication '${drug.name}' (${drug.code}) because it is actively referenced in ${totalUsage} prescription(s) or inventory batch(es).`,
      );
    }

    await this.drugRepository.delete(id);
  }

  async addBatch(drugId: string, batchData: Partial<DrugBatch>): Promise<DrugBatch> {
    const drug = await this.drugRepository.findOne({ where: { id: drugId } });
    if (!drug) throw new NotFoundException('Drug not found');

    const batch = this.batchRepository.create({
      ...batchData,
      drugId: drug.id,
    });
    const savedBatch = await this.batchRepository.save(batch);

    // Increase total quantity in stock
    drug.quantityInStock += batchData.quantity || 0;
    await this.drugRepository.save(drug);

    return savedBatch;
  }

  async dispensePrescription(
    prescriptionId: string,
    pharmacistName: string,
  ): Promise<{ prescription: Prescription; totalCost: number; lineItems: any[] }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const prescription = await queryRunner.manager.findOne(Prescription, {
        where: { id: prescriptionId },
      });

      if (!prescription) {
        throw new NotFoundException('Prescription not found');
      }

      if (prescription.status === PrescriptionStatus.DISPENSED) {
        throw new BadRequestException('Prescription has already been dispensed');
      }

      let totalCost = 0;
      const lineItems = [];

      for (const item of prescription.items) {
        const drug = await queryRunner.manager.findOne(Drug, {
          where: { id: item.drugId },
        });

        if (!drug) {
          throw new NotFoundException(`Drug '${item.drugName}' no longer available in catalog`);
        }

        if (drug.quantityInStock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for '${drug.name}'. Required: ${item.quantity}, In Stock: ${drug.quantityInStock}`,
          );
        }

        // Deduct inventory
        drug.quantityInStock -= item.quantity;
        await queryRunner.manager.save(drug);

        const itemTotal = drug.unitPrice * item.quantity;
        totalCost += itemTotal;

        lineItems.push({
          description: `${drug.name} (${item.dosage}) x ${item.quantity} ${drug.unit}`,
          unitPrice: drug.unitPrice,
          quantity: item.quantity,
          total: itemTotal,
        });
      }

      prescription.status = PrescriptionStatus.DISPENSED;
      prescription.dispensedBy = pharmacistName;
      prescription.dispensedAt = new Date();

      const savedPrescription = await queryRunner.manager.save(prescription);

      await queryRunner.commitTransaction();

      // Trigger Billing Notification
      await this.notificationService.createStageNotification({
        title: `Prescription Dispensed: ${prescription.patientName}`,
        message: `Medications dispensed by ${pharmacistName} for patient ${prescription.patientName}. Invoice draft auto-updated.`,
        recipientRole: 'BILLING_CLERK',
        stage: NotificationStage.PRESCRIPTION_DISPENSED,
        metadata: { patientId: prescription.patientId, totalCost },
      });

      return {
        prescription: savedPrescription,
        totalCost,
        lineItems,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      if (err.name === 'OptimisticLockVersionMismatchError') {
        throw new ConcurrencyConflictException('Drug Stock', prescriptionId, 0);
      }
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
