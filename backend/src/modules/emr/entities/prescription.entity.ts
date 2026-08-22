import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

export enum PrescriptionStatus {
  PENDING = 'PENDING',
  DISPENSED = 'DISPENSED',
  CANCELLED = 'CANCELLED',
}

export interface PrescriptionItem {
  drugId: string;
  drugName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  quantity: number;
}

@Entity('prescriptions')
export class Prescription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  tenantId: string;

  @Column()
  consultationId: string;

  @Column()
  patientId: string;

  @Column()
  patientName: string;

  @Column()
  doctorId: string;

  @Column()
  doctorName: string;

  @Column('simple-json')
  items: PrescriptionItem[];

  @Column({
    type: 'varchar',
    default: PrescriptionStatus.PENDING,
  })
  status: PrescriptionStatus;

  @Column({ nullable: true })
  dispensedBy: string;

  @Column({ nullable: true })
  dispensedAt: Date;

  @VersionColumn()
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
