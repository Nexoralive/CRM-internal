import { IsEnum, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export enum MessageChannel {
  WHATSAPP = 'whatsapp',
  TELEGRAM = 'telegram',
  SMS = 'sms',
}

export class SendMessageDto {
  @IsNotEmpty()
  @IsString()
  customerId: string;

  @IsNotEmpty()
  @IsEnum(MessageChannel)
  channel: MessageChannel;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  agentId?: string;
}
