import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ColdLeadsService } from './cold-leads.service';
import { ColdLeadsController } from './cold-leads.controller';
import { ColdLead } from './entities/cold-lead.entity';

import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [TypeOrmModule.forFeature([ColdLead]), CustomersModule],
  controllers: [ColdLeadsController],
  providers: [ColdLeadsService],
  exports: [ColdLeadsService],
})
export class ColdLeadsModule {}
