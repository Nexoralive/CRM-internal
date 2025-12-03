import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportingService } from './reporting.service';
import { ReportingController } from './reporting.controller';
import { Customer } from '../customers/entities/customer.entity';
import { ColdLead } from '../cold-leads/entities/cold-lead.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Customer, ColdLead, User])],
  controllers: [ReportingController],
  providers: [ReportingService],
})
export class ReportingModule {}
