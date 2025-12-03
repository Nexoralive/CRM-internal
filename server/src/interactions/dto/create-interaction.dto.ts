import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { InteractionType } from '../entities/interaction.entity';

export class CreateInteractionDto {
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @IsUUID()
  @IsOptional()
  agentId?: string;

  @IsEnum(InteractionType)
  @IsOptional()
  type?: InteractionType;

  @IsString()
  @IsNotEmpty()
  content: string;
}
