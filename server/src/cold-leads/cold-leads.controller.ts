import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ColdLeadsService } from './cold-leads.service';
import { CreateColdLeadDto } from './dto/create-cold-lead.dto';
import { UpdateColdLeadDto } from './dto/update-cold-lead.dto';

@Controller('cold-leads')
export class ColdLeadsController {
  constructor(private readonly coldLeadsService: ColdLeadsService) {}

  @Post()
  create(@Body() createColdLeadDto: CreateColdLeadDto) {
    return this.coldLeadsService.create(createColdLeadDto);
  }

  @Get()
  findAll() {
    return this.coldLeadsService.findAll();
  }

  @Get('available')
  findAvailable(
    @Query('websiteId') websiteId: string,
    @Query('limit') limit?: number,
  ) {
    return this.coldLeadsService.findAvailable(websiteId, limit ? +limit : 50);
  }

  @Get('my-leads')
  findMyLeads(@Query('agentId') agentId: string) {
    return this.coldLeadsService.findMyLeads(agentId);
  }

  @Post(':id/claim')
  claim(@Param('id') id: string, @Body('agentId') agentId: string) {
    return this.coldLeadsService.claim(id, agentId);
  }

  @Post(':id/promote')
  promote(@Param('id') id: string, @Body('agentId') agentId: string) {
    return this.coldLeadsService.promoteToCustomer(id, agentId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coldLeadsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateColdLeadDto: UpdateColdLeadDto,
  ) {
    return this.coldLeadsService.update(id, updateColdLeadDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.coldLeadsService.remove(id);
  }
}
