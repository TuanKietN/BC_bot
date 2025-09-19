import { Module } from '@nestjs/common';
import { TopupService } from './topup.service';
import { TopupEvent } from './topup.event';
import { PrismaModule } from '../../../prisma/prisma.module';
import { MezonModule } from '../../../mezon/mezon.module';

@Module({
  imports: [PrismaModule, MezonModule],
  providers: [TopupService, TopupEvent],
  exports: [TopupService, TopupEvent],
})
export class TopupModule {}