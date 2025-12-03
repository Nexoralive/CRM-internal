import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { Customer } from './entities/customer.entity';
import { Tag } from './entities/tags.entity';
import { FollowUpsController } from './follow-ups.controller';
import { FollowUpsService } from './follow-ups.service';
import { FollowUp } from './entities/follow-up.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Customer, Tag, FollowUp])],
  controllers: [CustomersController, FollowUpsController],
  providers: [CustomersService, FollowUpsService],
  exports: [CustomersService],
})
export class CustomersModule {}
