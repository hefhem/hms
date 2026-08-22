import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Patient } from './patient.entity';

@Entity('triages')
export class Triage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  patientId: string;

  @ManyToOne(() => Patient, (patient) => patient.triages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column('float')
  temperature: number; // Celsius

  @Column()
  bloodPressure: string; // e.g. '120/80'

  @Column('int')
  pulseRate: number; // bpm

  @Column('int')
  respiratoryRate: number;

  @Column('int')
  spo2: number; // Oxygen saturation %

  @Column('float')
  weight: number; // kg

  @Column('float')
  height: number; // cm

  @Column('float')
  bmi: number;

  @Column({ default: 'NON_URGENT' })
  triageCategory: string; // 'EMERGENCY' | 'URGENT' | 'SEMI_URGENT' | 'NON_URGENT'

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  recordedBy: string; // Nurse name or ID

  @CreateDateColumn()
  createdAt: Date;
}
