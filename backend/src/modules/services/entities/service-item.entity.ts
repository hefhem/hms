import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

export enum ServiceCategory {
  CONSULTATION = 'CONSULTATION',
  LABORATORY = 'LABORATORY',
  RADIOLOGY = 'RADIOLOGY',
  SURGERY = 'SURGERY',
  NURSING = 'NURSING',
  OTHER = 'OTHER',
}

@Entity('service_items')
export class ServiceItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  tenantId: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({
    type: 'varchar',
    default: ServiceCategory.CONSULTATION,
  })
  category: ServiceCategory;

  @Column('float')
  price: number;

  @Column('float', { default: 0 })
  taxRate: number;

  @VersionColumn()
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
