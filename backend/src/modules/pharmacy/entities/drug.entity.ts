import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
  OneToMany,
} from 'typeorm';
import { DrugBatch } from './drug-batch.entity';

@Entity('drugs')
export class Drug {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string; // SKU code, e.g. DRUG-AMOX-500

  @Column()
  name: string;

  @Column()
  category: string; // 'Antibiotics' | 'Analgesics' | 'Cardiovascular' | etc.

  @Column('float')
  unitPrice: number;

  @Column('int')
  quantityInStock: number;

  @Column('int', { default: 20 })
  reorderLevel: number;

  @Column({ default: 'Tablets' })
  unit: string; // 'Tablets' | 'Capsules' | 'Syrup (ml)' | 'Vial' | 'Injection'

  @OneToMany(() => DrugBatch, (batch) => batch.drug, { cascade: true })
  batches: DrugBatch[];

  @VersionColumn()
  version: number; // Concurrency Protection (Optimistic Lock)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
