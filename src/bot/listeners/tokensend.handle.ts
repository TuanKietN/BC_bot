import { MezonClientService } from '../../mezon/mezon-client.service';
import { OnEvent } from '@nestjs/event-emitter';
import { Events, TokenSentEvent, EMarkdownType, MezonClient } from 'mezon-sdk';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { BaseQueueProcessor } from '../base/queue-processor.base';
import { UserBalance } from '../models/user-balance.entity';
import { TransactionLog, ETransactionType } from '../models/transaction-log.entity';
import { TransactionSendLog } from '../models/transaction-send-log.entity';
import { RedisCacheService } from '../../redis/redis-cache.service';
import { UserCacheService } from '../commands/user-cache.service';
import { randomUUID } from 'crypto';

@Injectable()
export class ListenerTokenSend extends BaseQueueProcessor<TokenSentEvent> {
   protected readonly logger = new Logger(ListenerTokenSend.name);
   private client: MezonClient;

   constructor(
      @InjectRepository(UserBalance)
      private userBalanceRepo: Repository<UserBalance>,
      @InjectRepository(TransactionLog)
      private transactionLogRepo: Repository<TransactionLog>,
      @InjectRepository(TransactionSendLog)
      private transactionSendLogRepo: Repository<TransactionSendLog>,
      private clientService: MezonClientService,
      private dataSource: DataSource,
      private userCacheService: UserCacheService,
      private redisCacheService: RedisCacheService,
   ) {
      super('ListenerTokenSend', 1, 15000);
      this.client = this.clientService.getClient();
   }

   @OnEvent(Events.TokenSend)
   async handleRecharge(tokenEvent: TokenSentEvent) {
      if (tokenEvent.amount <= 0) return;

      const botId = process.env.UTILITY_BOT_ID;
      if (!botId) return;

      if (tokenEvent.receiver_id === botId && tokenEvent.sender_id) {
         await this.addToQueue(tokenEvent);
      }
   }

   protected async processItem(tokenEvent: TokenSentEvent): Promise<void> {
      const amount = Number(tokenEvent.amount) || 0;
      const botId = process.env.UTILITY_BOT_ID!;
      // tự sinh transaction id
      const txId = randomUUID();
      const lockKey = `recharge_${txId}`;

      const lockAcquired = await this.redisCacheService.acquireLock(lockKey, 10);
      if (!lockAcquired) {
         this.logger.warn(`Duplicate recharge detected: ${txId}`);
         return;
      }

      try {
         // check duplicate transaction
         const existed = await this.transactionLogRepo.findOne({
            where: { transactionId: txId },
         });
         if (existed) {
            this.logger.warn(`Transaction already processed: ${txId}`);
            return;
         }

         await this.dataSource.transaction(async (manager) => {
            // 1. Update balance for sender
            let sender = await manager.findOne(UserBalance, {
               where: { user_id: tokenEvent.sender_id },
            });
            if (!sender) {
               sender = manager.create(UserBalance, {
                  user_id: tokenEvent.sender_id,
                  username: tokenEvent.sender_id, // TODO: lấy username từ SDK nếu có
                  balance: 0,
               });
            }
            sender.balance += amount;
            await manager.save(sender);

            // 2. Update balance for bot
            let bot = await manager.findOne(UserBalance, {
               where: { user_id: botId },
            });
            if (!bot) {
               bot = manager.create(UserBalance, {
                  user_id: botId,
                  username: 'UtilityBot',
                  balance: 0,
               });
            }
            bot.balance += amount;
            await manager.save(bot);

            // 3. Insert into transaction_logs
            await manager.insert(TransactionLog, {
               transactionId: txId,
               userId: tokenEvent.sender_id!,
               amount,
               type: ETransactionType.DEPOSIT,
            });

            // 4. Insert into transaction_send_logs
            await manager.insert(TransactionSendLog, {
               userId: tokenEvent.sender_id!,
               toUserId: botId,
               amount,
               note: tokenEvent.note || 'Recharge',
            });
         });

         // update Redis cache (sau khi DB xong)
         await this.userCacheService.updateUserBalance(tokenEvent.sender_id!, amount, 10);
         await this.userCacheService.updateUserBalance(botId, amount, 10);

         // notify user
         const clan = this.client.clans.get('0');
         const user = await clan?.users.fetch(tokenEvent.sender_id as string);
         const msg = `💸 Nạp ${amount.toLocaleString('vi-VN')} token thành công`;
         await user?.sendDM({
            t: msg,
            mk: [{ type: EMarkdownType.PRE, s: 0, e: msg.length }],
         });

         this.logger.log(
            `Recharge success: ${txId}, amount=${amount}, user=${tokenEvent.sender_id}`,
         );
      } catch (err) {
         this.logger.error(`Failed to process transaction ${txId}`, err);
         throw err;
      } finally {
         await this.redisCacheService.releaseLock(lockKey);
      }
   }
}