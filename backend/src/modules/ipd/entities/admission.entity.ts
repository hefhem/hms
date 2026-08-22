import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

export enum AdmissionStatus {
  ADMITTED = 'ADMITTED',
  DISCHARGED = 'DISCHARGED',
}

@Entity('admissions')
export class Admission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  admissionNumber: string; // ADM-2026-0001

  @Column()
  patientId: string;

  @Column()
  patientName: string;

  @Column()
  bedId: string;

  @Column()
  bedNumber: string;

  @Column()
  attendingDoctor: string;

  @Column({ nullable: true })
  admissionReason: string;

  @Column({
    type: 'varchar',
    default: AdmissionStatus.ADMITTED,
  })
  status: AdmissionStatus;

  @Column({ nullable: true })
  dischargeSummary: string;

  @Column({ nullable: true })
  dischargedAt: Date;

  @VersionColumn()
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
