import { Injectable, BadRequestException } from '@nestjs/common';
import { InteractionsService } from '../interactions/interactions.service';
import { SendMessageDto, MessageChannel } from './dto/send-message.dto';
import { InteractionType } from '../interactions/entities/interaction.entity';

@Injectable()
export class IntegrationsService {
  constructor(private interactionsService: InteractionsService) {}

  async sendMessage(dto: SendMessageDto) {
    // In a real implementation, this would call Twilio/Telegram API
    console.log(
      `[Integrations] Sending ${dto.channel} message to customer ${dto.customerId}: ${dto.content}`,
    );

    let interactionType = InteractionType.OTHER;
    if (dto.channel === MessageChannel.WHATSAPP)
      interactionType = InteractionType.WHATSAPP;
    if (dto.channel === MessageChannel.TELEGRAM)
      interactionType = InteractionType.TELEGRAM;

    // Log the interaction
    await this.interactionsService.create({
      customerId: dto.customerId,
      agentId: dto.agentId,
      type: interactionType,
      content: `[Outbound ${dto.channel.toUpperCase()}] ${dto.content}`,
    });

    return { success: true, message: 'Message sent (simulated)' };
  }

  async initiateCall(customerId: string, agentId: string) {
    // In a real implementation, this would initiate a Twilio Voice call
    console.log(
      `[Integrations] Initiating call for customer ${customerId} by agent ${agentId}`,
    );

    // Log the interaction
    await this.interactionsService.create({
      customerId,
      agentId,
      type: InteractionType.CALL,
      content: `[Outbound Call] Call initiated`,
    });

    return { success: true, message: 'Call initiated (simulated)' };
  }
}
