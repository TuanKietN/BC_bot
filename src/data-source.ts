import { DataSource } from 'typeorm';
import { UserBalance } from './bot/models/user-balance.entity';
import { BaucuaGame } from './bot/models/baucua-game.entity';
import { BaucuaBet } from './bot/models/baucua-bet.entity';
import { BaucuaDiceResult } from './bot/models/baucua-dice-result.entity';
import { BaucuaWinner } from './bot/models/baucua-winner.entity';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
   type: 'mysql',
   url: process.env.DATABASE_URL,
   driver: require('mysql2'),
   entities: [UserBalance, BaucuaGame, BaucuaBet, BaucuaDiceResult, BaucuaWinner],
   migrations: [__dirname + '/src/migrations/*{.ts,.js}'],
   synchronize: false,
   logging: true,
});
