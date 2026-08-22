import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

export enum ClaimStatus {
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SETTLED = 'SETTLED',
}

@Entity('hmo_claims')
export class HmoClaim {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  claimNumber: string; // CLM-2026-0001

  @Column()
  patientId: string;

  @Column()
  patientName: string;

  @Column()
  hmoProvider: string; // e.g. 'Hygeia HMO', 'Reliance HMO', 'AXA Mansard'

  @Column()
  policyNumber: string;

  @Column({ nullable: true })
  preAuthCode: string;

  @Column('float', { default: 0.0 })
  claimAmount: number;

  @Column('float', { default: 0.0 })
  copayAmount: number;

  @Column({
    type: 'varchar',
    default: ClaimStatus.SUBMITTED,
  })
  status: ClaimStatus;

  @Column({ nullable: true })
  rejectionReason: string;

  @VersionColumn()
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
