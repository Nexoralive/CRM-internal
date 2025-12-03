import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateFollowUpDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsDateString()
  date: Date;
}
