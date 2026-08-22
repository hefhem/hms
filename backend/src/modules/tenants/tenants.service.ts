import { Injectable, NotFoundException, ConflictException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Tenant, TenantStatus, TenantPlan } from './entities/tenant.entity';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { TenantSubscriptionInvoice, SubscriptionInvoiceStatus } from './entities/tenant-subscription-invoice.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../../common/enums/role.enum';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class TenantsService implements OnModuleInit {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(SubscriptionPlan)
    private planRepository: Repository<SubscriptionPlan>,
    @InjectRepository(TenantSubscriptionInvoice)
    private invoiceRepository: Repository<TenantSubscriptionInvoice>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private notificationService: NotificationService,
  ) {}

  async onModuleInit() {
    await this.seedDefaultPlans();
  }

  // --- Seed Default Subscription Plan Tiers (All Features Included, Limited by Quotas) ---
  async seedDefaultPlans() {
    const allFeatures = [
      'EMR Clinical Notes & Consultations',
      'Appointments Scheduling & Reminders',
      'Billing Ledger & Invoicing',
      'Pharmacy Inventory & E-Prescribing',
      'Laboratory Diagnostics & Orders',
      'Radiology PACS Imaging',
      'IPD Ward & Bed Allocation',
      'HMO Insurance Claims',
      'MFA Security & Audit Logs',
    ];

    const defaultPlans = [
      {
        code: 'STARTER',
        name: 'Starter Tier Plan',
        pricePerMonth: 99.0,
        billingCycleDays: 30,
        maxPatientsQuota: 200,
        maxUsersQuota: 10,
        features: allFeatures,
        isActive: true,
      },
      {
        code: 'PROFESSIONAL',
        name: 'Professional Tier Plan',
        pricePerMonth: 299.0,
        billingCycleDays: 30,
        maxPatientsQuota: 2000,
        maxUsersQuota: 50,
        features: allFeatures,
        isActive: true,
      },
      {
        code: 'ENTERPRISE',
        name: 'Enterprise Care Tier Plan',
        pricePerMonth: 799.0,
        billingCycleDays: 30,
        maxPatientsQuota: 10000,
        maxUsersQuota: 500,
        features: allFeatures,
        isActive: true,
      },
    ];

    for (const p of defaultPlans) {
      let plan = await this.planRepository.findOne({ where: { code: p.code } });
      if (!plan) {
        plan = this.planRepository.create(p);
        await this.planRepository.save(plan);
      } else {
        plan.features = allFeatures;
        await this.planRepository.save(plan);
      }
    }
    this.logger.log('Verified Subscription Plan Tiers with All Features Enabled & Quota Enforcements');
  }

  // --- Subscription Plan Tier CRUD ---
  async findAllPlans(): Promise<SubscriptionPlan[]> {
    return await this.planRepository.find({ order: { pricePerMonth: 'ASC' } });
  }

  async createPlan(data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    const existing = await this.planRepository.findOne({ where: { code: data.code?.toUpperCase() } });
    if (existing) throw new ConflictException(`Subscription Plan code '${data.code}' already exists`);
    const plan = this.planRepository.create({
      ...data,
      code: data.code?.toUpperCase(),
    });
    return await this.planRepository.save(plan);
  }

  async updatePlan(id: string, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    const plan = await this.planRepository.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('Subscription Plan not found');
    Object.assign(plan, data);
    return await this.planRepository.save(plan);
  }

  async deletePlan(id: string): Promise<void> {
    await this.planRepository.delete(id);
  }

  // --- Tenants Management ---
  async findAll(): Promise<any[]> {
    const tenants = await this.tenantRepository.find({ order: { createdAt: 'DESC' } });
    const plans = await this.planRepository.find();
    const now = new Date();

    const result = [];
    for (const t of tenants) {
      const plan = plans.find((p) => p.code === t.plan);
      if (plan) {
        t.maxPatientsQuota = plan.maxPatientsQuota;
        t.maxUsers = plan.maxUsersQuota;
      }

      let startDate = t.subscriptionStartDate;
      let endDate = t.subscriptionEndDate;

      if (!startDate) {
        startDate = t.createdAt || new Date();
        t.subscriptionStartDate = startDate;
      }
      if (!endDate) {
        endDate = new Date(new Date(startDate).getTime() + (plan ? plan.billingCycleDays : 30) * 24 * 60 * 60 * 1000);
        t.subscriptionEndDate = endDate;
      }

      let subStatus = 'ACTIVE';
      let daysDiff = 0;

      const endMs = new Date(endDate).getTime();
      const nowMs = now.getTime();

      if (nowMs > endMs) {
        subStatus = 'OVERDUE';
        daysDiff = Math.ceil((nowMs - endMs) / (1000 * 60 * 60 * 24));
      } else {
        daysDiff = Math.ceil((endMs - nowMs) / (1000 * 60 * 60 * 24));
        if (daysDiff <= 5) {
          subStatus = 'DUE';
        }
      }

      t.subscriptionStatus = subStatus;
      await this.tenantRepository.save(t);

      result.push({
        ...t,
        subscriptionStatus: subStatus,
        daysDifference: daysDiff,
      });
    }

    return result;
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
    subscriptionStartDate?: string | Date;
    maxUsers?: number;
    maxPatientsQuota?: number;
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

    // Lookup Subscription Plan details to derive quotas & billing cycle
    const planCode = data.plan || TenantPlan.PROFESSIONAL;
    const plan = await this.planRepository.findOne({ where: { code: planCode } });

    const startDate = data.subscriptionStartDate ? new Date(data.subscriptionStartDate) : new Date();
    const billingDays = plan ? plan.billingCycleDays : 30;
    const endDate = new Date(startDate.getTime() + billingDays * 24 * 60 * 60 * 1000);

    // Deriving quotas from subscription tier
    const derivedMaxUsers = plan ? plan.maxUsersQuota : 50;
    const derivedMaxPatients = plan ? plan.maxPatientsQuota : 2000;

    const tenant = this.tenantRepository.create({
      ...data,
      subdomain: data.subdomain.toLowerCase(),
      currency: data.currency || 'USD',
      plan: planCode,
      status: TenantStatus.ACTIVE,
      isLocked: false,
      isMaintenanceMode: false,
      maxUsers: derivedMaxUsers,
      maxPatientsQuota: derivedMaxPatients,
      subscriptionStartDate: startDate,
      subscriptionEndDate: endDate,
      subscriptionStatus: 'ACTIVE',
      smtpHost: data.smtpHost || 'localhost',
      smtpPort: data.smtpPort || 1025,
      senderEmail: data.senderEmail || `notifications@${data.subdomain}.clinic.com`,
      senderName: data.senderName || `${data.name} Care Team`,
    });

    const savedTenant = await this.tenantRepository.save(tenant);

    // Auto-create Initial Hospital Admin User Credentials
    const defaultEmail = data.contactEmail || `admin@${savedTenant.subdomain}.com`;
    const tempPassword = 'Admin@123456';
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const adminUser = this.userRepository.create({
      fullName: `${savedTenant.name} Administrator`,
      email: defaultEmail,
      password: hashedPassword,
      role: UserRole.ADMIN,
      tenantId: savedTenant.id,
      isActive: true,
    });
    await this.userRepository.save(adminUser);

    // Auto-generate Initial Subscription Billing Invoice
    const invCount = await this.invoiceRepository.count();
    const invoiceNum = `SUB-INV-2026-${(invCount + 1).toString().padStart(4, '0')}`;
    const invoice = this.invoiceRepository.create({
      tenantId: savedTenant.id,
      invoiceNumber: invoiceNum,
      planCode,
      amount: plan ? plan.pricePerMonth : 299.0,
      currency: savedTenant.currency,
      billingCycleDays: billingDays,
      dueDate: endDate,
      paidAt: new Date(),
      status: SubscriptionInvoiceStatus.PAID,
      paymentMethod: 'SUPERADMIN_INITIAL_PROVISION',
    });
    await this.invoiceRepository.save(invoice);

    // Dispatch Automated Welcome Email via Outbound SMTP Relay
    if (savedTenant.contactEmail) {
      const welcomeSubject = `🎉 Welcome to ApexCare HMS - Subscriber Workspace Provisioned: ${savedTenant.name}`;
      const welcomeHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 16px; border: 1px solid #334155;">
          <h2 style="color: #38bdf8; margin-top: 0;">Subscriber Hospital Workspace Provisioned</h2>
          <p>Dear <strong>${savedTenant.name} Administrator</strong>,</p>
          <p>Your enterprise hospital management workspace has been successfully provisioned on the ApexCare Multi-Tenant SaaS Platform.</p>
          
          <div style="background: #1e293b; padding: 16px; border-radius: 12px; border: 1px solid #334155; font-family: monospace; color: #38bdf8; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Hospital Workspace:</strong> ${savedTenant.name}</p>
            <p style="margin: 4px 0;"><strong>Portal URL:</strong> http://localhost:5178 (${savedTenant.subdomain}.clinic.com)</p>
            <p style="margin: 4px 0;"><strong>Admin Login Email:</strong> ${defaultEmail}</p>
            <p style="margin: 4px 0;"><strong>Temporary Password:</strong> ${tempPassword}</p>
            <p style="margin: 4px 0;"><strong>Subscription Tier:</strong> ${planCode} (${savedTenant.currency})</p>
            <p style="margin: 4px 0;"><strong>Staff Account Quota:</strong> ${savedTenant.maxUsers} Staff Accounts (Derived)</p>
            <p style="margin: 4px 0;"><strong>Patient Onboarding Quota:</strong> ${savedTenant.maxPatientsQuota} Patients (Derived)</p>
            <p style="margin: 4px 0;"><strong>Subscription Start Date:</strong> ${startDate.toLocaleDateString()}</p>
            <p style="margin: 4px 0;"><strong>Subscription Expiry / Due Date:</strong> ${endDate.toLocaleDateString()}</p>
          </div>

          <p style="font-size: 13px; color: #cbd5e1;">Please login to your portal and update your password immediately upon first access.</p>
          <hr style="border: none; border-top: 1px solid #334155; margin: 20px 0;" />
          <p style="font-size: 11px; color: #94a3b8;">ApexCare Enterprise SaaS Platform Operations &copy; 2026</p>
        </div>
      `;
      await this.notificationService.sendEmail(savedTenant.contactEmail, welcomeSubject, '', welcomeHtml);
    }

    return savedTenant;
  }

  async update(id: string, data: Partial<Tenant> & { subscriptionStartDate?: string | Date }): Promise<Tenant> {
    const tenant = await this.findOne(id);

    if (data.plan || data.subscriptionStartDate) {
      const planCode = data.plan || tenant.plan;
      const plan = await this.planRepository.findOne({ where: { code: planCode } });
      if (plan) {
        tenant.plan = planCode as any;
        tenant.maxUsers = plan.maxUsersQuota;
        tenant.maxPatientsQuota = plan.maxPatientsQuota;

        const startDate = data.subscriptionStartDate
          ? new Date(data.subscriptionStartDate)
          : (tenant.subscriptionStartDate || new Date());

        tenant.subscriptionStartDate = startDate;
        tenant.subscriptionEndDate = new Date(new Date(startDate).getTime() + plan.billingCycleDays * 24 * 60 * 60 * 1000);
      }
    }

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
    emailHeaderTemplate?: string;
    emailFooterTemplate?: string;
  }): Promise<Tenant> {
    const tenant = await this.findOne(id);
    tenant.smtpHost = smtpConfig.smtpHost;
    tenant.smtpPort = smtpConfig.smtpPort;
    tenant.smtpUser = smtpConfig.smtpUser;
    if (smtpConfig.smtpPassword) tenant.smtpPassword = smtpConfig.smtpPassword;
    tenant.senderEmail = smtpConfig.senderEmail;
    tenant.senderName = smtpConfig.senderName;
    if (smtpConfig.emailHeaderTemplate !== undefined) tenant.emailHeaderTemplate = smtpConfig.emailHeaderTemplate;
    if (smtpConfig.emailFooterTemplate !== undefined) tenant.emailFooterTemplate = smtpConfig.emailFooterTemplate;
    return await this.tenantRepository.save(tenant);
  }

  async toggleLock(id: string, isLocked: boolean, lockReason?: string): Promise<Tenant> {
    const tenant = await this.findOne(id);
    tenant.isLocked = isLocked;
    tenant.lockReason = isLocked ? (lockReason || 'Tenant account locked due to administrative policy or subscription hold.') : undefined;
    tenant.status = isLocked ? TenantStatus.LOCKED : TenantStatus.ACTIVE;
    return await this.tenantRepository.save(tenant);
  }

  async toggleMaintenance(id: string, isMaintenanceMode: boolean, maintenanceMessage?: string): Promise<Tenant> {
    const tenant = await this.findOne(id);
    tenant.isMaintenanceMode = isMaintenanceMode;
    tenant.maintenanceMessage = isMaintenanceMode ? (maintenanceMessage || 'System scheduled maintenance in progress. Access temporarily paused.') : undefined;
    return await this.tenantRepository.save(tenant);
  }

  async toggleStatus(id: string, status: TenantStatus): Promise<Tenant> {
    const tenant = await this.findOne(id);
    tenant.status = status;
    return await this.tenantRepository.save(tenant);
  }

  // --- Subscription Billing & Renewals ---
  async getTenantInvoices(tenantId: string): Promise<TenantSubscriptionInvoice[]> {
    return await this.invoiceRepository.find({ where: { tenantId }, order: { createdAt: 'DESC' } });
  }

  async getAllSubscriptionInvoices(): Promise<TenantSubscriptionInvoice[]> {
    return await this.invoiceRepository.find({ order: { createdAt: 'DESC' } });
  }

  async renewTenantSubscription(data: {
    tenantId: string;
    planCode: string;
    durationDays?: number;
    paymentMethod?: string;
  }): Promise<{ tenant: Tenant; invoice: TenantSubscriptionInvoice }> {
    const tenant = await this.findOne(data.tenantId);
    const plan = await this.planRepository.findOne({ where: { code: data.planCode } });

    const billingDays = data.durationDays || (plan ? plan.billingCycleDays : 30);
    const currentEnd = tenant.subscriptionEndDate && tenant.subscriptionEndDate > new Date()
      ? new Date(tenant.subscriptionEndDate)
      : new Date();

    const newEnd = new Date(currentEnd.getTime() + billingDays * 24 * 60 * 60 * 1000);

    tenant.plan = data.planCode as any;
    tenant.subscriptionEndDate = newEnd;
    tenant.subscriptionStatus = 'ACTIVE';
    tenant.isLocked = false;
    if (plan) {
      tenant.maxPatientsQuota = plan.maxPatientsQuota;
      tenant.maxUsers = plan.maxUsersQuota;
    }
    const updatedTenant = await this.tenantRepository.save(tenant);

    const invCount = await this.invoiceRepository.count();
    const invoiceNum = `SUB-INV-2026-${(invCount + 1).toString().padStart(4, '0')}`;
    const invoice = this.invoiceRepository.create({
      tenantId: tenant.id,
      invoiceNumber: invoiceNum,
      planCode: data.planCode,
      amount: plan ? plan.pricePerMonth : 299.0,
      currency: tenant.currency,
      billingCycleDays: billingDays,
      dueDate: newEnd,
      paidAt: new Date(),
      status: SubscriptionInvoiceStatus.PAID,
      paymentMethod: data.paymentMethod || 'SUPERADMIN_MANUAL_RENEWAL',
    });
    const savedInvoice = await this.invoiceRepository.save(invoice);

    // Dispatch Digital Renewal Receipt Email via Outbound SMTP Relay
    if (tenant.contactEmail) {
      const receiptSubject = `💳 Subscription Renewed: ${tenant.name} (${data.planCode} Plan)`;
      const receiptHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 16px; border: 1px solid #334155;">
          <h2 style="color: #38bdf8; margin-top: 0;">Subscription Renewal Receipt</h2>
          <p>Dear <strong>${tenant.name} Administrator</strong>,</p>
          <p>Your subscription for hospital workspace <strong>${tenant.name}</strong> has been successfully renewed.</p>
          
          <div style="background: #1e293b; padding: 16px; border-radius: 12px; border: 1px solid #334155; font-family: monospace; color: #38bdf8; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Invoice Number:</strong> ${invoiceNum}</p>
            <p style="margin: 4px 0;"><strong>Subscription Tier:</strong> ${data.planCode}</p>
            <p style="margin: 4px 0;"><strong>Amount Paid:</strong> ${tenant.currency} ${invoice.amount}</p>
            <p style="margin: 4px 0;"><strong>Billing Extension:</strong> ${billingDays} Days</p>
            <p style="margin: 4px 0;"><strong>New Expiry Date:</strong> ${newEnd.toLocaleDateString()}</p>
            <p style="margin: 4px 0;"><strong>Staff Account Quota:</strong> ${tenant.maxUsers} Staff Accounts</p>
            <p style="margin: 4px 0;"><strong>Patient Onboarding Quota:</strong> ${tenant.maxPatientsQuota} Patients</p>
          </div>

          <p style="font-size: 11px; color: #94a3b8;">ApexCare Enterprise SaaS Platform Operations &copy; 2026</p>
        </div>
      `;
      await this.notificationService.sendEmail(tenant.contactEmail, receiptSubject, '', receiptHtml);
    }

    return { tenant: updatedTenant, invoice: savedInvoice };
  }

  async sendTestSmtp(id: string, recipientEmail: string): Promise<{ success: boolean; message: string }> {
    const tenant = await this.findOne(id);
    await this.notificationService.sendWelcomeEmail(
      recipientEmail,
      `Staff Member (${tenant.name})`,
      'ADMIN' as any,
      'TestPassword123!',
    );
    return {
      success: true,
      message: `Test email successfully dispatched to ${recipientEmail} via SMTP Server (${tenant.smtpHost}:${tenant.smtpPort})`,
    };
  }

  async delete(id: string): Promise<void> {
    await this.tenantRepository.delete(id);
  }
}
