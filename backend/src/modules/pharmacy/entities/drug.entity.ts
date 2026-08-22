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

  @Column({ nullable: true })
  tenantId: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column()
  category: string;

  @Column('float')
  unitPrice: number;

  @Column('int')
  quantityInStock: number;

  @Column('int', { default: 20 })
  reorderLevel: number;

  @Column({ default: 'Tablets' })
  unit: string;

  @OneToMany(() => DrugBatch, (batch) => batch.drug, { cascade: true })
  batches: DrugBatch[];

  @VersionColumn()
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
