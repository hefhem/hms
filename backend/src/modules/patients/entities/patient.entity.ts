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

  @Column({ nullable: true })
  tenantId: string;

  @Column({ unique: true })
  mrn: string;

  @Column()
  fullName: string;

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  dateOfBirth: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  bloodGroup: string;

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
