import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  OneToMany,
  Index,
} from 'typeorm';
import { Interaction } from '../../interactions/entities/interaction.entity';
import { Website } from '../../websites/entities/website.entity';
import { User } from '../../users/entities/user.entity';
import { Tag } from './tags.entity';

export enum CustomerStatus {
  NEW = 'new',
  ONE_TIME_DEPOSIT = 'one_time_deposit',
  CLAIMED = 'claimed',
  CONTACTED = 'contacted',
  RETAINED = 'retained',
  CHURNED = 'churned',
}

@Entity('customers')
@Unique(['websiteId', 'externalId'])
export class Customer {
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

  @Column({ nullable: true, name: 'tag_id' })
  tagId: string | null;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Index()
  @Column({
    name: 'total_deposits',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  totalDeposits: number;

  @Index()
  @Column({ name: 'last_deposit_date', nullable: true })
  lastDepositDate: Date;

  @Index()
  @Column({ name: 'first_deposit_date', nullable: true })
  firstDepositDate: Date;

  @Index()
  @Column({
    name: 'last_deposit_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  lastDepositAmount: number;

  @Index()
  @Column({
    name: 'total_deposit_amount',
    nullable: true,
    type: 'decimal',
    precision: 15,
    scale: 2,
  })
  totalDepositAmount: number;

  @Index()
  @Column({
    name: 'total_withdrawals',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  totalWithdrawals: number;

  @Index()
  @Column({ name: 'last_withdrawal_date', nullable: true })
  lastWithdrawalDate: Date;

  @Index()
  @Column({ name: 'first_withdrawal_date', nullable: true })
  firstWithdrawalDate: Date;

  @Index()
  @Column({
    name: 'last_withdrawal_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  lastWithdrawalAmount: number;

  @Index()
  @Column({
    name: 'total_withdrawal_amount',
    nullable: true,
    type: 'decimal',
    precision: 15,
    scale: 2,
  })
  totalWithdrawalAmount: number;

  // New fields for extended customer details
  @Column({ nullable: true })
  websiteName: string; // Name or URL of the website/tenant

  @Column({ name: 'panel_name', nullable: true })
  panelName: string;

  @Column({
    name: 'created_date',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdDate: Date;

  @Column({ nullable: true })
  language: string;

  @Column({ name: 'retention_rm', nullable: true })
  retentionRM: string;

  @Column({ name: 'pullback_rm', nullable: true })
  pullbackRM: string;

  @Column({ name: 'client_name', nullable: true })
  clientName: string;

  @Column({ nullable: true })
  branch: string;

  @Column({ name: 'id_status', nullable: true })
  idStatus: string;

  @Column({ name: 'game_interest', nullable: true })
  gameInterest: string;

  @Column({
    type: 'enum',
    enum: CustomerStatus,
    default: CustomerStatus.NEW,
  })
  status: CustomerStatus;

  @Column({ nullable: true })
  category: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_agent_id' })
  assignedAgent: User;

  @Column({ name: 'assigned_agent_id', nullable: true })
  assignedAgentId: string;

  @Column({ name: 'assigned_at', nullable: true })
  assignedAt: Date;

  @OneToMany(() => Interaction, (interaction) => interaction.customer)
  interactions: Interaction[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Tag, { nullable: true })
  @JoinColumn({ name: 'tag_id' })
  tag: Tag;
}
