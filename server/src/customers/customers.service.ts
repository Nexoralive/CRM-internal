import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer, CustomerStatus } from './entities/customer.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
  ) {}

  create(createCustomerDto: CreateCustomerDto) {
    const customer = this.customersRepository.create(createCustomerDto);
    return this.customersRepository.save(customer);
  }

  async getOptions(website?: string) {
    // Fetch distinct website names from the related Website entity
    const websiteRows = await this.customersRepository
      .createQueryBuilder('customer')
      .leftJoin('customer.website', 'website')
      .select('DISTINCT website.name', 'website')
      .where('website.name IS NOT NULL')
      .orderBy('website.name', 'ASC')
      .getRawMany();

    // Fetch distinct branches from Customer (optionally filtered by website name)
    let branchQuery = this.customersRepository
      .createQueryBuilder('customer')
      .select('DISTINCT customer.branch', 'branch')
      .where('customer.branch IS NOT NULL');

    if (website) {
      branchQuery = branchQuery.andWhere('customer.websiteName = :website', {
        website,
      });
    }

    const branchRows = await branchQuery
      .orderBy('customer.branch', 'ASC')
      .getRawMany();

    return {
      websites: websiteRows.map((w) => w.website),
      branches: branchRows.map((b) => b.branch),
    };
  }

  async findAll(
    websiteId?: string,
    search?: string,
    status?: string,
    lastDepositDate?: string,
    website?: string,
    branch?: string,
  ) {
    const where: any = {};

    if (websiteId) {
      where.websiteId = websiteId;
    }

    if (search) {
      // Simple case-insensitive contains search on username, email, phone
      where.$or = [
        { username: ILike(`%${search}%`) },
        { email: ILike(`%${search}%`) },
        { phone: ILike(`%${search}%`) },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (lastDepositDate) {
      // Assuming exact date match on the date part, ignoring time
      // Or if lastDepositDate is just a date string 'YYYY-MM-DD'
      // We might need to use raw query or Between for full day range
      // For simplicity, let's try exact match if it's a date column, but usually it's timestamp
      // Let's use TypeORM's Raw for date comparison
      // where.lastDepositDate = Raw((alias) => `DATE(${alias}) = :date`, { date: lastDepositDate });
      // But let's stick to simple find options if possible. If it's a Date object, exact match might fail due to time.
      // Let's use a query builder approach or simple string match if stored as string.
      // The entity says lastDepositDate: Date.
      // Let's use a raw query for date part.
      // Actually, let's switch to QueryBuilder for findAll to handle this cleanly.
    }

    if (website) {
      where.websiteName = website;
    }

    if (branch) {
      where.branch = branch;
    }

    // If we need complex date filtering, we should use QueryBuilder.
    // Let's rewrite findAll with QueryBuilder to be safe.
    const qb = this.customersRepository.createQueryBuilder('customer');

    if (websiteId) {
      qb.andWhere('customer.websiteId = :websiteId', { websiteId });
    }

    if (search) {
      qb.andWhere(
        '(customer.username ILIKE :search OR customer.email ILIKE :search OR customer.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status) {
      qb.andWhere('customer.status = :status', { status });
    }

    if (lastDepositDate) {
      // Cast to date to ignore time
      qb.andWhere('DATE(customer.lastDepositDate) = :lastDepositDate', {
        lastDepositDate,
      });
    }

    if (website) {
      qb.andWhere('customer.websiteName = :website', { website });
    }

    if (branch) {
      qb.andWhere('customer.branch = :branch', { branch });
    }

    return qb.orderBy('customer.createdDate', 'DESC').getMany();
  }

  async upsert(customerData: Partial<Customer>) {
    const { websiteId, externalId } = customerData;
    let customer = await this.customersRepository.findOne({
      where: { websiteId, externalId },
    });

    if (customer) {
      // Update existing
      customer.totalDeposits =
        Number(customer.totalDeposits) +
        Number(customerData.lastDepositAmount || 0);
      if (customerData.lastDepositDate) {
        customer.lastDepositDate = customerData.lastDepositDate;
      }
      if (customerData.lastDepositAmount !== undefined) {
        customer.lastDepositAmount = customerData.lastDepositAmount;
      }

      // Logic: Redeposit check
      if (
        customer.status === 'contacted' &&
        (customerData.lastDepositAmount || 0) > 0
      ) {
        customer.status = CustomerStatus.RETAINED;
      }
    } else {
      // Create new
      customer = this.customersRepository.create({
        ...customerData,
        totalDeposits: customerData.lastDepositAmount || 0,
        status: CustomerStatus.NEW,
      });
    }

    // Categorization Logic
    // Note: This is simplified. In production, you'd track deposit count separately
    // For now, we use totalDeposits as a proxy (assuming each deposit is significant)
    if (Number(customer.totalDeposits) < 100) {
      customer.category = 'One Time Deposit User';
    } else {
      customer.category = 'Potential';
    }

    return this.customersRepository.save(customer);
  }

  findOne(id: string) {
    return this.customersRepository.findOne({ where: { id } });
  }

  update(id: string, updateCustomerDto: UpdateCustomerDto) {
    return `This action updates a #${id} customer`;
  }

  remove(id: string) {
    return `This action removes a #${id} customer`;
  }
}
