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
  MAINTENANCE = 'MAINTENANCE',
}

@Entity('beds')
export class Bed {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  tenantId: string;

  @Column({ unique: true })
  bedNumber: string;

  @Column()
  wardName: string;

  @Column({ default: 'GENERAL' })
  bedClass: string;

  @Column('float')
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
