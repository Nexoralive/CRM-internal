// src/data-source.ts
import { DataSource } from 'typeorm';
import { Customer } from './customers/entities/customer.entity';
import { Interaction } from './interactions/entities/interaction.entity';
import { User } from './users/entities/user.entity';
import { Website } from './websites/entities/website.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: '127.0.0.1',
  port: 5433, // <-- matches docker‑compose.yml mapping
  username: 'admin',
  password: 'password',
  database: 'crm_db',
  synchronize: false,
  logging: false,
  entities: [Customer, Interaction, User, Website],
  // 👇 tell TypeORM where the compiled migration files are
  migrations: [__dirname + '/migrations/*.ts'],
});
