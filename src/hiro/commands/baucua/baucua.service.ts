import { Injectable, Logger } from '@nestjs/common';
import { ChannelMessage, EButtonMessageStyle, EMessageComponentType } from 'mezon-sdk';
import { MezonService } from '../../../mezon/mezon.service';
import { MessageButtonClickedEvent } from '../topup/types';
import { PrismaService } from '../../../prisma/prisma.service';
import { GameStatus } from '../../../db/enums';
import { DiceSymbol } from '@prisma/client';
import { BauCuaSelect } from '../../../common/component/BauCuaSelect';

export const BaucuaMappingChoice = {
  6: "FISH",
  5: "SHRIMP",
  2: "CRAB",
  1: "GOURD",
  3: "ROOSTER",
  4: "DEER",
}

export const BaucuaMappingChoiceReverse = {
  "FISH": 6,
  "SHRIMP": 5,
  "CRAB": 2,
  "GOURD": 1,
  "ROOSTER": 3,
  "DEER": 4,
}
export const BaucuaMappingName = {
  1: "Bầu",
  2: "Cua",
  3: "Gà",
  4: "Nai",
  5: "Tôm",
  6: "Cá",
}

export const MappingPic = {
  "DEER": "1.png",
  "GOURD": "2.png",
  "ROOSTER": "3.png",
  "FISH": "4.png",
  "CRAB": "5.png",
  "SHRIMP": "6.png",
};

export interface Bet {
  symbol: DiceSymbol;
  amount: number;
}

function generateBauCuaPool(diceResults: DiceSymbol[]): string[][] {
  const allSymbols: DiceSymbol[] = [
    DiceSymbol.GOURD,
    DiceSymbol.CRAB,
    DiceSymbol.ROOSTER,
    DiceSymbol.DEER,
    DiceSymbol.SHRIMP,
    DiceSymbol.FISH,
  ];

  function buildReel(finalSymbol: DiceSymbol): string[] {
    const reel: string[] = [];
    for (let i = 0; i < 12; i++) {
      const randomSym = allSymbols[Math.floor(Math.random() * allSymbols.length)];
      reel.push(MappingPic[randomSym]); // ví dụ "3.png"
    }
    // ép kết quả cuối cùng
    reel.push(MappingPic[finalSymbol]);
    return reel;
  }

  return [
    buildReel(diceResults[0]),
    buildReel(diceResults[1]),
    buildReel(diceResults[2]),
  ];
}

