import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Customer } from './customer.entity';

@Entity('follow_ups')
export class FollowUp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamptz' })
  date: Date;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'uuid' })
  customerId: string;

  @Column({ type: 'text' })
  agentId: string;

  @Column({ type: 'text', default: 'pending' })
  status: 'pending' | 'completed' | 'cancelled';

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;
}
