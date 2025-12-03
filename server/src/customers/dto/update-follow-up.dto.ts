import { IsEnum } from 'class-validator';

enum FollowUpStatus {
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export class UpdateFollowUpDto {
  @IsEnum(FollowUpStatus)
  status: FollowUpStatus;
}
