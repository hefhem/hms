import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  userEmail: string;

  @Column({ nullable: true })
  userRole: string;

  @Column()
  action: string; // e.g., 'CREATE', 'UPDATE', 'DELETE', 'DISPENSE', 'LOGIN', 'MFA_VERIFY', 'IMPORT', 'EXPORT'

  @Column()
  entityName: string; // e.g., 'Patient', 'Drug', 'Prescription', 'Invoice', 'User'

  @Column({ nullable: true })
  entityId: string;

  @Column('simple-json', { nullable: true })
  previousState: any;

  @Column('simple-json', { nullable: true })
  newState: any;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @CreateDateColumn()
  timestamp: Date;
}
