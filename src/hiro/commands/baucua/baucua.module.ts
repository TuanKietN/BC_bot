import { Module } from '@nestjs/common';
import { BaucuaService } from './baucua.service';
import { BaucuaEvent } from './baucua.event';
import { MezonModule } from '../../../mezon/mezon.module';
import { PrismaService } from '../../../prisma/prisma.service';
@Module({
  imports: [MezonModule],
  providers: [BaucuaService, BaucuaEvent, PrismaService],
  exports: [BaucuaService],
})
export class BaucuaModule {}
