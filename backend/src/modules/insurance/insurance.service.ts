import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { HmoClaim, ClaimStatus } from './entities/hmo-claim.entity';
import { HmoProvider } from './entities/hmo-provider.entity';
import { PatientsService } from '../patients/patients.service';
import { ConcurrencyConflictException } from '../../common/filters/concurrency-exception.filter';

@Injectable()
export class InsuranceService {
  constructor(
    @InjectRepository(HmoClaim)
    private claimRepository: Repository<HmoClaim>,
    @InjectRepository(HmoProvider)
    private providerRepository: Repository<HmoProvider>,
    private patientsService: PatientsService,
    private dataSource: DataSource,
  ) {}

  // HMO Providers CRUD
  async findAllProviders(): Promise<HmoProvider[]> {
    return await this.providerRepository.find({ order: { name: 'ASC' } });
  }

  async createProvider(data: Partial<HmoProvider>): Promise<HmoProvider> {
    const provider = this.providerRepository.create(data);
    return await this.providerRepository.save(provider);
  }

  async updateProvider(id: string, data: Partial<HmoProvider>): Promise<HmoProvider> {
    const provider = await this.providerRepository.findOne({ where: { id } });
    if (!provider) throw new NotFoundException('HMO Provider not found');

    if (data.version !== undefined && provider.version !== data.version) {
      throw new ConcurrencyConflictException('HmoProvider', id, provider.version);
    }

    Object.assign(provider, data);
    return await this.providerRepository.save(provider);
  }

  async deleteProvider(id: string): Promise<void> {
    const provider = await this.providerRepository.findOne({ where: { id } });
    if (!provider) return;

    let patientCount = 0;
    let claimCount = 0;

    try {
      patientCount = await this.dataSource
        .getRepository('Patient')
        .count({ where: [{ insuranceProviderId: id }, { insuranceProvider: provider.name }] });
    } catch (e) {}

    try {
      claimCount = await this.claimRepository.count({ where: { hmoProvider: provider.name } });
    } catch (e) {}

    const totalUsage = patientCount + claimCount;
    if (totalUsage > 0) {
      throw new BadRequestException(
        `Cannot delete HMO Provider '${provider.name}' because it is actively linked to ${totalUsage} patient policy or insurance claim record(s).`,
      );
    }

    await this.providerRepository.delete(id);
  }

  // HMO Claims CRUD
  private async generateClaimNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.claimRepository.count();
    const sequence = (count + 1).toString().padStart(4, '0');
    return `CLM-${year}-${sequence}`;
  }

  async createClaim(data: {
    patientId: string;
    hmoProvider: string;
    policyNumber: string;
    preAuthCode?: string;
    claimAmount: number;
    copayAmount?: number;
  }): Promise<HmoClaim> {
    const patient = await this.patientsService.findOne(data.patientId);
    const claimNumber = await this.generateClaimNumber();

    const claim = this.claimRepository.create({
      claimNumber,
      patientId: patient.id,
      patientName: patient.fullName,
      hmoProvider: data.hmoProvider,
      policyNumber: data.policyNumber,
      preAuthCode: data.preAuthCode,
      claimAmount: data.claimAmount,
      copayAmount: data.copayAmount || 0,
      status: ClaimStatus.SUBMITTED,
    });

    return await this.claimRepository.save(claim);
  }

  async findAll(): Promise<HmoClaim[]> {
    return await this.claimRepository.find({ order: { createdAt: 'DESC' } });
  }

  async updateStatus(id: string, status: ClaimStatus, rejectionReason?: string, version?: number): Promise<HmoClaim> {
    const claim = await this.claimRepository.findOne({ where: { id } });
    if (!claim) throw new NotFoundException('HMO Claim record not found');

    if (version !== undefined && claim.version !== version) {
      throw new ConcurrencyConflictException('HmoClaim', id, claim.version);
    }

    claim.status = status;
    if (rejectionReason) claim.rejectionReason = rejectionReason;

    return await this.claimRepository.save(claim);
  }
}
