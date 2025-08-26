import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// import { MezonModule } from './mezon/mezon.module';
import { ConfigModule } from '@nestjs/config';
import * as Joi from '@hapi/joi';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RedisModule } from './redis/redis.module';
import { MezonModule } from './mezon/mezon.module';
import { BotModule } from './bot/bot.module';
import { TopupModule } from './hiro/commands/topup/topup.module';
import { BaucuaModule } from './hiro/commands/baucua/baucua.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        MEZON_TOKEN: Joi.string().required(),
      }),
    }),
    RedisModule,
    EventEmitterModule.forRoot(),
    MezonModule,
    BotModule,
    TopupModule,
    BaucuaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}