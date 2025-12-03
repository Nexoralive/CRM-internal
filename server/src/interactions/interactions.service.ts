import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateInteractionDto } from './dto/create-interaction.dto';
import { UpdateInteractionDto } from './dto/update-interaction.dto';
import { Interaction } from './entities/interaction.entity';

@Injectable()
export class InteractionsService {
  constructor(
    @InjectRepository(Interaction)
    private interactionsRepository: Repository<Interaction>,
  ) {}

  create(createInteractionDto: CreateInteractionDto) {
    const interaction =
      this.interactionsRepository.create(createInteractionDto);
    return this.interactionsRepository.save(interaction);
  }

  findAllByCustomer(customerId: string) {
    return this.interactionsRepository.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
      relations: ['agent'],
    });
  }

  findAll() {
    return `This action returns all interactions`;
  }

  findOne(id: string) {
    return `This action returns a #${id} interaction`;
  }

  update(id: string, updateInteractionDto: UpdateInteractionDto) {
    return `This action updates a #${id} interaction`;
  }

  remove(id: string) {
    return `This action removes a #${id} interaction`;
  }
}
