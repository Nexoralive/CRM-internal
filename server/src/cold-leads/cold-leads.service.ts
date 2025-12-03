import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { CreateColdLeadDto } from './dto/create-cold-lead.dto';
import { UpdateColdLeadDto } from './dto/update-cold-lead.dto';
import { ColdLead, ColdLeadStatus } from './entities/cold-lead.entity';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class ColdLeadsService {
  constructor(
    @InjectRepository(ColdLead)
    private coldLeadsRepository: Repository<ColdLead>,
    private customersService: CustomersService,
  ) {}

  async promoteToCustomer(leadId: string, agentId: string) {
    const lead = await this.coldLeadsRepository.findOne({
      where: { id: leadId },
    });
    if (!lead) {
      throw new NotFoundException('Lead not found');
    }
    if (lead.claimedById !== agentId) {
      throw new ForbiddenException('You can only promote leads you claimed');
    }
    if (lead.status === ColdLeadStatus.CONVERTED) {
      throw new BadRequestException('Lead already converted');
    }

    const customer = await this.customersService.create({
      websiteId: lead.websiteId,
      externalId: lead.externalId,
      username: lead.username,
      email: lead.email,
      phone: lead.phone,
      assignedAgentId: agentId,
    });

    lead.status = ColdLeadStatus.CONVERTED;
    await this.coldLeadsRepository.save(lead);

    return customer;
  }

  create(createColdLeadDto: CreateColdLeadDto) {
    return 'This action adds a new coldLead';
  }

  async findAvailable(websiteId: string, limit: number = 50) {
    return this.coldLeadsRepository.find({
      where: {
        websiteId,
        status: ColdLeadStatus.AVAILABLE,
      },
      take: limit,
      order: { createdAt: 'DESC' },
    });
  }

  async findMyLeads(agentId: string) {
    return this.coldLeadsRepository.find({
      where: {
        claimedById: agentId,
      },
      order: { claimedAt: 'DESC' },
    });
  }

  async claim(leadId: string, agentId: string) {
    // Check daily claim limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const claimedToday = await this.coldLeadsRepository.count({
      where: {
        claimedById: agentId,
        claimedAt: MoreThanOrEqual(today),
      },
    });

    if (claimedToday >= 10) {
      throw new BadRequestException('Daily claim limit reached (max 10)');
    }

    // Claim the lead
    const lead = await this.coldLeadsRepository.findOne({
      where: { id: leadId },
    });
    if (!lead) {
      throw new BadRequestException('Lead not found');
    }

    if (lead.status !== ColdLeadStatus.AVAILABLE) {
      throw new BadRequestException('Lead already claimed');
    }

    lead.status = ColdLeadStatus.CLAIMED;
    lead.claimedById = agentId;
    lead.claimedAt = new Date();

    return this.coldLeadsRepository.save(lead);
  }

  findAll() {
    return `This action returns all coldLeads`;
  }

  findOne(id: string) {
    return `This action returns a #${id} coldLead`;
  }

  update(id: string, updateColdLeadDto: UpdateColdLeadDto) {
    return `This action updates a #${id} coldLead`;
  }

  remove(id: string) {
    return `This action removes a #${id} coldLead`;
  }
}
