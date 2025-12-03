import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Website } from '../../websites/entities/website.entity';
import { User } from '../../users/entities/user.entity';

export enum ColdLeadStatus {
  AVAILABLE = 'available',
  CLAIMED = 'claimed',
  CONVERTED = 'converted',
}

@Entity('cold_leads')
export class ColdLead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Website)
  @JoinColumn({ name: 'website_id' })
  website: Website;

  @Column({ name: 'website_id' })
  websiteId: string;

  @Column({ name: 'external_id' })
  externalId: string;

  @Column({ nullable: true })
  username: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({
    type: 'enum',
    enum: ColdLeadStatus,
    default: ColdLeadStatus.AVAILABLE,
  })
  status: ColdLeadStatus;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'claimed_by_id' })
  claimedBy: User;

  @Column({ name: 'claimed_by_id', nullable: true })
  claimedById: string;

  @Column({ name: 'claimed_at', nullable: true })
  claimedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
