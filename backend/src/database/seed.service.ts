import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../modules/users/entities/user.entity';
import { UserRole } from '../common/enums/role.enum';
import { Patient } from '../modules/patients/entities/patient.entity';
import { Drug } from '../modules/pharmacy/entities/drug.entity';
import { LabOrder, LabOrderStatus } from '../modules/lab/entities/lab-order.entity';
import { ServiceItem, ServiceCategory } from '../modules/services/entities/service-item.entity';
import { RadiologyOrder, RadiologyStatus } from '../modules/radiology/entities/radiology-order.entity';
import { Bed, BedStatus } from '../modules/ipd/entities/bed.entity';
import { HmoClaim, ClaimStatus } from '../modules/insurance/entities/hmo-claim.entity';
import { HmoProvider } from '../modules/insurance/entities/hmo-provider.entity';
import { Tenant, TenantStatus, TenantPlan } from '../modules/tenants/entities/tenant.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Patient) private patientRepository: Repository<Patient>,
    @InjectRepository(Drug) private drugRepository: Repository<Drug>,
    @InjectRepository(LabOrder) private labRepository: Repository<LabOrder>,
    @InjectRepository(ServiceItem) private serviceRepository: Repository<ServiceItem>,
    @InjectRepository(RadiologyOrder) private radRepository: Repository<RadiologyOrder>,
    @InjectRepository(Bed) private bedRepository: Repository<Bed>,
    @InjectRepository(HmoClaim) private hmoClaimRepository: Repository<HmoClaim>,
    @InjectRepository(HmoProvider) private hmoProviderRepository: Repository<HmoProvider>,
    @InjectRepository(Tenant) private tenantRepository: Repository<Tenant>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedTenants();
    await this.seedUsers();
    await this.seedPatients();
    await this.seedPharmacy();
    await this.seedLab();
    await this.seedServices();
    await this.seedRadiology();
    await this.seedBeds();
    await this.seedHmoProviders();
    await this.seedInsurance();
  }

  private async seedTenants() {
    const count = await this.tenantRepository.count();
    if (count > 0) return;

    this.logger.log('Seeding baseline Multi-Tenant Workspaces...');
    const demoTenants = [
      {
        name: 'ApexCare Main Medical Center',
        subdomain: 'apexcare',
        currency: 'USD',
        plan: TenantPlan.ENTERPRISE,
        maxUsers: 250,
        contactEmail: 'admin@apexcare.clinic',
        contactPhone: '+1 (555) 019-2831',
        status: TenantStatus.ACTIVE,
      },
      {
        name: 'St. Nicholas Specialist Hospital',
        subdomain: 'stnicholas',
        currency: 'NGN',
        plan: TenantPlan.PROFESSIONAL,
        maxUsers: 100,
        contactEmail: 'info@stnicholas.com',
        contactPhone: '+234 1 271 0000',
        status: TenantStatus.ACTIVE,
      },
    ];

    for (const t of demoTenants) {
      await this.tenantRepository.save(this.tenantRepository.create(t));
    }
    this.logger.log('Tenants seeded.');
  }

  private async seedUsers() {
    const userCount = await this.userRepository.count();
    if (userCount > 0) return;

    const tenants = await this.tenantRepository.find();
    const apexId = tenants.find((t) => t.subdomain === 'apexcare')?.id;
    const stNichId = tenants.find((t) => t.subdomain === 'stnicholas')?.id;

    this.logger.log('Seeding initial Enterprise System Users per Tenant...');

    const defaultPassword = await bcrypt.hash('Admin@123456', 10);
    const usersData = [
      // ApexCare Staff
      { tenantId: apexId, email: 'admin@clinic.com', fullName: 'Dr. Sarah Connor (Chief Admin)', role: UserRole.ADMIN },
      { tenantId: apexId, email: 'doctor@clinic.com', fullName: 'Dr. Alexander Fleming (MD Internal)', role: UserRole.DOCTOR },
      { tenantId: apexId, email: 'nurse@clinic.com', fullName: 'Florence Nightingale (RN)', role: UserRole.NURSE },
      { tenantId: apexId, email: 'pharmacist@clinic.com', fullName: 'Marcus Vance (PharmD)', role: UserRole.PHARMACIST },
      { tenantId: apexId, email: 'receptionist@clinic.com', fullName: 'Elena Rostova (Front Desk)', role: UserRole.RECEPTIONIST },
      { tenantId: apexId, email: 'billing@clinic.com', fullName: 'Arthur Pendelton (Billing Mgr)', role: UserRole.BILLING_CLERK },

      // St. Nicholas Specialist Hospital Staff
      { tenantId: stNichId, email: 'doctor@stnicholas.com', fullName: 'Dr. Chidi Okafor (Consultant Surgeon)', role: UserRole.DOCTOR },
      { tenantId: stNichId, email: 'admin@stnicholas.com', fullName: 'Amina Bello (Hospital Admin)', role: UserRole.ADMIN },
      { tenantId: stNichId, email: 'nurse@stnicholas.com', fullName: 'Ngozi Eze (RN Senior Nurse)', role: UserRole.NURSE },
      { tenantId: stNichId, email: 'billing@stnicholas.com', fullName: 'Babajide Adeleke (Accounts Lead)', role: UserRole.BILLING_CLERK },
    ];

    for (const u of usersData) {
      const user = this.userRepository.create({
        ...u,
        password: defaultPassword,
        mfaEnabled: false,
        isActive: true,
      });
      await this.userRepository.save(user);
    }
    this.logger.log('Users successfully seeded for tenants.');
  }

  private async seedPatients() {
    const patientCount = await this.patientRepository.count();
    if (patientCount > 0) return;

    const tenants = await this.tenantRepository.find();
    const apexId = tenants.find((t) => t.subdomain === 'apexcare')?.id;
    const stNichId = tenants.find((t) => t.subdomain === 'stnicholas')?.id;

    this.logger.log('Seeding sample patient records per Tenant...');
    const demoPatients = [
      {
        tenantId: apexId,
        mrn: 'MRN-2026-0001',
        fullName: 'Johnathan Edward Doe',
        gender: 'Male',
        dateOfBirth: '1988-04-12',
        phone: '+1 (555) 234-5678',
        email: 'john.doe@example.com',
        address: '142 Maplewood Avenue, Suite 3B',
        bloodGroup: 'O+',
        allergies: 'Penicillin, Dust Mites',
      },
      {
        tenantId: apexId,
        mrn: 'MRN-2026-0002',
        fullName: 'Alice Beatrice Smith',
        gender: 'Female',
        dateOfBirth: '1994-09-25',
        phone: '+1 (555) 876-5432',
        email: 'alice.smith@example.com',
        address: '891 Oakridge Drive',
        bloodGroup: 'A-',
        allergies: 'Sulfa Drugs',
      },
      {
        tenantId: stNichId,
        mrn: 'MRN-STN-0001',
        fullName: 'Emeka Olusola Williams',
        gender: 'Male',
        dateOfBirth: '1980-06-15',
        phone: '+234 803 123 4567',
        email: 'emeka.williams@example.com',
        address: '15 Victoria Island Blvd, Lagos',
        bloodGroup: 'B+',
        allergies: 'None',
      },
    ];

    for (const p of demoPatients) {
      await this.patientRepository.save(this.patientRepository.create(p));
    }
    this.logger.log('Patients seeded.');
  }

  private async seedPharmacy() {
    const drugCount = await this.drugRepository.count();
    if (drugCount > 0) return;

    const tenants = await this.tenantRepository.find();
    const apexId = tenants.find((t) => t.subdomain === 'apexcare')?.id;
    const stNichId = tenants.find((t) => t.subdomain === 'stnicholas')?.id;

    this.logger.log('Seeding baseline drug inventory catalog per Tenant...');
    const demoDrugs = [
      {
        tenantId: apexId,
        code: 'DRUG-AMOX-500',
        name: 'Amoxicillin Trihydrate 500mg',
        category: 'Antibiotics',
        unitPrice: 12.50,
        quantityInStock: 250,
        reorderLevel: 30,
        unit: 'Capsules',
      },
      {
        tenantId: stNichId,
        code: 'DRUG-STN-AMOX-500',
        name: 'Amoxicillin Trihydrate 500mg (St. Nicholas)',
        category: 'Antibiotics',
        unitPrice: 8500.00,
        quantityInStock: 400,
        reorderLevel: 50,
        unit: 'Capsules',
      },
      {
        tenantId: stNichId,
        code: 'DRUG-STN-PARA-500',
        name: 'Paracetamol 500mg Extra (St. Nicholas)',
        category: 'Analgesics',
        unitPrice: 1200.00,
        quantityInStock: 1000,
        reorderLevel: 100,
        unit: 'Tablets',
      },
    ];

    for (const d of demoDrugs) {
      await this.drugRepository.save(this.drugRepository.create(d));
    }
    this.logger.log('Pharmacy catalog seeded.');
  }

  private async seedLab() {
    const count = await this.labRepository.count();
    if (count > 0) return;

    const patients = await this.patientRepository.find();
    if (patients.length === 0) return;

    this.logger.log('Seeding baseline Laboratory Orders Queue...');

    const demoLabOrders = [
      {
        tenantId: patients[0].tenantId,
        orderNumber: 'LAB-2026-0001',
        patientId: patients[0].id,
        patientName: patients[0].fullName,
        doctorId: 'doc-1',
        doctorName: 'Dr. Alexander Fleming (MD Internal)',
        testName: 'Complete Blood Count (CBC Panel)',
        specimenType: 'Venous Blood',
        sampleBarcode: 'BAR-2026-9011',
        status: LabOrderStatus.SAMPLE_COLLECTED,
        cost: 50.0,
      },
    ];

    for (const l of demoLabOrders) {
      await this.labRepository.save(this.labRepository.create(l));
    }
    this.logger.log('Laboratory orders seeded.');
  }

  private async seedServices() {
    const count = await this.serviceRepository.count();
    if (count > 0) return;

    const tenants = await this.tenantRepository.find();
    const apexId = tenants.find((t) => t.subdomain === 'apexcare')?.id;
    const stNichId = tenants.find((t) => t.subdomain === 'stnicholas')?.id;

    this.logger.log('Seeding baseline Service Master per Tenant...');

    const demoServices = [
      { tenantId: apexId, code: 'SRV-CONS-GEN', name: 'General Doctor Consultation Fee', category: ServiceCategory.CONSULTATION, price: 50.0, taxRate: 0 },
      { tenantId: stNichId, code: 'SRV-STN-CONS', name: 'St. Nicholas Specialist Consultation Fee', category: ServiceCategory.CONSULTATION, price: 35000.0, taxRate: 0 },
      { tenantId: stNichId, code: 'SRV-STN-LAB-CBC', name: 'St. Nicholas Complete Blood Count', category: ServiceCategory.LABORATORY, price: 25000.0, taxRate: 0 },
    ];

    for (const s of demoServices) {
      await this.serviceRepository.save(this.serviceRepository.create(s));
    }
    this.logger.log('Service Master Catalog seeded.');
  }

  private async seedRadiology() {
    const count = await this.radRepository.count();
    if (count > 0) return;

    const patients = await this.patientRepository.find();
    if (patients.length === 0) return;

    this.logger.log('Seeding baseline Radiology (RIS) Orders...');

    const demoRad = [
      {
        tenantId: patients[0].tenantId,
        orderNumber: 'RAD-2026-0001',
        patientId: patients[0].id,
        patientName: patients[0].fullName,
        doctorId: 'doc-1',
        doctorName: 'Dr. Alexander Fleming',
        modality: 'X-Ray',
        procedureName: 'Chest X-Ray Digital View (PA)',
        status: RadiologyStatus.REPORTED,
        cost: 85.0,
        radiologistNotes: 'Normal bronchovascular markings.',
        impression: 'Unremarkable Chest Radiograph.',
        reportedBy: 'Dr. Evelyn Reed',
      },
    ];

    for (const r of demoRad) {
      await this.radRepository.save(this.radRepository.create(r));
    }
  }

  private async seedBeds() {
    const count = await this.bedRepository.count();
    if (count > 0) return;

    const tenants = await this.tenantRepository.find();
    const apexId = tenants.find((t) => t.subdomain === 'apexcare')?.id;
    const stNichId = tenants.find((t) => t.subdomain === 'stnicholas')?.id;

    this.logger.log('Seeding baseline IPD Bed Board per Tenant...');

    const demoBeds = [
      { tenantId: apexId, bedNumber: 'BED-101', wardName: 'General Male Ward', bedClass: 'GENERAL', pricePerNight: 80.0, status: BedStatus.VACANT },
      { tenantId: stNichId, bedNumber: 'STN-BED-101', wardName: 'St. Nicholas Private Ward A', bedClass: 'PRIVATE', pricePerNight: 75000.0, status: BedStatus.VACANT },
    ];

    for (const b of demoBeds) {
      await this.bedRepository.save(this.bedRepository.create(b));
    }
  }

  private async seedHmoProviders() {
    const count = await this.hmoProviderRepository.count();
    if (count > 0) return;

    const tenants = await this.tenantRepository.find();
    const apexId = tenants.find((t) => t.subdomain === 'apexcare')?.id;
    const stNichId = tenants.find((t) => t.subdomain === 'stnicholas')?.id;

    this.logger.log('Seeding baseline HMO Providers Master per Tenant...');

    const demoProviders = [
      { tenantId: apexId, code: 'HMO-REL', name: 'Reliance HMO', planType: 'Comprehensive Corporate', contactEmail: 'claims@reliancehmo.com', contactPhone: '+1 (555) 019-2831' },
      { tenantId: stNichId, code: 'HMO-HYG-NG', name: 'Hygeia HMO Nigeria', planType: 'Gold & Executive Care', contactEmail: 'auth@hygeiahmo.com', contactPhone: '+234 1 271 0000' },
    ];

    for (const p of demoProviders) {
      await this.hmoProviderRepository.save(this.hmoProviderRepository.create(p));
    }
  }

  private async seedInsurance() {
    const count = await this.hmoClaimRepository.count();
    if (count > 0) return;

    const patients = await this.patientRepository.find();
    if (patients.length === 0) return;

    this.logger.log('Seeding baseline Insurance / HMO Claims...');

    const demoClaims = [
      {
        tenantId: patients[0].tenantId,
        claimNumber: 'CLM-2026-0001',
        patientId: patients[0].id,
        patientName: patients[0].fullName,
        hmoProvider: 'Reliance HMO',
        policyNumber: 'POL-REL-882190',
        preAuthCode: 'AUTH-9921',
        claimAmount: 185.0,
        copayAmount: 15.0,
        status: ClaimStatus.SUBMITTED,
      },
    ];

    for (const c of demoClaims) {
      await this.hmoClaimRepository.save(this.hmoClaimRepository.create(c));
    }
  }
}
