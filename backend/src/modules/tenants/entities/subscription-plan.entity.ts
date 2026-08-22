import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string; // e.g. STARTER, PROFESSIONAL, ENTERPRISE, CUSTOM

  @Column()
  name: string; // e.g. "Starter Tier Plan"

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  pricePerMonth: number;

  @Column({ default: 'USD' })
  currency: string; // e.g. USD, NGN, EUR, GBP

  @Column({ default: 30 })
  billingCycleDays: number; // e.g. 30 days, 365 days

  @Column({ default: 500 })
  maxPatientsQuota: number; // Max patients allowed for tenant under this plan

  @Column({ default: 20 })
  maxUsersQuota: number; // Max staff users allowed

  @Column('simple-json', { nullable: true })
  features: string[]; // e.g. ["EMR", "Appointments", "Billing", "Pharmacy", "IPD"]

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
