import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './users/entities/user.entity';
import { Website } from './websites/entities/website.entity';
import { Customer } from './customers/entities/customer.entity';
import { Tag } from './customers/entities/tags.entity';
import { FollowUp } from './customers/entities/follow-up.entity';
import { UsersModule } from './users/users.module';
import { WebsitesModule } from './websites/websites.module';
import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module';
import { ImportModule } from './import/import.module';
import { ColdLeadsModule } from './cold-leads/cold-leads.module';
import { ReportingModule } from './reporting/reporting.module';
import { InteractionsModule } from './interactions/interactions.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { TransactionsModule } from './transactions/transactions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'admin',
      password: 'password',
      database: 'crm_db',
      autoLoadEntities: true,
      synchronize: true, // Only for dev
      logging: true,
      entities: [User, Website, Customer, Tag, FollowUp],
    }),
    TypeOrmModule.forFeature([User, Website, Customer, Tag, FollowUp]),
    UsersModule,
    WebsitesModule,
    AuthModule,
    CustomersModule,
    ImportModule,
    ColdLeadsModule,
    ReportingModule,
    InteractionsModule,
    IntegrationsModule,
    TransactionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
