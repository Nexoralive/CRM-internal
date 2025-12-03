import { Injectable } from '@nestjs/common';
import { CustomersService } from '../customers/customers.service';
import * as csv from 'csv-parse';
import { Readable } from 'stream';

@Injectable()
export class ImportService {
  constructor(private customersService: CustomersService) {}

  async importCsv(fileBuffer: Buffer, websiteId: string) {
    const stream = Readable.from(fileBuffer.toString());
    const parser = stream.pipe(csv.parse({ columns: true, trim: true }));

    let count = 0;
    for await (const record of parser) {
      // Map CSV fields to Customer entity
      // Expected CSV headers: external_id, username, email, phone, last_deposit_amount, last_deposit_date
      await this.customersService.upsert({
        websiteId,
        externalId: record.external_id,
        username: record.username,
        email: record.email,
        phone: record.phone,
        lastDepositAmount: parseFloat(record.last_deposit_amount || '0'),
        lastDepositDate: new Date(record.last_deposit_date),
      });
      count++;
    }
    return { count, message: `Imported ${count} records` };
  }
}
