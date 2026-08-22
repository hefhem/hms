import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CHECKED_IN = 'CHECKED_IN',
  TRIAGED = 'TRIAGED',
  IN_CONSULTATION = 'IN_CONSULTATION',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  tenantId: string;

  @Column()
  patientId: string;

  @Column()
  patientName: string;

  @Column({ nullable: true })
  doctorId: string;

  @Column({ default: 'Unassigned Physician' })
  doctorName: string;

  @Column()
  appointmentDate: string;

  @Column({ nullable: true })
  timeSlot: string;

  @Column({ nullable: true })
  reason: string;

  @Column({
    type: 'varchar',
    default: AppointmentStatus.SCHEDULED,
  })
  status: AppointmentStatus;

  @VersionColumn()
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
