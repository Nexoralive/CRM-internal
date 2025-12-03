import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { password, ...rest } = createUserDto;
    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({
      ...rest,
      passwordHash,
    });
    return this.usersRepository.save(user);
  }

  async findAll() {
    return this.usersRepository.find({ relations: ['manager', 'website'] });
  }

  async findOne(id: string) {
    return this.usersRepository.findOne({
      where: { id },
      relations: ['website'],
    });
  }

  async findOneByEmail(email: string) {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['website'],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const { password, ...rest } = updateUserDto;
    const updateData: any = { ...rest };

    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    await this.usersRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.usersRepository.delete(id);
    return { deleted: true };
  }
}
