import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('website') website?: string,
    @Query('panel') panel?: string,
    @Query('type') type?: string,
  ) {
    return this.transactionsService.findAll(
      Number(page),
      Number(limit),
      startDate,
      endDate,
      website,
      panel,
      type,
    );
  }

  @Get('options')
  getOptions(@Query('website') website?: string) {
    return this.transactionsService.getOptions(website);
  }

  @Get('clients')
  async getUniqueClients(
    @CurrentUser() user: User,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('website') website?: string,
    @Query('panel') panel?: string,
    @Query('status') status?: string,
    @Query('lastDepositDate') lastDepositDate?: string,
  ) {
    // Get user with website relation to get website name
    const userWithWebsite =
      user.websiteId && !user.website
        ? await this.usersService.findOne(user.id)
        : user;

    // Get user's website name and panels
    const userWebsite = userWithWebsite?.website?.name || undefined;
    const userPanels = userWithWebsite?.panels || [];

    // Admin users can see all data, others are restricted to their website/panels
    const isAdmin = user.role === UserRole.ADMIN;

    return this.transactionsService.getUniqueClients(
      Number(page),
      Number(limit),
      search,
      website, // Allow explicit filter
      panel, // Allow explicit filter
      status,
      lastDepositDate,
      isAdmin ? undefined : userWebsite, // Apply restriction only for non-admin
      isAdmin ? undefined : userPanels, // Apply restriction only for non-admin
    );
  }

  @Get('clients/:client')
  getClientTransactions(@Query('client') client: string) {
    return this.transactionsService.getClientTransactions(client);
  }
}
