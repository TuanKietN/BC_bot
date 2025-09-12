import { Module } from '@nestjs/common';
import { BaucuaService } from './baucua.service';
import { BaucuaEvent } from './baucua.event';
import { MezonModule } from '../../../mezon/mezon.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaucuaGame } from '../../models/baucua-game.entity';
import { BaucuaBet } from '../../models/baucua-bet.entity';
import { BaucuaDiceResult } from '../../models/baucua-dice-result.entity';
import { BaucuaWinner } from '../../models/baucua-winner.entity';
import { UserBalance } from '../../models/user-balance.entity';

@Module({
  imports: [
    MezonModule,
    TypeOrmModule.forFeature([
      BaucuaGame,
      BaucuaBet,
      BaucuaDiceResult,
      BaucuaWinner,
      UserBalance,
    ]),
  ],
  providers: [BaucuaService, BaucuaEvent],
  exports: [BaucuaService],
})
export class BaucuaModule {}
