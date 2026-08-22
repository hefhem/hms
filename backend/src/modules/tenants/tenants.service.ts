import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant, TenantStatus, TenantPlan } from './entities/tenant.entity';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
  ) {}

  async findAll(): Promise<Tenant[]> {
    return await this.tenantRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async findBySubdomain(subdomain: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({ where: { subdomain: subdomain.toLowerCase() } });
    if (!tenant) throw new NotFoundException(`Tenant subdomain '${subdomain}' not found`);
    return tenant;
  }

  async create(data: {
    name: string;
    subdomain: string;
    currency?: string;
    plan?: TenantPlan;
    maxUsers?: number;
    contactEmail?: string;
    contactPhone?: string;
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPassword?: string;
    senderEmail?: string;
    senderName?: string;
  }): Promise<Tenant> {
    const existing = await this.tenantRepository.findOne({
      where: [{ name: data.name }, { subdomain: data.subdomain.toLowerCase() }],
    });
    if (existing) {
      throw new ConflictException('Tenant with this name or subdomain already exists');
    }

    const tenant = this.tenantRepository.create({
      ...data,
      subdomain: data.subdomain.toLowerCase(),
      currency: data.currency || 'USD',
      plan: data.plan || TenantPlan.PROFESSIONAL,
      status: TenantStatus.ACTIVE,
      smtpHost: data.smtpHost || 'localhost',
      smtpPort: data.smtpPort || 1025,
      senderEmail: data.senderEmail || `${data.subdomain}@clinic.com`,
      senderName: data.senderName || `${data.name} Care Team`,
    });

    return await this.tenantRepository.save(tenant);
  }

  async update(id: string, data: Partial<Tenant>): Promise<Tenant> {
    const tenant = await this.findOne(id);
    Object.assign(tenant, data);
    return await this.tenantRepository.save(tenant);
  }

  async updateSmtpConfig(id: string, smtpConfig: {
    smtpHost: string;
    smtpPort: number;
    smtpUser?: string;
    smtpPassword?: string;
    senderEmail: string;
    senderName: string;
  }): Promise<Tenant> {
    const tenant = await this.findOne(id);
    tenant.smtpHost = smtpConfig.smtpHost;
    tenant.smtpPort = smtpConfig.smtpPort;
    tenant.smtpUser = smtpConfig.smtpUser;
    if (smtpConfig.smtpPassword) tenant.smtpPassword = smtpConfig.smtpPassword;
    tenant.senderEmail = smtpConfig.senderEmail;
    tenant.senderName = smtpConfig.senderName;
    return await this.tenantRepository.save(tenant);
  }

  async toggleStatus(id: string, status: TenantStatus): Promise<Tenant> {
    const tenant = await this.findOne(id);
    tenant.status = status;
    return await this.tenantRepository.save(tenant);
  }

  async delete(id: string): Promise<void> {
    await this.tenantRepository.delete(id);
  }
}
