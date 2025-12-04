import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { Website } from '../websites/entities/website.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Tag } from '../customers/entities/tags.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 10,
    startDate?: string,
    endDate?: string,
    website?: string,
    panel?: string,
    type?: string,
  ) {
    const query = this.transactionsRepository.createQueryBuilder('transaction');

    if (startDate) {
      query.andWhere('transaction.date >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('transaction.date <= :endDate', { endDate });
    }
    if (website) {
      query.andWhere('transaction.website ILIKE :website', {
        website: `%${website}%`,
      });
    }
    if (panel) {
      query.andWhere('transaction.panel ILIKE :panel', { panel: `%${panel}%` });
    }
    if (type) {
      query.andWhere('transaction.type ILIKE :type', { type });
    }

    query.orderBy('transaction.date', 'DESC');
    query.skip((page - 1) * limit);
    query.take(limit);

    const [items, total] = await query.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
  async getOptions(website?: string, branch?: string) {
    const panelsQuery = this.transactionsRepository
      .createQueryBuilder('transaction')
      .select('DISTINCT transaction.panel', 'panel')
      .orderBy('transaction.panel', 'ASC');

    if (website) {
      panelsQuery.where('transaction.website = :website', { website });
    }
    if (branch) {
      panelsQuery.andWhere('transaction.branch = :branch', { branch });
    }

    const panels = await panelsQuery.getRawMany();

    const websites = await this.transactionsRepository
      .createQueryBuilder('transaction')
      .select('DISTINCT transaction.website', 'website')
      .orderBy('transaction.website', 'ASC')
      .getRawMany();

    const branchesQuery = this.transactionsRepository
      .createQueryBuilder('transaction')
      .select('DISTINCT transaction.branch', 'branch')
      .orderBy('transaction.branch', 'ASC');

    if (website) {
      branchesQuery.where('transaction.website = :website', { website });
    }

    const branches = await branchesQuery.getRawMany();

    return {
      panels: panels.map((p) => p.panel).filter(Boolean),
      websites: websites.map((w) => w.website).filter(Boolean),
      branches: branches.map((b) => b.branch).filter(Boolean),
    };
  }

  async getUniqueClients(
    page: number = 1,
    limit: number = 10,
    search?: string,
    website?: string,
    panel?: string, // panel parameter filters by transaction.panel column
    branch?: string,
    status?: string,
    gameInterest?: string,
    lastDepositDate?: string,
    firstDepositDate?: string,
    minTotalDepositAmount?: string,
    maxTotalDepositAmount?: string,
    firstWithdrawalDate?: string,
    lastWithdrawalDate?: string,
    minTotalWithdrawalAmount?: string,
    maxTotalWithdrawalAmount?: string,
    firstTransactionDate?: string,
    lastTransactionDate?: string,
    lastCallDate?: string,
    lastCallOutcome?: string,
    userWebsite?: string, // User's assigned website (for restriction)
    userPanels?: string[], // User's assigned panels (for restriction)
  ) {
    // Base query builder function to ensure consistency between count and data queries
    const createBaseQuery = () => {
      const qb = this.transactionsRepository.createQueryBuilder('transaction');

      // Join websites by matching on URL or name (transactions store the website as a string)
      qb.leftJoin(
        Website,
        'website_entity',
        'LOWER(website_entity.url) = LOWER(transaction.website) OR LOWER(website_entity.name) = LOWER(transaction.website)',
      );

      // Join customers by matching externalId and websiteId
      qb.leftJoin(
        Customer,
        'customer',
        'customer.externalId = transaction.client AND customer.websiteId = website_entity.id',
      );

      if (search) {
        qb.andWhere(
          '(transaction.client ILIKE :search OR transaction.branch ILIKE :search OR transaction.website ILIKE :search OR transaction.panel ILIKE :search)',
          { search: `%${search}%` },
        );
      }

      // Apply user's website restriction if provided
      const effectiveWebsite = website || userWebsite;
      if (effectiveWebsite) {
        qb.andWhere('LOWER(transaction.website) = LOWER(:website)', {
          website: effectiveWebsite.trim(),
        });
      }

      // Apply user's panel restrictions if provided
      if (userPanels && userPanels.length > 0) {
        // If user has panel restrictions, filter by those panels
        // If a specific panel filter is provided, it must be in user's panels
        if (panel) {
          if (userPanels.some((p) => p.toLowerCase() === panel.toLowerCase())) {
            qb.andWhere('LOWER(transaction.panel) = LOWER(:panel)', {
              panel: panel.trim(),
            });
          } else {
            // User doesn't have access to this panel, return empty result
            qb.andWhere('1 = 0'); // Always false condition
          }
        } else {
          // Filter by user's allowed panels
          qb.andWhere('LOWER(transaction.panel) IN (:...panels)', {
            panels: userPanels.map((p) => p.toLowerCase()),
          });
        }
      } else if (panel) {
        // No user panel restrictions, apply panel filter normally
        qb.andWhere('LOWER(transaction.panel) = LOWER(:panel)', {
          panel: panel.trim(),
        });
      }

      if (branch) {
        qb.andWhere('LOWER(transaction.branch) = LOWER(:branch)', {
          branch: branch.trim(),
        });
      }

      if (gameInterest) {
        qb.andWhere('customer.gameInterest = :gameInterest', { gameInterest });
      }

      if (lastDepositDate) {
        qb.andWhere('DATE(customer.lastDepositDate) = :lastDepositDate', {
          lastDepositDate,
        });
      }

      if (firstDepositDate) {
        qb.andWhere('DATE(customer.firstDepositDate) = :firstDepositDate', {
          firstDepositDate,
        });
      }

      if (firstWithdrawalDate) {
        qb.andWhere(
          'DATE(customer.firstWithdrawalDate) = :firstWithdrawalDate',
          {
            firstWithdrawalDate,
          },
        );
      }

      if (lastWithdrawalDate) {
        qb.andWhere('DATE(customer.lastWithdrawalDate) = :lastWithdrawalDate', {
          lastWithdrawalDate,
        });
      }

      if (minTotalDepositAmount) {
        qb.andWhere('customer.totalDeposits >= :minTotalDepositAmount', {
          minTotalDepositAmount,
        });
      }

      if (maxTotalDepositAmount) {
        qb.andWhere('customer.totalDeposits <= :maxTotalDepositAmount', {
          maxTotalDepositAmount,
        });
      }

      if (minTotalWithdrawalAmount) {
        qb.andWhere('customer.totalWithdrawals >= :minTotalWithdrawalAmount', {
          minTotalWithdrawalAmount,
        });
      }

      if (maxTotalWithdrawalAmount) {
        qb.andWhere('customer.totalWithdrawals <= :maxTotalWithdrawalAmount', {
          maxTotalWithdrawalAmount,
        });
      }

      if (firstTransactionDate) {
        qb.andWhere(
          'LEAST(customer.firstWithdrawalDate, customer.firstDepositDate) = :firstTransactionDate',
          { firstTransactionDate },
        );
      }

      if (lastTransactionDate) {
        qb.andWhere(
          'GREATEST(customer.lastWithdrawalDate, customer.lastDepositDate) = :lastTransactionDate',
          { lastTransactionDate },
        );
      }

      if (lastCallDate || lastCallOutcome) {
        const subqueryConditions: string[] = [
          "i.type = 'call'",
          `i.created_at = (
            SELECT MAX(i2.created_at)
            FROM interactions i2
            WHERE i2.customer_id = i.customer_id
              AND i2.type = 'call'
          )`,
        ];
        const subqueryParams: Record<string, unknown> = {};
        if (lastCallDate) {
          subqueryConditions.push('DATE(i.created_at) = :lastCallDate');
          subqueryParams.lastCallDate = lastCallDate;
        }
        if (lastCallOutcome) {
          subqueryConditions.push('i.content ILIKE :lastCallOutcome');
          subqueryParams.lastCallOutcome = `%${lastCallOutcome}%`;
        }
        // If userWebsite and userPanels are given, narrow customers by branch/panel in subquery
        if (userWebsite && userPanels && userPanels.length > 0) {
          if (branch) {
            subqueryConditions.push('LOWER(c.branch) = LOWER(:subBranch)');
            subqueryParams.subBranch = branch.trim();
          }
          subqueryConditions.push('LOWER(c.panel_name) IN (:...subPanels)');
          subqueryParams.subPanels = userPanels.map((p) => p.toLowerCase());
        }
        const subquery = `
          SELECT i.customer_id
          FROM interactions i
          JOIN customers c ON c.id = i.customer_id
          WHERE ${subqueryConditions.join('\n            AND ')}
        `;
        qb.andWhere(`customer.id IN (${subquery})`, subqueryParams);
      }

      if (status) {
        const statusCase = `
          CASE
            WHEN GREATEST(
                   COALESCE(customer.lastDepositDate, 'epoch'::timestamp),
                   COALESCE(customer.lastWithdrawalDate, 'epoch'::timestamp)
                 ) >= (NOW() - INTERVAL '3 days') THEN 'active'
            WHEN GREATEST(
                   COALESCE(customer.lastDepositDate, 'epoch'::timestamp),
                   COALESCE(customer.lastWithdrawalDate, 'epoch'::timestamp)
                 ) > (NOW() - INTERVAL '30 days') THEN 'inactive'
            ELSE 'sleeping'
          END
        `;

        qb.andWhere(`${statusCase} = :status`, { status });
      }

      return qb;
    };

    // Get total count of unique clients
    const countQuery = createBaseQuery().select(
      'COUNT(DISTINCT transaction.client)',
      'count',
    );

    const countResult = await countQuery.getRawOne();

    const total = parseInt(countResult?.count || '0', 10);

    // Get paginated results
    const query = createBaseQuery()
      .select('transaction.client', 'client')
      .addSelect('customer.id', 'customerId')
      .addSelect('MIN(transaction.branch)', 'branch')
      .addSelect('MIN(transaction.panel)', 'panel')
      .addSelect('MIN(transaction.website)', 'website')
      .addSelect('COUNT(*)', 'transactionCount')
      .addSelect(
        "SUM(CASE WHEN transaction.type = 'DEPOSIT' THEN transaction.amount ELSE 0 END)",
        'totalDeposits',
      )
      .addSelect(
        "SUM(CASE WHEN transaction.type = 'WITHDRAW' THEN transaction.amount ELSE 0 END)",
        'totalWithdrawals',
      )
      .addSelect(
        "MAX(CASE WHEN transaction.type = 'DEPOSIT' THEN transaction.date END)::timestamp",
        'lastDepositDate',
      )
      .groupBy('transaction.client')
      .addGroupBy('customer.id');

    query
      .orderBy('transaction.client', 'ASC')
      .offset((page - 1) * limit)
      .limit(limit);

    const results = await query.getRawMany();

    const items = results.map((r) => ({
      client: r.client,
      customerId: r.customerId,
      branch: r.branch || 'N/A',
      panel: r.panel || 'N/A',
      website: r.website || 'N/A',
      status: 'Active', // Default status
      transactionCount: parseInt(r.transactionCount || r.transactioncount),
      totalDeposits: parseFloat(r.totalDeposits || r.totaldeposits) || 0,
      totalWithdrawals:
        parseFloat(r.totalWithdrawals || r.totalwithdrawals) || 0,
      lastDepositDate:
        r.lastDepositDate || r.lastdepositdate || r.last_deposit_date || null,
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getClientTransactions(client: string) {
    // Resolve customerId by joining Website and Customer on existing transactions
    const customerRow = await this.transactionsRepository
      .createQueryBuilder('transaction')
      .leftJoin(
        Website,
        'website_entity',
        'LOWER(website_entity.url) = LOWER(transaction.website) OR LOWER(website_entity.name) = LOWER(transaction.website)',
      )
      .leftJoin(
        Customer,
        'customer',
        'customer.externalId = transaction.client AND customer.websiteId = website_entity.id',
      )
      .leftJoin(Tag, 'tag', 'customer.tagId = tag.id')
      .where('transaction.client = :client', { client })
      .select('customer.id', 'customerId')
      .addSelect('tag.name', 'tagName')
      .addSelect('tag.color', 'tagColor')
      .limit(1)
      .getRawOne<{
        customerId?: string;
        tagName?: string;
        tagColor?: string;
      }>();

    const deposits = await this.transactionsRepository.find({
      where: {
        client,
        type: 'DEPOSIT',
      },
      order: {
        date: 'DESC',
      },
    });

    const withdrawals = await this.transactionsRepository.find({
      where: {
        client,
        type: 'WITHDRAW',
      },
      order: {
        date: 'DESC',
      },
    });

    // Get branch and website from the most recent transaction
    const lastTransaction = deposits[0] || withdrawals[0];
    const branch = lastTransaction ? lastTransaction.branch : 'N/A';
    const website = lastTransaction ? lastTransaction.website : 'N/A';

    return {
      client,
      customerId: customerRow?.customerId || null,
      tag:
        customerRow?.tagName && customerRow?.tagColor
          ? { name: customerRow.tagName, color: customerRow.tagColor }
          : null,
      branch,
      website,
      deposits,
      withdrawals,
      summary: {
        totalDeposits: deposits.reduce((sum, t) => sum + t.amount, 0),
        totalWithdrawals: withdrawals.reduce((sum, t) => sum + t.amount, 0),
        depositCount: deposits.length,
        withdrawalCount: withdrawals.length,
        lastDepositDate: deposits.length > 0 ? deposits[0].date : null,
      },
    };
  }
}
