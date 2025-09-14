<<<<<<< HEAD
import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MezonClientService } from './services/mezon-client.service';
import { MezonModuleAsyncOptions } from './dto/MezonModuleAsyncOptions';

@Global()
@Module({})
export class MezonModule {
  static forRootAsync(options: MezonModuleAsyncOptions): DynamicModule {
    return {
      module: MezonModule,
      imports: options.imports,
      providers: [
        {
          provide: MezonClientService,
          useFactory: async (configService: ConfigService) => {
            const token = configService.get<string>('MEZON_TOKEN');
            if (!token) {
              throw new Error('MEZON_TOKEN is not defined in environment variables');
            }
            
            // Tạo instance với token
            const client = new MezonClientService(token);
            
            try {
              // Thử khởi tạo kết nối, nhưng không throw lỗi nếu thất bại
              // Sẽ có cơ chế tự động kết nối lại sau
              await client.initializeClient();
            } catch (error) {
              // Log lỗi nhưng vẫn trả về client instance
              console.error('Failed to initialize Mezon client, will retry:', error);
            }

            return client;
          },
          inject: [ConfigService],
        },
      ],
      exports: [MezonClientService],
    };
  }
}
=======
import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MezonClient } from 'mezon-sdk';
import { MezonService } from './mezon.service';
import { BotGateway } from '../bot/bot.gateway';
import { MezonClientService } from './mezon-client.service';
@Module({
  imports: [],
  providers: [
    Logger,
    BotGateway,
    {
      provide: 'MEZON',
      useFactory: async (
        configService: ConfigService,
        logger: Logger,
        botGateway: BotGateway,
      ) => {
        const client = new MezonClient(
          configService.get<string>('MEZON_TOKEN'),
        );
        await client.login();
        await botGateway.initEvent(client);
        logger.warn(`Mezon client initialized ${client.clientId}`);

        return client;
      },
      inject: [ConfigService, Logger, BotGateway],
    },
    MezonService,
    MezonClientService,
  ],
  exports: ['MEZON', MezonService],
})
export class MezonModule {}
>>>>>>> 36798ea3101631e68dec081990f4a634a570b3b6
