import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

export enum RadiologyStatus {
  ORDERED = 'ORDERED',
  IN_PROGRESS = 'IN_PROGRESS',
  REPORTED = 'REPORTED',
  CANCELLED = 'CANCELLED',
}

@Entity('radiology_orders')
export class RadiologyOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  orderNumber: string; // RAD-2026-0001

  @Column()
  patientId: string;

  @Column()
  patientName: string;

  @Column()
  doctorId: string;

  @Column()
  doctorName: string;

  @Column()
  modality: string; // 'X-Ray' | 'Ultrasound USG' | 'CT Scan' | 'MRI' | 'Mammography'

  @Column()
  procedureName: string; // e.g. 'Chest X-Ray Digital View (PA)'

  @Column({
    type: 'varchar',
    default: RadiologyStatus.ORDERED,
  })
  status: RadiologyStatus;

  @Column({ nullable: true })
  radiologistNotes: string; // Findings

  @Column({ nullable: true })
  impression: string; // Diagnostic Summary

  @Column({ nullable: true })
  reportedBy: string; // Radiologist Name

  @Column('float', { default: 85.0 })
  cost: number;

  @VersionColumn()
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
