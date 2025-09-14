import { Injectable } from '@nestjs/common';
import { MezonService } from '../../../mezon/mezon.service';
import { ChannelMessage, TokenSentEvent } from 'mezon-sdk';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, Like } from 'typeorm';
import { UserBalance } from '../../models/user-balance.entity';
import { TransactionLog } from '../../models/transaction-log.entity';
import { TransactionSendLog } from '../../models/transaction-send-log.entity';

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

  // createToken: cập nhật DB khi Mezon confirm
  async createToken(data: TokenSentEvent) {
    const botId = process.env.BOT_ID;
    if (!data.sender_id || !data.receiver_id) return;

    // ===== DEPOSIT (user gửi token cho bot) =====
    if (data.receiver_id === botId) {
      const userId = data.sender_id;

      // tránh ghi log trùng
      const exists = await this.transactionLogRepo.findOne({
        where: { transactionId: data.extra_attribute },
      });
      if (exists) return;

      // cộng token vào balance user
      let userBalance = await this.userBalanceRepo.findOne({
        where: { user_id: userId },
      });
      if (!userBalance) {
        userBalance = this.userBalanceRepo.create({
          user_id: userId,
          username: data.sender_name ?? '',
          balance: 0,
        });
      }
      userBalance.balance += data.amount;
      await this.userBalanceRepo.save(userBalance);

      // log giao dịch nạp
      await this.transactionLogRepo.save(
        this.transactionLogRepo.create({
          userId,
          transactionId: data.extra_attribute ?? `deposit_${Date.now()}`,
          amount: data.amount,
          type: ETransactionType.DEPOSIT,
        }),
      );

      console.log(`✅ Deposit success for user ${userId}: +${data.amount}`);
    }

    // ===== WITHDRAW (bot gửi token cho user) =====
    else if (data.sender_id === botId) {
      const userId = data.receiver_id;

      const exists = await this.transactionLogRepo.findOne({
        where: { transactionId: data.extra_attribute },
      });
      if (exists) return;

      await this.transactionLogRepo.save(
        this.transactionLogRepo.create({
          userId,
          transactionId: data.extra_attribute ?? `withdraw_${Date.now()}`,
          amount: data.amount,
          type: ETransactionType.WITHDRAW,
        }),
      );

      console.log(`✅ Withdraw logged for user ${userId}: -${data.amount}`);
    }
  }

  // withdraw: chỉ gửi token, không động vào DB
  async withdraw(data: ChannelMessage, amount: number) {
    const amt = Math.floor(Number(amount));
    if (!Number.isFinite(amt) || amt <= 0) {
      return this.mezon.sendMessage({
        type: 'channel',
        reply_to_message_id: data.message_id,
        payload: {
          channel_id: data.channel_id,
          message: { type: 'system', content: '❌ Số tiền rút không hợp lệ' },
        },
      });
    }

    const userBalance = await this.userBalanceRepo.findOne({ where: { user_id: data.sender_id } });

    if (!userBalance || userBalance.balance < amt) {
      return this.mezon.sendMessage({
        type: 'channel',
        reply_to_message_id: data.message_id,
        payload: {
          channel_id: data.channel_id,
          message: { type: 'system', content: '❌ Số dư không đủ' },
        },
      }); 
    }

    userBalance.balance -= amt;
    await this.userBalanceRepo.save(userBalance);

    const txId = `withdraw_${data.sender_id}_${Date.now()}`;

    try {
      await this.mezon.sendToken({
        sender_id: process.env.BOT_ID,
        receiver_id: data.sender_id,
        amount: amt,
        note: `Withdraw BauCua request`,
        extra_attribute: txId,
      });

      await this.mezon.sendMessage({
        type: 'channel',
        reply_to_message_id: data.message_id,
        payload: {
          channel_id: data.channel_id,
          message: { type: 'system', content: `💸 Đã rút thành công ${amt} token` },
        },
      });
    } catch (err) {
      console.error('withdraw error:', err);
      await this.mezon.sendMessage({
        type: 'channel',
        reply_to_message_id: data.message_id,
        payload: {
          channel_id: data.channel_id,
          message: { type: 'system', content: '❌ Rút thất bại, vui lòng thử lại.' },
        },
      });
    }
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
}