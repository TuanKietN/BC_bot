import { Module } from '@nestjs/common';
import { TopupService } from './topup.service';
import { TopupEvent } from './topup.event';
import { MezonModule } from '../../../mezon/mezon.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionLog } from '../../models/transaction-log.entity';
import { TransactionSendLog } from '../../models/transaction-send-log.entity';
import { UserBalance } from '../../models/user-balance.entity';

@Module({
  imports: [
    MezonModule,
    TypeOrmModule.forFeature([
      TransactionLog,
      TransactionSendLog,
      UserBalance,
    ]),
  ],
  providers: [TopupService, TopupEvent],
  exports: [TopupService, TopupEvent],
})
export class TopupModule { }