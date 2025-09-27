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

import { AppDataSource } from './data-source';

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

    // Use the AppDataSource with TypeOrmModule.forRootAsync
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        return AppDataSource.options; // Trả về options từ AppDataSource
      },
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
