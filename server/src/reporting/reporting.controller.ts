import { Controller, Get, Query, Param } from '@nestjs/common';
import { ReportingService } from './reporting.service';

@Controller('reporting')
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('agent/:agentId')
  getAgentPerformance(
    @Param('agentId') agentId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.reportingService.getAgentPerformance(agentId, start, end);
  }

  @Get('manager/:managerId')
  getManagerDashboard(@Param('managerId') managerId: string) {
    return this.reportingService.getManagerDashboard(managerId);
  }

  @Get('website/:websiteId')
  getWebsiteStats(@Param('websiteId') websiteId: string) {
    return this.reportingService.getWebsiteStats(websiteId);
  }
}
