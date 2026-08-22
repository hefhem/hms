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
  ) {}

  async onApplicationBootstrap() {
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

  private async seedUsers() {
    const userCount = await this.userRepository.count();
    if (userCount > 0) return;

    this.logger.log('Seeding initial Enterprise System Users...');

    const defaultPassword = await bcrypt.hash('Admin@123456', 10);
    const usersData = [
      { email: 'admin@clinic.com', fullName: 'Dr. Sarah Connor (Chief Admin)', role: UserRole.ADMIN },
      { email: 'doctor@clinic.com', fullName: 'Dr. Alexander Fleming (MD Internal)', role: UserRole.DOCTOR },
      { email: 'nurse@clinic.com', fullName: 'Florence Nightingale (RN)', role: UserRole.NURSE },
      { email: 'pharmacist@clinic.com', fullName: 'Marcus Vance (PharmD)', role: UserRole.PHARMACIST },
      { email: 'receptionist@clinic.com', fullName: 'Elena Rostova (Front Desk)', role: UserRole.RECEPTIONIST },
      { email: 'billing@clinic.com', fullName: 'Arthur Pendelton (Billing Mgr)', role: UserRole.BILLING_CLERK },
    ];

    for (const u of usersData) {
      const user = this.userRepository.create({
        ...u,
        password: defaultPassword,
        mfaEnabled: false,
      });
      await this.userRepository.save(user);
    }
    this.logger.log('Users successfully seeded.');
  }

  private async seedPatients() {
    const patientCount = await this.patientRepository.count();
    if (patientCount > 0) return;

    this.logger.log('Seeding sample patient records...');
    const demoPatients = [
      {
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
        mrn: 'MRN-2026-0003',
        fullName: 'Robert Charles Vance',
        gender: 'Male',
        dateOfBirth: '1975-11-03',
        phone: '+1 (555) 345-6789',
        email: 'robert.vance@example.com',
        address: '27 Pinecrest Road',
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

    this.logger.log('Seeding baseline drug inventory catalog...');
    const demoDrugs = [
      {
        code: 'DRUG-AMOX-500',
        name: 'Amoxicillin Trihydrate 500mg',
        category: 'Antibiotics',
        unitPrice: 12.50,
        quantityInStock: 250,
        reorderLevel: 30,
        unit: 'Capsules',
      },
      {
        code: 'DRUG-PARA-500',
        name: 'Paracetamol / Acetaminophen 500mg',
        category: 'Analgesics & Antipyretics',
        unitPrice: 3.20,
        quantityInStock: 500,
        reorderLevel: 50,
        unit: 'Tablets',
      },
      {
        code: 'DRUG-MET-850',
        name: 'Metformin Hydrochloride 850mg',
        category: 'Antidiabetic',
        unitPrice: 18.00,
        quantityInStock: 180,
        reorderLevel: 25,
        unit: 'Tablets',
      },
      {
        code: 'DRUG-OMEP-20',
        name: 'Omeprazole Delayed-Release 20mg',
        category: 'Gastrointestinal',
        unitPrice: 15.75,
        quantityInStock: 15,
        reorderLevel: 20,
        unit: 'Capsules',
      },
      {
        code: 'DRUG-AML-5',
        name: 'Amlodipine Besylate 5mg',
        category: 'Cardiovascular',
        unitPrice: 9.90,
        quantityInStock: 300,
        reorderLevel: 40,
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
      {
        orderNumber: 'LAB-2026-0002',
        patientId: patients[1].id,
        patientName: patients[1].fullName,
        doctorId: 'doc-1',
        doctorName: 'Dr. Alexander Fleming (MD Internal)',
        testName: 'Lipid Profile Panel',
        specimenType: 'Fasting Blood',
        sampleBarcode: 'BAR-2026-9012',
        status: LabOrderStatus.RESULTED,
        cost: 65.0,
        performedBy: 'Lead Medical Lab Scientist',
        testParameters: [
          { parameter: 'Total Cholesterol', value: '215', unit: 'mg/dL', referenceRange: '< 200', isAbnormal: true },
          { parameter: 'Triglycerides', value: '140', unit: 'mg/dL', referenceRange: '< 150', isAbnormal: false },
          { parameter: 'HDL Cholesterol', value: '55', unit: 'mg/dL', referenceRange: '> 40', isAbnormal: false },
          { parameter: 'LDL Cholesterol', value: '132', unit: 'mg/dL', referenceRange: '< 100', isAbnormal: true },
        ],
        labNotes: 'Mild hypercholesterolemia noted. Dietary modifications advised.',
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

    this.logger.log('Seeding baseline Service Master & Price List Catalog...');

    const demoServices = [
      { code: 'SRV-CONS-GEN', name: 'General Doctor Consultation Fee', category: ServiceCategory.CONSULTATION, price: 50.0, taxRate: 0 },
      { code: 'SRV-CONS-SPEC', name: 'Specialist Physician Consultation', category: ServiceCategory.CONSULTATION, price: 95.0, taxRate: 0 },
      { code: 'SRV-LAB-CBC', name: 'Complete Blood Count (CBC Panel)', category: ServiceCategory.LABORATORY, price: 50.0, taxRate: 0 },
      { code: 'SRV-LAB-LIPID', name: 'Lipid Profile Panel', category: ServiceCategory.LABORATORY, price: 65.0, taxRate: 0 },
      { code: 'SRV-RAD-XRAY', name: 'Chest X-Ray Digital View (PA/AP)', category: ServiceCategory.RADIOLOGY, price: 85.0, taxRate: 0 },
      { code: 'SRV-RAD-USG', name: 'Abdominal Ultrasound Scan', category: ServiceCategory.RADIOLOGY, price: 120.0, taxRate: 0 },
      { code: 'SRV-NURS-IV', name: 'IV Cannulation & Infusion Admin', category: ServiceCategory.NURSING, price: 25.0, taxRate: 0 },
      { code: 'SRV-NURS-DRESS', name: 'Wound Dressing & Sterile Bandaging', category: ServiceCategory.NURSING, price: 35.0, taxRate: 0 },
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
        orderNumber: 'RAD-2026-0001',
        patientId: patients[0].id,
        patientName: patients[0].fullName,
        doctorId: 'doc-1',
        doctorName: 'Dr. Alexander Fleming',
        modality: 'X-Ray',
        procedureName: 'Chest X-Ray Digital View (PA)',
        status: RadiologyStatus.REPORTED,
        cost: 85.0,
        radiologistNotes: 'Normal bronchovascular markings. No pulmonary consolidation or pleural effusion.',
        impression: 'Unremarkable Chest Radiograph.',
        reportedBy: 'Dr. Evelyn Reed (Consultant Radiologist)',
      },
    ];

    for (const r of demoRad) {
      await this.radRepository.save(this.radRepository.create(r));
    }
  }

  private async seedBeds() {
    const count = await this.bedRepository.count();
    if (count > 0) return;

    this.logger.log('Seeding baseline IPD Bed Board...');

    const demoBeds = [
      { bedNumber: 'BED-101', wardName: 'General Male Ward', bedClass: 'GENERAL', pricePerNight: 80.0, status: BedStatus.VACANT },
      { bedNumber: 'BED-102', wardName: 'General Male Ward', bedClass: 'GENERAL', pricePerNight: 80.0, status: BedStatus.VACANT },
      { bedNumber: 'BED-201', wardName: 'Female Surgical Ward', bedClass: 'PRIVATE', pricePerNight: 150.0, status: BedStatus.VACANT },
      { bedNumber: 'ICU-01', wardName: 'Intensive Care Unit (ICU)', bedClass: 'ICU', pricePerNight: 350.0, status: BedStatus.VACANT },
      { bedNumber: 'SUITE-01', wardName: 'Executive VIP Suite', bedClass: 'PRIVATE', pricePerNight: 450.0, status: BedStatus.VACANT },
    ];

    for (const b of demoBeds) {
      await this.bedRepository.save(this.bedRepository.create(b));
    }
  }

  private async seedHmoProviders() {
    const count = await this.hmoProviderRepository.count();
    if (count > 0) return;

    this.logger.log('Seeding baseline HMO Providers Master...');

    const demoProviders = [
      { code: 'HMO-REL', name: 'Reliance HMO', planType: 'Comprehensive Corporate', contactEmail: 'claims@reliancehmo.com', contactPhone: '+1 (555) 019-2831' },
      { code: 'HMO-HYG', name: 'Hygeia HMO', planType: 'Gold & Executive Care', contactEmail: 'auth@hygeiahmo.com', contactPhone: '+1 (555) 018-4921' },
      { code: 'HMO-AXA', name: 'AXA Mansard Insurance', planType: 'International Health Plan', contactEmail: 'health@axamansard.com', contactPhone: '+1 (555) 017-9920' },
      { code: 'HMO-BUP', name: 'Bupa International', planType: 'Expatriate Global Cover', contactEmail: 'claims@bupa.com', contactPhone: '+44 20 7654 3210' },
      { code: 'HMO-NHIA', name: 'NHIA National Scheme', planType: 'Public Sector Health Scheme', contactEmail: 'info@nhia.gov.ng', contactPhone: '+234 9 461 4000' },
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
