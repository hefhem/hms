import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
  OneToMany,
} from 'typeorm';
import { Triage } from './triage.entity';

@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  mrn: string; // Medical Record Number (e.g. MRN-2026-0001)

  @Column()
  fullName: string;

  @Column()
  gender: string; // 'Male' | 'Female' | 'Other'

  @Column()
  dateOfBirth: string; // YYYY-MM-DD

  @Column()
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  address: string;

  @Column({ default: 'Unknown' })
  bloodGroup: string; // e.g. A+, O-, etc.

  @Column({ nullable: true })
  allergies: string;

  @OneToMany(() => Triage, (triage) => triage.patient)
  triages: Triage[];

  @VersionColumn()
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
