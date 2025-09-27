import { DataSource } from 'typeorm';
import { UserBalance } from './bot/models/user-balance.entity';
import { BaucuaGame } from './bot/models/baucua-game.entity';
import { BaucuaBet } from './bot/models/baucua-bet.entity';
import { BaucuaDiceResult } from './bot/models/baucua-dice-result.entity';
import { BaucuaWinner } from './bot/models/baucua-winner.entity';
import * as dotenv from 'dotenv';
import { TransactionLog } from './bot/models/transaction-log.entity';
import { TransactionSendLog } from './bot/models/transaction-send-log.entity';

dotenv.config();

export const AppDataSource = new DataSource({
   type: 'postgres',
   url: process.env.DATABASE_URL,
   driver: require('pg'),
   entities: [
      UserBalance,
      BaucuaGame,
      BaucuaBet,
      BaucuaDiceResult,
      BaucuaWinner,
      TransactionLog,
      TransactionSendLog
   ],
   migrations: [__dirname + '/src/migrations/*{.ts,.js}'],
   synchronize: false,
   logging: true,
});
