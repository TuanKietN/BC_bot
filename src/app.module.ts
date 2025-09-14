import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from '@hapi/joi';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RedisModule } from './redis/redis.module';
import { MezonModule } from './mezon/mezon.module';
import { BotModule } from './bot/bot.module';
import { TopupModule } from './bot/commands/topup/topup.module';
import { BaucuaModule } from './bot/commands/baucua/baucua.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { TypeOrmModule } from '@nestjs/typeorm';

// Import entities
import { UserBalance } from './bot/models/user-balance.entity';
import { BaucuaGame } from './bot/models/baucua-game.entity';
import { BaucuaBet } from './bot/models/baucua-bet.entity';
import { BaucuaDiceResult } from './bot/models/baucua-dice-result.entity';
import { BaucuaWinner } from './bot/models/baucua-winner.entity';
import { TransactionLog } from './bot/models/transaction-log.entity';
import { TransactionSendLog } from './bot/models/transaction-send-log.entity';

@Module({
  imports: [
    // Load ENV
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        MEZON_TOKEN: Joi.string().required(),
        DATABASE_URL: Joi.string().required(),
        REDIS_PORT: Joi.number().default(6379),
      }),
    }),

    // TypeORM MySQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        url: config.get<string>('DATABASE_URL'),
        driver: require('mysql2'),
        entities: [UserBalance, BaucuaGame, BaucuaWinner, BaucuaBet, BaucuaDiceResult, TransactionLog, TransactionSendLog],
        synchronize: false,
        migrations: ['src/migrations/*{.ts,.js}'],
        logging: true,
      }),
    }),

    RedisModule,
    EventEmitterModule.forRoot(),
    MezonModule,
    BotModule,
    TopupModule,
    BaucuaModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
