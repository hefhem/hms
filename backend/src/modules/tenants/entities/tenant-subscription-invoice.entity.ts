import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum SubscriptionInvoiceStatus {
  PAID = 'PAID',
  UNPAID = 'UNPAID',
  OVERDUE = 'OVERDUE',
}

@Entity('tenant_subscription_invoices')
export class TenantSubscriptionInvoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column({ unique: true })
  invoiceNumber: string; // e.g., SUB-INV-2026-0001

  @Column()
  planCode: string; // e.g. PROFESSIONAL

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column({ default: 30 })
  billingCycleDays: number;

  @Column({ nullable: true })
  dueDate: Date;

  @Column({ nullable: true })
  paidAt: Date;

  @Column({ type: 'varchar', default: SubscriptionInvoiceStatus.PAID })
  status: SubscriptionInvoiceStatus;

  @Column({ default: 'SUPERADMIN_MANUAL' })
  paymentMethod: string;

  @CreateDateColumn()
  createdAt: Date;
}
