import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FollowUp } from './entities/follow-up.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { CreateFollowUpDto } from './dto/create-follow-up.dto';
import { UpdateFollowUpDto } from './dto/update-follow-up.dto';

@Injectable()
export class FollowUpsService {
  constructor(
    @InjectRepository(FollowUp)
    private followUpsRepository: Repository<FollowUp>,
  ) {}

  create(dto: CreateFollowUpDto, agent: User, customerId: string) {
    const followUp = this.followUpsRepository.create({
      content: dto.content,
      date: dto.date,
      customerId,
      agentId: agent.id,
      status: 'pending',
    });

    return this.followUpsRepository.save(followUp);
  }

  async updateFollowUp(id: string, agent: User, dto: UpdateFollowUpDto) {
    const followUp = await this.followUpsRepository.findOne({
      where: {
        id,
        agentId: agent.id,
      },
    });

    if (!followUp) {
      throw new NotFoundException('Follow up not found');
    }

    followUp.status = dto.status;

    return this.followUpsRepository.save(followUp);
  }

  async findAllByCustomerForAgent(
    customerId: string,
    agent: User,
    page = 1,
    limit = 10,
    forNotifications = false,
  ) {
    const query = this.followUpsRepository.createQueryBuilder('followUp');

    query.where('followUp.customerId = :customerId', { customerId });
    query.andWhere('followUp.agentId = :agentId', { agentId: agent.id });

    if (!forNotifications) {
      query.andWhere(`followUp.status != :status`, { status: 'cancelled' });
    } else {
      query.andWhere(
        `(followUp.status = :status AND followUp.date = CURRENT_DATE)`,
        { status: 'pending' },
      );
    }

    query.orderBy(
      `
      CASE
        WHEN "followUp"."status" = 'pending' AND "followUp"."date"::date = CURRENT_DATE THEN 0
        WHEN "followUp"."status" = 'pending' THEN 1
        WHEN "followUp"."status" = 'completed' THEN 2
        ELSE 3
      END
      `,
    );
    query.addOrderBy('followUp.date', 'ASC');
    query.addOrderBy('followUp.id', 'ASC');
    query.skip((page - 1) * limit);
    query.take(limit);

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
