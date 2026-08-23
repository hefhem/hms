import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

export enum ServiceCategory {
  CONSULTATION = 'CONSULTATION',
  LABORATORY = 'LABORATORY',
  RADIOLOGY = 'RADIOLOGY',
  SURGERY = 'SURGERY',
  NURSING = 'NURSING',
  OTHER = 'OTHER',
}

@Entity('service_items')
export class ServiceItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  tenantId: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({
    type: 'varchar',
    default: ServiceCategory.CONSULTATION,
  })
  category: ServiceCategory;

  @Column({ nullable: true })
  department?: string; // Sub-category/Department (e.g. Hematology, Biochemistry, X-Ray, MRI)

  @Column({ nullable: true })
  specimenType?: string; // For LAB (e.g. Whole Blood, Serum, Urine)

  @Column({ nullable: true })
  referenceRange?: string; // For LAB (e.g. 4.5 - 11.0 x10^9/L, Negative)

  @Column({ nullable: true })
  modality?: string; // For RADIOLOGY (e.g. X-RAY, ULTRASOUND, CT_SCAN, MRI)

  @Column({ nullable: true })
  bodyRegion?: string; // For RADIOLOGY (e.g. Chest, Abdomen, Brain)

  @Column({ nullable: true })
  prepInstructions?: string; // Patient preparation notes (e.g. Fasting 8 hrs prior)

  @Column('float')
  price: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column('float', { default: 0 })
  taxRate: number;

  @Column({ default: true })
  isActive: boolean;

  @VersionColumn()
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
