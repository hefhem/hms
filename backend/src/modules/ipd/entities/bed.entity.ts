import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

export enum BedStatus {
  VACANT = 'VACANT',
  OCCUPIED = 'OCCUPIED',
  CLEANING = 'CLEANING',
  RESERVED = 'RESERVED',
}

@Entity('beds')
export class Bed {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  bedNumber: string; // e.g. BED-101

  @Column()
  wardName: string; // e.g. 'General Male Ward', 'ICU', 'VIP Suite'

  @Column({ default: 'GENERAL' })
  bedClass: string; // 'GENERAL' | 'PRIVATE' | 'ICU' | 'ISOLATION'

  @Column('float', { default: 120.0 })
  pricePerNight: number;

  @Column({
    type: 'varchar',
    default: BedStatus.VACANT,
  })
  status: BedStatus;

  @Column({ nullable: true })
  currentPatientId: string;

  @Column({ nullable: true })
  currentPatientName: string;

  @VersionColumn()
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
