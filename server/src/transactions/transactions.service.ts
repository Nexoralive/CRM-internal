import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';

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
  async getOptions(website?: string) {
    const panelsQuery = this.transactionsRepository
      .createQueryBuilder('transaction')
      .select('DISTINCT transaction.panel', 'panel')
      .orderBy('transaction.panel', 'ASC');

    if (website) {
      panelsQuery.where('transaction.website = :website', { website });
    }

    const panels = await panelsQuery.getRawMany();

    const websites = await this.transactionsRepository
      .createQueryBuilder('transaction')
      .select('DISTINCT transaction.website', 'website')
      .orderBy('transaction.website', 'ASC')
      .getRawMany();

    return {
      panels: panels.map((p) => p.panel).filter(Boolean),
      websites: websites.map((w) => w.website).filter(Boolean),
    };
  }

  async getUniqueClients(
    page: number = 1,
    limit: number = 10,
    search?: string,
    website?: string,
    panel?: string, // panel parameter filters by transaction.panel column
    status?: string,
    lastDepositDate?: string,
    userWebsite?: string, // User's assigned website (for restriction)
    userPanels?: string[], // User's assigned panels (for restriction)
  ) {
    // Base query builder function to ensure consistency between count and data queries
    const createBaseQuery = () => {
      const qb = this.transactionsRepository.createQueryBuilder('transaction');
      if (search) {
        qb.andWhere(
          '(transaction.client ILIKE :search OR transaction.branch ILIKE :search OR transaction.website ILIKE :search)',
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
      .groupBy('transaction.client');

    if (lastDepositDate) {
      query.having(
        "MAX(CASE WHEN transaction.type = 'DEPOSIT' THEN transaction.date END)::date = :lastDepositDate",
        { lastDepositDate },
      );
    }

    query
      .orderBy('transaction.client', 'ASC')
      .offset((page - 1) * limit)
      .limit(limit);

    const results = await query.getRawMany();

    const items = results.map((r) => ({
      client: r.client,
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
