import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

export enum LabOrderStatus {
  ORDERED = 'ORDERED',
  SAMPLE_COLLECTED = 'SAMPLE_COLLECTED',
  IN_ANALYSIS = 'IN_ANALYSIS',
  RESULTED = 'RESULTED',
  CANCELLED = 'CANCELLED',
}

export interface LabTestParameter {
  parameter: string;
  value: string;
  unit: string;
  referenceRange: string;
  isAbnormal?: boolean;
}

@Entity('lab_orders')
export class LabOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  orderNumber: string; // LAB-2026-0001

  @Column()
  patientId: string;

  @Column()
  patientName: string;

  @Column()
  doctorId: string;

  @Column()
  doctorName: string;

  @Column()
  testName: string; // e.g. 'Complete Blood Count (CBC)'

  @Column({ default: 'Venous Blood' })
  specimenType: string; // 'Venous Blood' | 'Urine' | 'Swab' | 'Tissue'

  @Column({ nullable: true })
  sampleBarcode: string; // e.g. BAR-2026-8891

  @Column({
    type: 'varchar',
    default: LabOrderStatus.ORDERED,
  })
  status: LabOrderStatus;

  @Column('simple-json', { nullable: true })
  testParameters: LabTestParameter[];

  @Column({ nullable: true })
  labNotes: string;

  @Column('float', { default: 45.0 })
  cost: number;

  @Column({ nullable: true })
  performedBy: string; // Lab Tech name

  @VersionColumn()
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
