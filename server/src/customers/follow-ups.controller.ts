import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Patch,
  Query,
  Get,
} from '@nestjs/common';
import { FollowUpsService } from './follow-ups.service';
import { CreateFollowUpDto } from './dto/create-follow-up.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateFollowUpDto } from './dto/update-follow-up.dto';

@Controller('customers/follow-ups')
@UseGuards(JwtAuthGuard)
export class FollowUpsController {
  constructor(private readonly followUpsService: FollowUpsService) {}

  @Get('todays')
  todaysFollowUpsForAgent(
    @CurrentUser() user: User,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.followUpsService.todaysFollowUpsForAgent(
      user,
      Number(limit),
      Number(page),
    );
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  @Post(':customerId')
  create(
    @Body() createFollowUpDto: CreateFollowUpDto,
    @CurrentUser() user: User,
    @Param('customerId') customerId: string,
  ) {
    return this.followUpsService.create(createFollowUpDto, user, customerId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  @Patch(':id')
  update(
    @Body() updateFollowUpDto: UpdateFollowUpDto,
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.followUpsService.updateFollowUp(id, user, updateFollowUpDto);
  }

  @Get(':customerId')
  findAllByCustomerForAgent(
    @Param('customerId') customerId: string,
    @CurrentUser() user: User,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.followUpsService.findAllByCustomerForAgent(
      customerId,
      user,
      page,
      limit,
    );
  }
}
