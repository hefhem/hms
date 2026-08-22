import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

export enum TenantPlan {
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
}

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string; // e.g. "ApexCare Medical Center"

  @Column({ unique: true })
  subdomain: string; // e.g. "apexcare"

  @Column({ default: 'USD' })
  currency: string; // e.g. "USD", "NGN", "EUR"

  @Column({
    type: 'varchar',
    default: TenantPlan.PROFESSIONAL,
  })
  plan: TenantPlan;

  @Column({
    type: 'varchar',
    default: TenantStatus.ACTIVE,
  })
  status: TenantStatus;

  @Column({ default: 50 })
  maxUsers: number;

  @Column({ nullable: true })
  contactEmail: string;

  @Column({ nullable: true })
  contactPhone: string;

  // Per-Tenant SMTP Mail Gateway Configurations
  @Column({ default: 'localhost' })
  smtpHost: string;

  @Column({ default: 1025 })
  smtpPort: number;

  @Column({ nullable: true })
  smtpUser: string;

  @Column({ nullable: true })
  smtpPassword: string;

  @Column({ default: 'notifications@clinic.com' })
  senderEmail: string;

  @Column({ default: 'Hospital Management System' })
  senderName: string;

  @VersionColumn()
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