@Injectable()
export class BaucuaService {
  private readonly logger = new Logger(BaucuaService.name);
  private activeGames: Map<string, {
    bets: Map<string, Bet[]>;
    messageId: string;
  }> = new Map();
  private gameTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    private readonly mezon: MezonService,
    private readonly prisma: PrismaService,
  ) { }

  async createBaucua(message: ChannelMessage) {
    const gameId = `${message.channel_id}_${Date.now()}`;

    // Check if game exists
    const existingGame = await this.prisma.baucuaGame.findFirst({
      where: {
        channelId: message.channel_id,
        status: GameStatus.WAITING,
      },
    });

    if (existingGame) {
      await this.mezon.sendMessage({
        type: 'channel',
        payload: {
          channel_id: message.channel_id,
          message: {
            type: 'system',
            content: 'Ván cược đã được tạo!',
          },
        },
      });
      return;
    }

    const response = await this.mezon.sendMessage({
      type: 'channel',
      payload: {
        channel_id: message.channel_id,
        message: {
          type: 'optional',
          content: {
            embed: [
              {
                color: "#BCC0C0",
                title: '🎲 BẦU CUA TÔM CÁ 🎲',
                description: 'Chọn cửa cược và số tiền để tham gia',
              },
            ],
            components: [
              { components: [BauCuaSelect] },
              {
                components: [
                  { id: '5000', type: EMessageComponentType.BUTTON, component: { label: '5000', style: EButtonMessageStyle.SECONDARY } },
                  { id: '10000', type: EMessageComponentType.BUTTON, component: { label: '10000', style: EButtonMessageStyle.PRIMARY } },
                  { id: '20000', type: EMessageComponentType.BUTTON, component: { label: '20000', style: EButtonMessageStyle.SUCCESS } },
                  { id: '50000', type: EMessageComponentType.BUTTON, component: { label: '50000', style: EButtonMessageStyle.DANGER } },
                ]
              }
            ],
          },
        },
      },
    });

    await this.prisma.baucuaGame.create({
      data: {
        id: gameId,
        channelId: message.channel_id,
        messageId: response.message_id,
        status: GameStatus.WAITING,
        startedAt: null,
        creatorId: message.sender_id,
      },
    });
  }

  private async rollDiceAndPayout(gameId: string) {
    const game = await this.prisma.baucuaGame.findUnique({
      where: { id: gameId },
      include: { bets: true },
    });

    if (!game || game.status !== GameStatus.WAITING) return;

    // Clear timeout nếu có
    const timeout = this.gameTimeouts.get(gameId);
    if (timeout) {
      clearTimeout(timeout);
      this.gameTimeouts.delete(gameId);
    }

    // 🎲 Roll kết quả ngay lập tức
    const diceResults = this.generateDiceResults();

    // Lưu vào DB
    for (let i = 0; i < diceResults.length; i++) {
      await this.prisma.baucuaDiceResult.create({
        data: { gameId, symbol: diceResults[i], position: i + 1 },
      });
    }

    // Tính thắng thua trước (để sau show luôn)
    const symbolCount = new Map<DiceSymbol, number>();
    for (const s of diceResults) {
      symbolCount.set(s, (symbolCount.get(s) || 0) + 1);
    }

    const winnings = new Map<string, number>();
    for (const bet of game.bets) {
      const count = symbolCount.get(bet.symbol) || 0;
      if (count > 0) {
        const winAmount = bet.amount + bet.amount * count;
        winnings.set(bet.userId, (winnings.get(bet.userId) || 0) + winAmount);
      }
    }

    // 🎰 Gửi update: cho quay random (pool giả)
    const pool = generateBauCuaPool(diceResults);

    await this.mezon.updateMessage({
      channel_id: game.channelId,
      message_id: game.messageId,
      content: {
        type: 'optional',
        content: {
          embed: [
            {
              color: "#BCC0C0",
              title: '🎲 BẦU CUA ĐANG QUAY 🎲',
              description: 'Đang quay kết quả...',
              fields: [
                {
                  name: '',
                  value: '',
                  inputs: {
                    id: `baucua`,
                    type: EMessageComponentType.ANIMATION,
                    component: {
                      url_image: "https://cdn.mezon.ai/1840702095641022464/1840702095661993984/1924288420973121500/1756958211609_1baucua.png",
                      url_position: "https://cdn.mezon.ai/1840702095641022464/1840702095661993984/1840674320150433800/1757138049982_baucua.json",
                      pool,
                      repeat: 15,
                      duration: 0.4,
                    },
                  },
                },
              ] as any,
            },
          ],
        },
      },
    });

    // Sau 5s update thành kết quả thật
    setTimeout(async () => {
      let resultMessage = `Xúc xắc: ${diceResults.map(s => this.getSymbolEmoji(s)).join(' ')}\n\n`;
      if (winnings.size > 0) {
        resultMessage += `Người thắng:\n`;
        for (const [userId, amount] of winnings) {
          const user = await this.prisma.user_balance.findUnique({ where: { user_id: userId } });
          if (user) resultMessage += `${user.username}: +${amount} đ\n`;
        }
      } else {
        resultMessage += `Không có người thắng!\n`;
      }

      const finalPool = generateBauCuaPool(diceResults);

      await this.mezon.updateMessage({
        channel_id: game.channelId,
        message_id: game.messageId,
        content: {
          type: 'optional',
          content: {
            embed: [
              {
                color: "#BCC0C0",
                title: '🎲 KẾT QUẢ BẦU CUA 🎲',
                description: 'Game đã kết thúc!\n\n' + resultMessage,
                fields: [
                  {
                    name: '',
                    value: '',
                    inputs: {
                      id: `baucua`,
                      type: EMessageComponentType.ANIMATION,
                      component: {
                        url_image: "https://cdn.mezon.ai/1840702095641022464/1840702095661993984/1924288420973121500/1756958211609_1baucua.png",
                        url_position: "https://cdn.mezon.ai/1840702095641022464/1840702095661993984/1840674320150433800/1757138049982_baucua.json",
                        pool: finalPool,
                        repeat: 15,
                        duration: 0.4,
                      },
                    },
                  },
                ] as any,
              },
            ],
          },
        },
      });

      // 👉 Sau khi update kết quả thì mới update DB (winner, balance, game finished)
      for (const [userId, amount] of winnings) {
        await this.prisma.user_balance.update({
          where: { user_id: userId },
          data: { balance: { increment: amount } },
        });
      }

      await this.prisma.baucuaGame.update({
        where: { id: gameId },
        data: { status: GameStatus.FINISHED, endedAt: new Date() },
      });

    }, 5000);
  }



  private generateDiceResults(): DiceSymbol[] {
    const symbols = Object.values(DiceSymbol);
    const result: DiceSymbol[] = [];
    for (let i = 0; i < 3; i++) {
      const randomIndex = Math.floor(Math.random() * symbols.length);
      result.push(symbols[randomIndex]);
    }
    return result;
  }

  private getSymbolEmoji(symbol: DiceSymbol): string {
    const emojiMap: Record<DiceSymbol, string> = {
      [DiceSymbol.FISH]: '🐟',
      [DiceSymbol.SHRIMP]: '🦐',
      [DiceSymbol.CRAB]: '🦀',
      [DiceSymbol.GOURD]: '🎃',
      [DiceSymbol.ROOSTER]: '🐔',
      [DiceSymbol.DEER]: '🦌',
    };
    return emojiMap[symbol];
  }

  private userChoices: Map<string, string> = new Map();

  async handleSelectChoice(userId: string, value: string, channelId: string) {
    // Tìm game hiện tại trong channel
    const game = await this.prisma.baucuaGame.findFirst({
      where: {
        channelId,
        status: GameStatus.WAITING,
        endedAt: null,
      },
      orderBy: { startedAt: 'desc' },
    });

    if (!game) {
      this.logger.warn(
        `⚠️ Không tìm thấy ván đang chờ trong channel ${channelId}, user ${userId} chọn cửa bị bỏ qua`,
      );
      return;
    }

    // Nếu user không phải creator thì chặn
    if (game.creatorId !== userId) {
      this.logger.warn(
        `❌ User ${userId} cố chọn cửa nhưng không phải chủ game (creator=${game.creatorId})`,
      );
      return;
    }

    // Reset state cũ của user trong channel (nếu có)
    const key = `${userId}_${channelId}`;
    if (this.userChoices.has(key)) {
      this.logger.debug(`♻️ Reset userChoices[${key}] từ ${this.userChoices.get(key)}`);
      this.userChoices.delete(key);
    }

    // Set lựa chọn mới
    this.userChoices.set(key, value);

    this.logger.log(
      `✅ SET userChoices[${key}] = ${value} (${BaucuaMappingName[parseInt(value)]})`,
    );

    // Gửi xác nhận về channel
    await this.mezon.sendMessage({
      type: 'channel',
      payload: {
        channel_id: channelId,
        message: {
          type: 'system',
          content: `👉 Bạn đã chọn cửa: ${BaucuaMappingName[parseInt(value)]}`,
        },
      },
    });
  }


  async handleButtonClicked(data: MessageButtonClickedEvent) {
    if (data.button_id === 'BauCuaSelect') {
      this.logger.debug(
        `⏩ Bỏ qua event chọn cửa trong handleButtonClicked: ${JSON.stringify(
          data,
        )}`,
      );
      return;
    }

    const { button_id, user_id, channel_id } = data;
    const key = `${user_id}_${channel_id}`;

    this.logger.debug(
      `📥 Nhận click tiền: user=${user_id}, channel=${channel_id}, money=${button_id}`,
    );

    const userBalance = await this.prisma.user_balance.findUnique({
      where: { user_id },
    });
    if (!userBalance) return;

    if (userBalance.balance < parseInt(button_id)) {
      this.logger.warn(
        `❌ User ${user_id} (${userBalance.username}) không đủ tiền (${userBalance.balance}) để đặt ${button_id}`,
      );
      await this.mezon.sendMessage({
        type: 'channel',
        payload: {
          channel_id,
          message: {
            type: 'system',
            content: `❌ Bạn ${userBalance.username} không có đủ tiền để đặt cược!`,
          },
        },
      });
      return;
    }

    // 🔑 Lấy lại cửa đã chọn từ state
    const value = this.userChoices.get(key);
    this.logger.log(`🔍 GET userChoices[${key}] = ${value}`);

    if (!value) {
      this.logger.warn(`⚠️ User ${user_id} chưa chọn cửa nhưng lại bấm tiền`);
      await this.mezon.sendMessage({
        type: 'channel',
        payload: {
          channel_id,
          message: {
            type: 'system',
            content: `⚠️ Bạn cần chọn cửa (Bầu, Cua, Gà...) trước khi bấm số tiền!`,
          },
        },
      });
      return;
    }

    const game = await this.prisma.baucuaGame.findFirst({
      where: {
        channelId: channel_id,
        status: GameStatus.WAITING,
        endedAt: null,
      },
    });
    if (!game) return;

    if (game.creatorId !== user_id) {
      this.logger.warn(`❌ User ${user_id} không phải creator (${game.creatorId})`);
      await this.mezon.sendMessage({
        type: 'channel',
        payload: {
          channel_id,
          message: {
            type: 'system',
            content: `⚠️ Chỉ người tạo ván (${game.creatorId}) mới được tham gia chơi!`,
          },
        },
      });
      return;
    }

    await this.prisma.baucuaBet.create({
      data: {
        gameId: game.id,
        userId: user_id,
        symbol: BaucuaMappingChoice[parseInt(value)],
        amount: parseInt(button_id),
      },
    });

    // Nếu đây là lần đặt cược đầu tiên => bắt đầu timer
    if (!game.startedAt) {
      await this.prisma.baucuaGame.update({
        where: { id: game.id },
        data: { startedAt: new Date() },
      });

      // Gửi thông báo đếm ngược 5s
      for (let i = 5; i > 0; i--) {
        setTimeout(async () => {
          await this.mezon.updateMessage({
            channel_id: game.channelId,
            message_id: game.messageId,
            content: {
              type: 'optional',
              content: {
                embed: [
                  {
                    color: "#BCC0C0",
                    title: '🎲 BẦU CUA BẮT ĐẦU 🎲',
                    description: `⏳ Còn ${i} giây để quay...`,
                  },
                ],
              },
            },
          });
        }, (5 - i) * 1000);
      }

      // Sau 5s thì gọi quay
      const timeout = setTimeout(() => this.rollDiceAndPayout(game.id), 5000);
      this.gameTimeouts.set(game.id, timeout);

      this.logger.log(`⏳ Game ${game.id} bắt đầu đếm ngược 5s`);
    }

    await this.prisma.user_balance.update({
      where: { user_id },
      data: { balance: userBalance.balance - parseInt(button_id) },
    });

    const noti = `Người chơi ${userBalance.username} đã đặt cược: ${BaucuaMappingName[parseInt(value)]} ${parseInt(button_id)}`;
    this.logger.log(`💰 ${noti}`);
  }

  async handleEndGame(gameId: string) {
    const game = await this.prisma.baucuaGame.findUnique({
      where: {
        id: gameId,
      },
    });
    if (!game) return;
    const diceResult = this.generateDiceResults();
    game.endedAt = new Date();
    await this.prisma.baucuaGame.update({
      where: {
        id: gameId,
      },
      data: game,
    });
    const bets = await this.prisma.baucuaBet.findMany({
      where: {
        gameId: gameId,
      },
    });
    const betsMap = new Map<string, Bet[]>();
    for (const bet of bets) {
      const userId = bet.userId;
      const userBets = betsMap.get(userId) || [];
      userBets.push({ symbol: bet.symbol as unknown as DiceSymbol, amount: bet.amount });
      betsMap.set(userId, userBets);
    }

    // Calculate winnings
    const winnings = new Map<string, number>();
    for (const [userId, userBets] of betsMap.entries()) {
      let totalWin = 0;
      for (const bet of userBets) {
        const count = diceResult.filter(s => s === bet.symbol).length;
        if (count > 0) {
          totalWin += bet.amount * count;
        }
      }
      if (totalWin > 0) {
        winnings.set(userId, totalWin);
      }
    }

    for (const [userId, userWinnings] of winnings.entries()) {
      const userBalance = await this.prisma.user_balance.findUnique({
        where: {
          user_id: userId,
        },
      });
      if (!userBalance) continue;
      await this.prisma.user_balance.update({
        where: {
          user_id: userId,
        },
        data: {
          balance: userBalance.balance + userWinnings,
        },
      });
    }
    let content = `Kết quả: ${diceResult.join(', ')} \n\n`;
    for (const [userId, userWinnings] of winnings.entries()) {
      content += `${userId}: ${userWinnings}\n`;
    }
    await this.mezon.sendMessage({
      type: 'channel',
      payload: {
        channel_id: game.channelId,
        message: {
          type: 'system',
          content: content,
        },
      },
    });
  }
  async handleBetResult(data: ChannelMessage) {
    const game = await this.prisma.baucuaGame.findFirst({
      where: {
        channelId: data.channel_id,
        status: GameStatus.WAITING,
        endedAt: null,
      },
    });
    if (!game) return;
    const user = await this.prisma.user_balance.findUnique({
      where: {
        user_id: data.sender_id,
      },
    });
    if (!user) return;
    const bets = await this.prisma.baucuaBet.findMany({
      where: {
        gameId: game.id,
      },
    });
    const betsMap = new Map<string, Bet[]>();
    for (const bet of bets) {
      const userId = bet.userId;
      const userBets = betsMap.get(userId) || [];
      userBets.push({ symbol: bet.symbol as unknown as DiceSymbol, amount: bet.amount });
      betsMap.set(userId, userBets);
    }
    const content = `Kết quả đặt cược: \n` +
      `Bầu 🎃 : ${bets.filter(b => b.symbol === DiceSymbol.GOURD).reduce((acc, b) => acc + b.amount, 0)}\n` +
      `Cua 🦀 : ${bets.filter(b => b.symbol === DiceSymbol.CRAB).reduce((acc, b) => acc + b.amount, 0)}\n` +
      `Gà 🐔 : ${bets.filter(b => b.symbol === DiceSymbol.ROOSTER).reduce((acc, b) => acc + b.amount, 0)}\n` +
      `Nai 🦌 : ${bets.filter(b => b.symbol === DiceSymbol.DEER).reduce((acc, b) => acc + b.amount, 0)}\n` +
      `Tôm 🦐 : ${bets.filter(b => b.symbol === DiceSymbol.SHRIMP).reduce((acc, b) => acc + b.amount, 0)}\n` +
      `Cá 🐟 : ${bets.filter(b => b.symbol === DiceSymbol.FISH).reduce((acc, b) => acc + b.amount, 0)}\n` +
      `-----------------------------------\n` +
      `Người chơi ${user.username} đã đặt cược: \n${bets.filter(b => b.userId === user.user_id).map(b => `${BaucuaMappingName[BaucuaMappingChoiceReverse[b.symbol]]} ${b.amount}`).join('\n')}`;
    this.mezon.sendMessage({
      type: 'channel',
      payload: {
        channel_id: data.channel_id,
        message: {
          type: 'system',
          content: content,
        },
      },
    });
  }

  async handleGameHistory(data: ChannelMessage) {
    // Get total number of finished games
    const totalGames = await this.prisma.baucuaGame.count({
      where: {
        channelId: data.channel_id,
        status: GameStatus.FINISHED,
        endedAt: {
          not: null
        }
      }
    });

    const game = await this.prisma.baucuaGame.findMany({
      where: {
        channelId: data.channel_id,
        status: GameStatus.FINISHED,
        endedAt: {
          not: null
        }
      },
      orderBy: {
        endedAt: 'desc',
      },
      take: 5,
    });

    const result = await this.prisma.baucuaDiceResult.findMany({
      where: {
        gameId: {
          in: game.map(g => g.id),
        },
      },
      orderBy: {
        position: 'asc',
      },
    });

    let content = ``;

    for (let i = 0; i < game.length; i++) {
      const currentGame = game[i];
      if (!currentGame.endedAt) continue;

      const gameResults = result.filter(r => r.gameId === currentGame.id);

      content += `Ván ${totalGames - i}:\n`;
      content += `Kết quả: ${gameResults.map(r =>
        `${BaucuaMappingName[BaucuaMappingChoiceReverse[r.symbol]]} ${this.getSymbolEmoji(r.symbol)}`
      ).join(' | ')}\n`;
      content += `Thời gian: ${currentGame.endedAt.toLocaleString('vi-VN')}\n\n`;
    }

    await this.mezon.sendMessage({
      type: 'channel',
      payload: {
        channel_id: data.channel_id,
        message: {
          type: 'optional',
          content: {
            embed: [
              {
                color: "#BCC0C0",
                title: '📜 LỊCH SỬ 5 VÁN CƯỢC GẦN NHẤT 📜',
                description: content,
              },
            ],
          },
        },
      },
    });
  }
}