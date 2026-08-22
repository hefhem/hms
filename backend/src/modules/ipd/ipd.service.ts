import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bed, BedStatus } from './entities/bed.entity';
import { Admission, AdmissionStatus } from './entities/admission.entity';
import { PatientsService } from '../patients/patients.service';
import { BillingService } from '../billing/billing.service';
import { ConcurrencyConflictException } from '../../common/filters/concurrency-exception.filter';

@Injectable()
export class IpdService {
  constructor(
    @InjectRepository(Bed) private bedRepository: Repository<Bed>,
    @InjectRepository(Admission) private admissionRepository: Repository<Admission>,
    private patientsService: PatientsService,
    private billingService: BillingService,
  ) {}

  private async generateAdmissionNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.admissionRepository.count();
    const sequence = (count + 1).toString().padStart(4, '0');
    return `ADM-${year}-${sequence}`;
  }

  async getAllBeds(): Promise<Bed[]> {
    return await this.bedRepository.find({ order: { bedNumber: 'ASC' } });
  }

  async createBed(data: { bedNumber: string; wardName: string; bedClass?: string; pricePerNight?: number }): Promise<Bed> {
    const bed = this.bedRepository.create({
      bedNumber: data.bedNumber,
      wardName: data.wardName,
      bedClass: data.bedClass || 'GENERAL',
      pricePerNight: data.pricePerNight || 120.0,
      status: BedStatus.VACANT,
    });
    return await this.bedRepository.save(bed);
  }

  async updateBed(id: string, data: Partial<Bed>): Promise<Bed> {
    const bed = await this.bedRepository.findOne({ where: { id } });
    if (!bed) throw new NotFoundException('Bed not found');

    if (data.version !== undefined && bed.version !== data.version) {
      throw new ConcurrencyConflictException('Bed', id, bed.version);
    }

    Object.assign(bed, data);
    return await this.bedRepository.save(bed);
  }

  async deleteBed(id: string): Promise<void> {
    const bed = await this.bedRepository.findOne({ where: { id } });
    if (bed && bed.status === BedStatus.OCCUPIED) {
      throw new BadRequestException('Cannot delete bed while currently occupied');
    }
    await this.bedRepository.delete(id);
  }

  async admitPatient(data: { patientId: string; bedId: string; attendingDoctor: string; reason?: string }): Promise<Admission> {
    const patient = await this.patientsService.findOne(data.patientId);
    const bed = await this.bedRepository.findOne({ where: { id: data.bedId } });

    if (!bed) throw new NotFoundException('Bed not found');
    if (bed.status !== BedStatus.VACANT) {
      throw new BadRequestException(`Bed ${bed.bedNumber} is not vacant (Status: ${bed.status})`);
    }

    const admissionNumber = await this.generateAdmissionNumber();

    const admission = this.admissionRepository.create({
      admissionNumber,
      patientId: patient.id,
      patientName: patient.fullName,
      bedId: bed.id,
      bedNumber: bed.bedNumber,
      attendingDoctor: data.attendingDoctor,
      admissionReason: data.reason || 'Inpatient Care & Monitoring',
      status: AdmissionStatus.ADMITTED,
    });

    const savedAdmission = await this.admissionRepository.save(admission);

    // Update Bed status
    bed.status = BedStatus.OCCUPIED;
    bed.currentPatientId = patient.id;
    bed.currentPatientName = patient.fullName;
    await this.bedRepository.save(bed);

    // Charge admission deposit to billing
    await this.billingService.createInvoice({
      patientId: patient.id,
      lineItems: [
        {
          description: `Inpatient Admission Charge (${bed.wardName} - ${bed.bedNumber})`,
          unitPrice: bed.pricePerNight,
          quantity: 1,
          total: bed.pricePerNight,
        },
      ],
      notes: `Generated from IPD Admission #${admissionNumber}`,
    });

    return savedAdmission;
  }

  async dischargePatient(admissionId: string, summary: string): Promise<Admission> {
    const admission = await this.admissionRepository.findOne({ where: { id: admissionId } });
    if (!admission) throw new NotFoundException('Admission record not found');

    admission.status = AdmissionStatus.DISCHARGED;
    admission.dischargeSummary = summary;
    admission.dischargedAt = new Date();
    const saved = await this.admissionRepository.save(admission);

    // Free up Bed
    const bed = await this.bedRepository.findOne({ where: { id: admission.bedId } });
    if (bed) {
      bed.status = BedStatus.VACANT;
      bed.currentPatientId = null;
      bed.currentPatientName = null;
      await this.bedRepository.save(bed);
    }

    return saved;
  }

  async getAllAdmissions(): Promise<Admission[]> {
    return await this.admissionRepository.find({ order: { createdAt: 'DESC' } });
  }
}
