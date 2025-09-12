import { Injectable } from '@nestjs/common';
import { MezonService } from '../../mezon/mezon.service';
import { ChannelMessage, TokenSentEvent } from 'mezon-sdk';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, Like } from 'typeorm';
import { UserBalance } from '../models/user-balance.entity';
import { TransactionLog } from '../models/transaction-log.entity';
import { TransactionSendLog } from '../models/transaction-send-log.entity';

enum ETransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAW = 'WITHDRAW',
}

@Injectable()
export class TopupService {
  constructor(
    private readonly mezon: MezonService,

    @InjectRepository(UserBalance)
    private readonly userBalanceRepo: Repository<UserBalance>,

    @InjectRepository(TransactionLog)
    private readonly transactionLogRepo: Repository<TransactionLog>,

    @InjectRepository(TransactionSendLog)
    private readonly transactionSendLogRepo: Repository<TransactionSendLog>,
  ) { }

  async createToken(data: TokenSentEvent & { transaction_id: string }) {
    if (!data.sender_id) return;

    const exists = await this.transactionLogRepo.findOne({
      where: { transactionId: data.transaction_id },
    });
    if (exists) return;

    let userBalance = await this.userBalanceRepo.findOne({
      where: { user_id: data.sender_id },
    });

    if (!userBalance) {
      userBalance = this.userBalanceRepo.create({
        user_id: data.sender_id,
        username: data.sender_name ?? '',
        balance: data.amount,
      });
    } else {
      userBalance.balance += data.amount;
    }
    await this.userBalanceRepo.save(userBalance);

    const log = this.transactionLogRepo.create({
      userId: data.sender_id,
      transactionId: data.transaction_id,
      amount: data.amount,
      type: ETransactionType.DEPOSIT,
    });
    await this.transactionLogRepo.save(log);
  }

  async checkBalance(data: ChannelMessage) {
    let userBalance = await this.userBalanceRepo.findOne({
      where: { user_id: data.sender_id },
    });

    if (!userBalance) {
      await this.mezon.sendMessage({
        type: 'channel',
        reply_to_message_id: data.message_id,
        payload: {
          channel_id: data.channel_id,
          message: { type: 'system', content: '💸Bạn không có số dư, hãy nạp token!' },
        },
      });

      userBalance = this.userBalanceRepo.create({
        user_id: data.sender_id,
        username: data.username ?? '',
        balance: 0,
      });
      await this.userBalanceRepo.save(userBalance);
      return;
    }

    await this.mezon.sendMessage({
      type: 'channel',
      reply_to_message_id: data.message_id,
      payload: {
        channel_id: data.channel_id,
        message: { type: 'system', content: `💸Số dư của bạn là ${userBalance.balance} token` },
      },
    });
  }

  async withdraw(data: ChannelMessage, amount: number) {
    const userBalance = await this.userBalanceRepo.findOne({
      where: { user_id: data.sender_id },
    });

    if (!userBalance || userBalance.balance < amount || amount < 1000) {
      await this.mezon.sendMessage({
        type: 'channel',
        reply_to_message_id: data.message_id,
        payload: {
          channel_id: data.channel_id,
          message: { type: 'system', content: '💸Số dư không đủ hoặc số tiền rút không hợp lệ' },
        },
      });
      return;
    }

    // Check logs gần đây
    const fumoSent = await this.transactionSendLogRepo.find({
      where: {
        userId: 'fumo',
        toUserId: data.sender_id,
        createdAt: MoreThan(new Date(Date.now() - 1000 * 60 * 60 * 24)),
        note: Like('lot_%'),
      },
    });

    // Update balance
    userBalance.balance -= amount;
    await this.userBalanceRepo.save(userBalance);

    const log = this.transactionLogRepo.create({
      userId: data.sender_id,
      amount,
      type: ETransactionType.WITHDRAW,
    });
    await this.transactionLogRepo.save(log);

    await this.mezon.sendToken({
      user_id: data.sender_id,
      amount,
      note: `Rút ${amount} token`,
    });

    await this.mezon.sendMessage({
      type: 'channel',
      reply_to_message_id: data.message_id,
      payload: {
        channel_id: data.channel_id,
        message: { type: 'system', content: `💸Rút ${amount} token thành công` },
      },
    });
  }
}