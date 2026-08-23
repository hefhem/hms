import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Patient } from './entities/patient.entity';
import { Triage } from './entities/triage.entity';
import { TenantsService } from '../tenants/tenants.service';
import { ConcurrencyConflictException } from '../../common/filters/concurrency-exception.filter';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private patientsRepository: Repository<Patient>,
    @InjectRepository(Triage)
    private triageRepository: Repository<Triage>,
    private tenantsService: TenantsService,
    private dataSource: DataSource,
  ) {}

  private async generateMrn(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.patientsRepository.count();
    const sequence = (count + 1).toString().padStart(4, '0');
    return `MRN-${year}-${sequence}`;
  }

  async create(data: Partial<Patient>): Promise<Patient> {
    // 🛡️ Subscription Patient Quota Enforcement
    if (data.tenantId) {
      try {
        const tenant = await this.tenantsService.findOne(data.tenantId);
        if (tenant) {
          const currentCount = await this.patientsRepository.count({ where: { tenantId: data.tenantId } });
          const maxLimit = tenant.maxPatientsQuota || 500;
          if (currentCount >= maxLimit) {
            throw new ForbiddenException(
              `Subscriber Patient Quota Limit Exceeded: Workspace '${tenant.name}' has reached its maximum patient limit of ${maxLimit} patients under the ${tenant.plan} Subscription Plan Tier. Please upgrade your Subscription Plan Tier to onboard additional patients.`,
            );
          }
        }
      } catch (err: any) {
        if (err instanceof ForbiddenException) throw err;
        // ignore tenant lookup fallback
      }
    }

    if (!data.mrn) {
      data.mrn = await this.generateMrn();
    }
    const patient = this.patientsRepository.create(data);
    return await this.patientsRepository.save(patient);
  }

  async findAll(search?: string, tenantId?: string): Promise<Patient[]> {
    const qb = this.patientsRepository.createQueryBuilder('patient').orderBy('patient.createdAt', 'DESC');

    if (tenantId) {
      qb.andWhere('(patient.tenantId = :tenantId OR patient.tenantId IS NULL)', { tenantId });
    }

    if (search) {
      qb.andWhere('(patient.fullName LIKE :search OR patient.mrn LIKE :search OR patient.phone LIKE :search)', {
        search: `%${search}%`,
      });
    }

    return await qb.getMany();
  }

  async findOne(id: string): Promise<Patient> {
    const patient = await this.patientsRepository.findOne({
      where: { id },
      relations: ['triages'],
    });
    if (!patient) throw new NotFoundException(`Patient with ID ${id} not found`);
    return patient;
  }

  async update(id: string, updateData: Partial<Patient> & { version?: number }): Promise<Patient> {
    const patient = await this.findOne(id);

    // Optimistic Concurrency check
    if (updateData.version !== undefined && patient.version !== updateData.version) {
      throw new ConcurrencyConflictException('Patient', id, patient.version);
    }

    Object.assign(patient, updateData);
    return await this.patientsRepository.save(patient);
  }

  async delete(id: string): Promise<void> {
    const patient = await this.findOne(id);

    let apptCount = 0;
    let labCount = 0;
    let radCount = 0;
    let ipdCount = 0;
    let invoiceCount = 0;

    try {
      apptCount = await this.dataSource.getRepository('Appointment').count({ where: { patientId: id } });
    } catch (e) {}

    try {
      labCount = await this.dataSource.getRepository('LabOrder').count({ where: { patientId: id } });
    } catch (e) {}

    try {
      radCount = await this.dataSource.getRepository('RadiologyOrder').count({ where: { patientId: id } });
    } catch (e) {}

    try {
      ipdCount = await this.dataSource.getRepository('IpdAdmission').count({ where: { patientId: id } });
    } catch (e) {}

    try {
      invoiceCount = await this.dataSource.getRepository('Invoice').count({ where: { patientId: id } });
    } catch (e) {}

    const totalUsage = apptCount + labCount + radCount + ipdCount + invoiceCount;
    if (totalUsage > 0) {
      throw new BadRequestException(
        `Cannot delete Patient '${patient.fullName}' (${patient.mrn}) because they are actively referenced in ${totalUsage} clinical visit(s), lab/imaging order(s), admission(s), or billing record(s).`,
      );
    }

    await this.patientsRepository.delete(id);
  }

  async recordTriage(patientId: string, triageData: Partial<Triage>): Promise<Triage> {
    const patient = await this.findOne(patientId);

    // Auto-calculate BMI if height & weight provided
    if (triageData.weight && triageData.height) {
      const heightInMeters = triageData.height / 100;
      triageData.bmi = parseFloat((triageData.weight / (heightInMeters * heightInMeters)).toFixed(1));
    }

    // Determine Triage Category if not set
    if (!triageData.triageCategory) {
      if (triageData.spo2 && triageData.spo2 < 90) {
        triageData.triageCategory = 'EMERGENCY';
      } else if (triageData.temperature && triageData.temperature > 39.0) {
        triageData.triageCategory = 'URGENT';
      } else {
        triageData.triageCategory = 'NON_URGENT';
      }
    }

    const triage = this.triageRepository.create({
      ...triageData,
      patientId: patient.id,
    });

    return await this.triageRepository.save(triage);
  }

  async bulkImport(records: Partial<Patient>[]): Promise<{ imported: number; errors: any[] }> {
    let imported = 0;
    const errors = [];

    for (let i = 0; i < records.length; i++) {
      try {
        const item = records[i];
        if (!item.fullName) continue;
        await this.create(item);
        imported++;
      } catch (err: any) {
        errors.push({ row: i + 1, error: err.message });
      }
    }

    return { imported, errors };
  }
}
