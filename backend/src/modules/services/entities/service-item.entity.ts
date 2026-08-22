import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

export enum ServiceCategory {
  CONSULTATION = 'Consultation',
  LABORATORY = 'Laboratory',
  RADIOLOGY = 'Radiology',
  PROCEDURE = 'Procedure',
  NURSING = 'Nursing Care',
  ADMINISTRATIVE = 'Administrative',
}

@Entity('service_items')
export class ServiceItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string; // e.g. SRV-CONS-01

  @Column()
  name: string; // e.g. General Doctor Consultation Fee

  @Column({
    type: 'varchar',
    default: ServiceCategory.CONSULTATION,
  })
  category: ServiceCategory | string;

  @Column('float', { default: 0.0 })
  price: number;

  @Column('float', { default: 0.0 })
  taxRate: number; // percentage e.g. 5.0

  @Column({ default: true })
  isActive: boolean;

  @VersionColumn()
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
