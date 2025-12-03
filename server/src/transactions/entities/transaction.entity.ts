import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string; // BigInt is returned as string in JS/TS usually to avoid precision loss

  @Column({ type: 'timestamptz' })
  date: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ length: 255 })
  type: string;

  @Column({ type: 'text' })
  remark: string;

  @Column({ length: 255 })
  panel: string;

  @Column({ length: 255 })
  client: string;

  @Column({ length: 255 })
  branch: string;

  @Column({ name: 'source_file', length: 255 })
  sourceFile: string;

  @Column({ length: 255 })
  website: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'website_hash', type: 'bigint', nullable: true })
  websiteHash: string;
}
