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

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  RETENTION_MANAGER = 'retention_manager',
  AGENT = 'agent',
  SERVICE = 'service',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role: UserRole;

  @ManyToOne(() => Website, { nullable: true })
  @JoinColumn({ name: 'website_id' })
  website: Website;

  @Column({ name: 'website_id', nullable: true })
  websiteId: string;

  @Column({ type: 'simple-array', nullable: true })
  panels: string[]; // Array of panel names the user has access to

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'manager_id' })
  manager: User;

  @Column({ name: 'manager_id', nullable: true })
  managerId: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'token_version', default: 1 })
  tokenVersion: number;

  @Column({ name: 'last_login_at', nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
