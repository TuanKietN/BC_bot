import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { MessageButtonClickedEvent, TokenSentEventI } from './types';
import { MezonService } from '../../../mezon/mezon.service';
import {
  ChannelMessage,
  EButtonMessageStyle,
  EMarkdownType,
  EMessageComponentType,
} from 'mezon-sdk';
import { getGameRef, getRef } from '../../../common/utils/get-ref';
import { EMessageMode } from '../../../common/enums/mezon.enum';
import { ETransactionType } from '@prisma/client';
import { Redis } from 'ioredis';
import { TokenSentEvent } from 'mezon-sdk';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Injectable()
export class TopupService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mezon: MezonService,
  ) {}

  async createToken(data: TokenSentEvent & { transaction_id: string }) {
    const transactionId = data.transaction_id;
    try {
      const check = await this.prisma.transaction_logs.findFirst({
        where: {
          transaction_id: transactionId,
        },
      });
      if (check || !data.sender_id) return;
      await Promise.all([
        this.prisma.$transaction(async (tx) => {
          const userBalance = await tx.user_balance.findUnique({
            where: {
              user_id: data.sender_id,
            },
          });
          if (!userBalance) {
            await tx.user_balance.create({
              data: {
                user_id: data.sender_id!,
                balance: data.amount,
                username: data.sender_name!,
              },
            });
            await tx.transaction_logs.create({
              data: {
                transaction_id: transactionId,
                user_id: data.sender_id!,
                amount: data.amount,
              },
            });
          } else {
            await tx.user_balance.update({
              where: {
                user_id: data.sender_id!,
              },
              data: {
                balance: {
                  increment: data.amount,
                },
              },
            });
            await tx.transaction_logs.create({
              data: {
                transaction_id: transactionId,
                user_id: data.sender_id!,
                amount: data.amount,
              },
            });
          }
        }),
      ]);
    } catch (error) {
      console.log(error);
    }
  }


  async ping(data: ChannelMessage) {
    await this.mezon.sendMessage({
      type: 'channel',
      reply_to_message_id: data.message_id,
      payload: {
        channel_id: data.channel_id,
        message: {
          type: 'normal_text',
          content: 'PONG',
        },
      },
    });
  }

  async checkBalance(data: ChannelMessage) {
    const userBalance = await this.prisma.user_balance.findUnique({
      where: {
        user_id: data.sender_id,
      },
    });
    if (!userBalance) {
      const message = `💸Bạn không có số dư\nHãy nạp thêm token bằng cách send token cho bot.`;
      await this.mezon.sendMessage({
        type: 'channel',
        reply_to_message_id: data.message_id,
        payload: {
          channel_id: data.channel_id,
          message: {
            type: 'system',
            content: message,
          },
        },
      });
      await this.prisma.user_balance.create({
        data: {
          user_id: data.sender_id,
          balance: 0,
          username: data.username || '',
        },
      });
    } else {
      const message = `💸Số dư của bạn là ${userBalance.balance} token`;
      await this.mezon.sendMessage({
        type: 'channel',
        reply_to_message_id: data.message_id,
        payload: {
          channel_id: data.channel_id,
          message: {
            type: 'system',
            content: message,
          },
        },
      });
    }
  }


  async withdraw(data: ChannelMessage, amount: number) {
    const userBalance = await this.prisma.user_balance.findUnique({
      where: {
        user_id: data.sender_id,
      },
    });
    if (!userBalance || userBalance.balance < amount || amount < 1000) {
      const message = `💸Số dư của bạn không đủ để rút hoặc số tiền rút không hợp lệ`;
      await this.mezon.sendMessage({
        type: 'channel',
        reply_to_message_id: data.message_id,
        payload: {
          channel_id: data.channel_id,
          message: {
            type: 'system',
            content: message,
          },
        },
      });
    } else {
      //check
      const fumoSent = await this.prisma.transaction_send_logs.findMany({
        where: {
          user_id: 'fumo',
          to_user_id: data.sender_id,
          created_at: {
            gte: new Date(Date.now() - 1000 * 60 * 60 * 24),
          },
          note: {
            startsWith: 'lot_',
          },
        },
      });
        await this.prisma.$transaction(async (tx) => {
          await tx.user_balance.update({
            where: {
              user_id: data.sender_id,
            },
            data: {
              balance: {
                decrement: amount,
              },
            },
          });
          await tx.transaction_logs.create({
            data: {
              user_id: data.sender_id,
              amount: amount,
              type: ETransactionType.WITHDRAW,
            },
          });
        });
        await this.mezon.sendToken({
          user_id: data.sender_id,
          amount: amount,
          note: `Rút ${amount} token`,
        });
        const message = `💸Rút ${amount} token thành công`;
        await this.mezon.sendMessage({
          type: 'channel',
          reply_to_message_id: data.message_id,
          payload: {
            channel_id: data.channel_id,
            message: {
              type: 'system',
              content: message,
          },
        },
      });
    }
  }
}
