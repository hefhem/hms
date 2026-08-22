import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

export enum ConsultationStatus {
  DRAFT = 'DRAFT',
  PARKED = 'PARKED',
  FINALIZED = 'FINALIZED',
}

@Entity('consultations')
export class Consultation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  tenantId: string;

  @Column({ nullable: true })
  appointmentId: string;

  @Column()
  patientId: string;

  @Column()
  patientName: string;

  @Column()
  doctorId: string;

  @Column()
  doctorName: string;

  @Column({ nullable: true })
  chiefComplaint: string;

  @Column({ nullable: true })
  hpi: string;

  @Column({ nullable: true })
  icdCode: string;

  @Column({ nullable: true })
  diagnosis: string;

  @Column({ nullable: true })
  clinicalNotes: string;

  @Column('simple-json', { nullable: true })
  labOrdersRequested: string[];

  @Column({
    type: 'varchar',
    default: ConsultationStatus.FINALIZED,
  })
  status: ConsultationStatus;

  @VersionColumn()
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
