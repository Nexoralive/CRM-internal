import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebsitesService } from './websites.service';
import { WebsitesController } from './websites.controller';
import { Website } from './entities/website.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Website])],
  controllers: [WebsitesController],
  providers: [WebsitesService],
})
export class WebsitesModule {}
