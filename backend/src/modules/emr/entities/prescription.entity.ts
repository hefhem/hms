import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

export interface PrescriptionItem {
  drugId: string;
  drugName: string;
  dosage: string; // e.g. '500mg'
  frequency: string; // e.g. 'TID (3x daily)'
  durationDays: number;
  quantity: number;
  notes?: string;
}

export enum PrescriptionStatus {
  PENDING = 'PENDING',
  DISPENSED = 'DISPENSED',
  CANCELLED = 'CANCELLED',
}

@Entity('prescriptions')
export class Prescription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  consultationId: string;

  @Column()
  patientId: string;

  @Column()
  patientName: string;

  @Column()
  doctorId: string;

  @Column()
  doctorName: string;

  @Column({
    type: 'varchar',
    default: PrescriptionStatus.PENDING,
  })
  status: PrescriptionStatus;

  @Column('simple-json')
  items: PrescriptionItem[];

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
