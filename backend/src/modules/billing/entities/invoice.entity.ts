import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

export interface InvoiceLineItem {
  description: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  INSURANCE = 'INSURANCE',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  invoiceNumber: string; // INV-2026-0001

  @Column()
  patientId: string;

  @Column()
  patientName: string;

  @Column({ nullable: true })
  consultationId: string;

  @Column({ nullable: true })
  prescriptionId: string;

  @Column('float')
  totalAmount: number;

  @Column('float', { default: 0 })
  discount: number;

  @Column('float')
  finalAmount: number;

  @Column({
    type: 'varchar',
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @Column({
    type: 'varchar',
    default: PaymentMethod.CASH,
  })
  paymentMethod: PaymentMethod;

  @Column('simple-json')
  lineItems: InvoiceLineItem[];

  @Column({ nullable: true })
  notes: string;

  @VersionColumn()
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
