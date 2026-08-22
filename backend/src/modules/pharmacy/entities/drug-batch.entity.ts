import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Drug } from './drug.entity';

@Entity('drug_batches')
export class DrugBatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  drugId: string;

  @ManyToOne(() => Drug, (drug) => drug.batches, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'drugId' })
  drug: Drug;

  @Column()
  batchNumber: string; // e.g. BATCH-2026-X99

  @Column('int')
  quantity: number;

  @Column()
  expiryDate: string; // YYYY-MM-DD

  @Column({ nullable: true })
  supplier: string;

  @CreateDateColumn()
  createdAt: Date;
}
