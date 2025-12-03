import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('integrations')
@UseGuards(JwtAuthGuard)
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Post('message')
  sendMessage(@Body() sendMessageDto: SendMessageDto) {
    return this.integrationsService.sendMessage(sendMessageDto);
  }

  @Post('call')
  initiateCall(@Body() body: { customerId: string; agentId: string }) {
    return this.integrationsService.initiateCall(body.customerId, body.agentId);
  }
}
