import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('follow_ups')
export class FollowUp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamptz' })
  date: Date;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text' })
  customerId: string;

  @Column({ type: 'text' })
  agentId: string;

  @Column({ type: 'text', default: 'pending' })
  status: 'pending' | 'completed' | 'cancelled';
}
