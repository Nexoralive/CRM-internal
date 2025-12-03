import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './users/entities/user.entity';
import { Website } from './websites/entities/website.entity';
import { Customer, CustomerStatus } from './customers/entities/customer.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Website)
    private websitesRepository: Repository<Website>,
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async seed() {
    // Seed Website
    let website = await this.websitesRepository.findOne({
      where: { name: 'Demo Site' },
    });
    if (!website) {
      website = this.websitesRepository.create({
        name: 'Demo Site',
        url: 'https://demo.crm.com',
      });
      await this.websitesRepository.save(website);
    }

    // Seed Admin
    const email = 'admin@crm.com';
    let admin = await this.usersRepository.findOne({ where: { email } });

    if (!admin) {
      admin = new User();
      admin.email = email;
      admin.passwordHash = await bcrypt.hash('admin123', 10);
      admin.fullName = 'Super Admin';
      admin.role = UserRole.ADMIN;
      admin.websiteId = website.id; // Assign admin to website
      await this.usersRepository.save(admin);
    } else if (!admin.websiteId) {
      // Update existing admin to have websiteId
      admin.websiteId = website.id;
      await this.usersRepository.save(admin);
    }

    // Seed Sample Customers
    const sampleCustomers = [
      {
        externalId: 'CUST001',
        username: 'john_doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        totalDeposits: 1500.0,
        lastDepositDate: new Date('2024-01-15'),
        lastDepositAmount: 500.0,
        status: CustomerStatus.RETAINED,
        category: 'VIP',
      },
      {
        externalId: 'CUST002',
        username: 'jane_smith',
        email: 'jane.smith@example.com',
        phone: '+1234567891',
        totalDeposits: 750.0,
        lastDepositDate: new Date('2024-01-10'),
        lastDepositAmount: 250.0,
        status: CustomerStatus.ONE_TIME_DEPOSIT,
        category: 'Regular',
      },
      {
        externalId: 'CUST003',
        username: 'bob_wilson',
        email: 'bob.wilson@example.com',
        phone: '+1234567892',
        totalDeposits: 2500.0,
        lastDepositDate: new Date('2024-01-20'),
        lastDepositAmount: 1000.0,
        status: CustomerStatus.RETAINED,
        category: 'VIP',
      },
    ];

    for (const customerData of sampleCustomers) {
      const exists = await this.customersRepository.findOne({
        where: { websiteId: website.id, externalId: customerData.externalId },
      });

      if (!exists) {
        const customer = this.customersRepository.create({
          ...customerData,
          websiteId: website.id,
          assignedAgentId: admin.id,
          assignedAt: new Date(),
        });
        await this.customersRepository.save(customer);
      }
    }

    return `Seed completed. Website ID: ${website.id}, Admin ID: ${admin.id}, Sample customers created.`;
  }
}
