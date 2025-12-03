import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../customers/entities/customer.entity';
import {
  ColdLead,
  ColdLeadStatus,
} from '../cold-leads/entities/cold-lead.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ReportingService {
  constructor(
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
    @InjectRepository(ColdLead)
    private coldLeadsRepository: Repository<ColdLead>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async getAgentPerformance(agentId: string, startDate?: Date, endDate?: Date) {
    const whereClause: any = { assignedAgentId: agentId };

    if (startDate && endDate) {
      whereClause.assignedAt = { $gte: startDate, $lte: endDate };
    }

    const customers = await this.customersRepository.find({
      where: whereClause,
    });

    const claimedLeads = await this.coldLeadsRepository.count({
      where: { claimedById: agentId },
    });

    const totalDeposits = customers.reduce(
      (sum, c) => sum + Number(c.totalDeposits),
      0,
    );
    const totalCustomers = customers.length;
    const retainedCustomers = customers.filter(
      (c) => c.status === 'retained',
    ).length;

    return {
      agentId,
      totalCustomers,
      claimedLeads,
      totalDeposits,
      retainedCustomers,
      retentionRate:
        totalCustomers > 0 ? (retainedCustomers / totalCustomers) * 100 : 0,
    };
  }

  async getManagerDashboard(managerId: string) {
    // Get all agents reporting to this manager
    const agents = await this.usersRepository.find({
      where: { managerId },
    });

    const agentIds = agents.map((a) => a.id);

    // Aggregate performance across all agents
    const teamPerformance = await Promise.all(
      agentIds.map((id) => this.getAgentPerformance(id)),
    );

    const totalDeposits = teamPerformance.reduce(
      (sum, p) => sum + p.totalDeposits,
      0,
    );
    const totalCustomers = teamPerformance.reduce(
      (sum, p) => sum + p.totalCustomers,
      0,
    );
    const totalClaimed = teamPerformance.reduce(
      (sum, p) => sum + p.claimedLeads,
      0,
    );
    const totalRetained = teamPerformance.reduce(
      (sum, p) => sum + p.retainedCustomers,
      0,
    );

    return {
      managerId,
      teamSize: agents.length,
      totalDeposits,
      totalCustomers,
      totalClaimed,
      totalRetained,
      averageRetentionRate:
        totalCustomers > 0 ? (totalRetained / totalCustomers) * 100 : 0,
      agents: teamPerformance,
    };
  }

  async getWebsiteStats(websiteId: string) {
    const totalCustomers = await this.customersRepository.count({
      where: { websiteId },
    });

    const availableLeads = await this.coldLeadsRepository.count({
      where: { websiteId, status: ColdLeadStatus.AVAILABLE },
    });

    const claimedLeads = await this.coldLeadsRepository.count({
      where: { websiteId, status: ColdLeadStatus.CLAIMED },
    });

    return {
      websiteId,
      totalCustomers,
      availableLeads,
      claimedLeads,
    };
  }
}
