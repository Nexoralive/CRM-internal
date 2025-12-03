export class CreateCustomerDto {
  websiteId: string;
  externalId: string;
  username?: string;
  email?: string;
  phone?: string;
  assignedAgentId?: string;
  totalDeposits?: number;
  lastDepositDate?: Date;
  lastDepositAmount?: number;
}
