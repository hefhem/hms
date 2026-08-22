import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum NotificationStage {
  CHECKED_IN = 'CHECKED_IN',
  TRIAGED = 'TRIAGED',
  IN_CONSULTATION = 'IN_CONSULTATION',
  LAB_ORDERED = 'LAB_ORDERED',
  LAB_RESULTED = 'LAB_RESULTED',
  PRESCRIPTION_GENERATED = 'PRESCRIPTION_GENERATED',
  PRESCRIPTION_DISPENSED = 'PRESCRIPTION_DISPENSED',
  PAYMENT_SETTLED = 'PAYMENT_SETTLED',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  message: string;

  @Column({ nullable: true })
  recipientRole: string; // 'NURSE' | 'DOCTOR' | 'PHARMACIST' | 'BILLING_CLERK' | 'RECEPTIONIST' | 'ADMIN'

  @Column({ nullable: true })
  recipientId: string;

  @Column({
    type: 'varchar',
    default: NotificationStage.CHECKED_IN,
  })
  stage: NotificationStage;

  @Column({ default: false })
  isRead: boolean;

  @Column('simple-json', { nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
