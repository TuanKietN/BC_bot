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
  "DEER": 0,
  "GOURD": 1,
  "ROOSTER": 2,
  "FISH": 3,
  "CRAB": 4,
  "SHRIMP": 5,

}
export interface Bet {
  symbol: DiceSymbol;
  amount: number;
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

    // Check if game already exists
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
    // Create game message with betting options
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
                title: '🎲 BẦU CUA TÔM CÁ 🎲\n          Sẽ mở sau 1 phút',
                description: 'Chọn cửa cược và số tiền để tham gia'
              }
            ],
            components: [
                { components: [BauCuaSelect] },
                {
                  components: [
                    {
                      id: '5000',
                      type: EMessageComponentType.BUTTON,
                      component: {
                        label: '5000',
                        style: EButtonMessageStyle.SECONDARY,
                      },
                    },
                    {
                      id: '10000',
                      type: EMessageComponentType.BUTTON,
                      component: {
                        label: '10000',
                        style: EButtonMessageStyle.PRIMARY,
                      },
                    },
                    {
                      id: '20000',
                      type: EMessageComponentType.BUTTON,
                      component: {
                        label: '20000',
                        style: EButtonMessageStyle.SUCCESS,
                      },
                    },
                    {
                      id: '50000',
                      type: EMessageComponentType.BUTTON,
                      component: {
                        label: '50000',
                        style: EButtonMessageStyle.DANGER,
                      },
                    }
                  ]
                }
              ],
          },
        },
      },
    });
    const game = await this.prisma.baucuaGame.create({
      data: {
        id: gameId,
        channelId: message.channel_id,
        messageId: response.message_id,
        status: GameStatus.WAITING,
        startedAt: new Date(),
      },
    });
    if (response?.message_id) {
      // Update game with message ID
      await this.prisma.baucuaGame.update({
        where: { id: gameId },
        data: { messageId: response.message_id },
      });

      // Set timeout for auto-roll after 1 minute
      const timeout = setTimeout(() => this.rollDiceAndPayout(gameId), 30000);
      this.gameTimeouts.set(gameId, timeout);
    }
  }

  private async rollDiceAndPayout(gameId: string) {
    const game = await this.prisma.baucuaGame.findUnique({
      where: { id: gameId },
      include: {
        bets: true,
      },
    });

    if (!game || game.status !== GameStatus.WAITING) return;

    // Clear timeout
    const timeout = this.gameTimeouts.get(gameId);
    if (timeout) {
      clearTimeout(timeout);
      this.gameTimeouts.delete(gameId);
    }

    // Check bot balance
    const botBalance = await this.prisma.user_balance.findUnique({
      where: { user_id: '1840686507887693824' },
    });

    let diceResults: DiceSymbol[];
    if (botBalance && botBalance.balance < game.bets.reduce((sum, bet) => sum + bet.amount, 0)) {
      // If bot balance is low, calculate result to ensure profit
      const totalBets = game.bets.reduce((sum, bet) => sum + bet.amount, 0);
      const betsBySymbol = new Map<DiceSymbol, number>();
      betsBySymbol.set(DiceSymbol.FISH, 0);
      betsBySymbol.set(DiceSymbol.SHRIMP, 0);
      betsBySymbol.set(DiceSymbol.CRAB, 0);
      betsBySymbol.set(DiceSymbol.GOURD, 0);
      betsBySymbol.set(DiceSymbol.ROOSTER, 0);
      betsBySymbol.set(DiceSymbol.DEER, 0);
      // Calculate total bets per symbol
      for (const bet of game.bets) {
        betsBySymbol.set(bet.symbol, (betsBySymbol.get(bet.symbol) || 0) + bet.amount);
      }

      // Find symbol with lowest bet amount
      let top3lowestBetSymbol: DiceSymbol[] = [];
      for (const [symbol, amount] of betsBySymbol) {
        top3lowestBetSymbol.push(symbol);
      }
      top3lowestBetSymbol.sort((a, b) => (betsBySymbol.get(a) || 0) - (betsBySymbol.get(b) || 0));
      // Use symbol with lowest bet as result
      console.log(top3lowestBetSymbol);
      if (top3lowestBetSymbol.length > 0) {
        const dice1 = Math.floor(Math.random() * 3);
        const dice2 = Math.floor(Math.random() * 3);
        const dice3 = Math.floor(Math.random() * 3);
        diceResults = [top3lowestBetSymbol[dice1], top3lowestBetSymbol[dice2], top3lowestBetSymbol[dice3]];
      } else {
        diceResults = this.generateDiceResults();
      }
    } else {
      // Normal dice roll
      diceResults = this.generateDiceResults();
    }

    const symbolCount = new Map<DiceSymbol, number>();
    for (const symbol of diceResults) {
      symbolCount.set(symbol, (symbolCount.get(symbol) || 0) + 1);
    }

    // Save dice results
    for (let i = 0; i < diceResults.length; i++) {
      await this.prisma.baucuaDiceResult.create({
        data: {
          gameId,
          symbol: diceResults[i],
          position: i + 1,
        },
      });
    }

    // Calculate winnings
    const winnings = new Map<string, number>();
    for (const bet of game.bets) {
      const count = symbolCount.get(bet.symbol) || 0;
      if (count > 0) {
        // Win amount = bet amount + (bet amount * occurrences)
        const winAmount = bet.amount + (bet.amount * count);
        winnings.set(bet.userId, (winnings.get(bet.userId) || 0) + winAmount);
      }
    }

    // Update player balances and stats
    for (const [userId, amount] of winnings) {
      // Update balance
      await this.prisma.user_balance.update({
        where: { user_id: userId },
        data: { balance: { increment: amount } },
      });

      // Create winner record
      await this.prisma.baucuaWinner.create({
        data: {
          gameId,
          userId,
          amount,
        },
      });

      // Update player stats
      await this.prisma.baucuaPlayerStats.upsert({
        where: { userId },
        create: {
          userId,
          totalGames: 1,
          totalBets: 1,
          totalWins: 1,
          totalWinnings: amount,
        },
        update: {
          totalGames: { increment: 1 },
          totalBets: { increment: 1 },
          totalWins: { increment: 1 },
          totalWinnings: { increment: amount },
        },
      });
    }

    // Calculate total bets and winnings
    const totalBets = game.bets.reduce((sum, bet) => sum + bet.amount, 0);
    const totalWinnings = Array.from(winnings.values()).reduce((sum, amount) => sum + amount, 0);
    const botProfit = totalBets - totalWinnings;

    // Update bot balance with profit
    if (botProfit > 0) {
      await this.prisma.user_balance.update({
        where: { user_id: '1840686507887693824' },
        data: { balance: { increment: botProfit } },
      });
    } else {
      await this.prisma.user_balance.update({
        where: { user_id: '1840686507887693824' },
        data: { balance: { decrement: Math.abs(botProfit) } },
      });
    }

    // Update game status
    await this.prisma.baucuaGame.update({
      where: { id: gameId },
      data: {
        status: GameStatus.FINISHED,
        endedAt: new Date(),
      },
    });

    // Send results message
    let resultMessage = ``;
    resultMessage += `Xúc xắc: ${diceResults.map(s => this.getSymbolEmoji(s)).join(' ')}\n\n`;

    if (winnings.size > 0) {
      resultMessage += `Người thắng:\n`;
      for (const [userId, amount] of winnings) {
        const user = await this.prisma.user_balance.findUnique({
          where: {
            user_id: userId,
          },
        });
        if (!user) continue;
        resultMessage += `${user.username}: +${amount} đ\n`;
      }
    } else {
      resultMessage += `Không có người thắng!\n`;
    }

    await this.mezon.sendMessage({
      type: 'channel',
      payload: {
        channel_id: game.channelId,
        message: {
          type: 'optional',
          content: {
            embed: [
              {
                color: "#BCC0C0",
                title: '🎲 KẾT QUẢ BẦU CUA 🎲',
                description: resultMessage
              }
            ],
            components: [
              {
                components: [
                  {
                    id: "Slots",
                    type: EMessageComponentType.ANIMATION,
                    component: {
                      url_image: "https://jaxx1911.github.io/GoldMiner/abcd.png",
                      url_position: "https://jaxx1911.github.io/GoldMiner/abcd.json",
                      pool: [
                        [
                          `1-${MappingPic[diceResults[0]]}.png`,
                          `1-${MappingPic[diceResults[0]]}.png`,
                          `1-${MappingPic[diceResults[0]]}.png`
                        ],
                        [
                          `1-${MappingPic[diceResults[1]]}.png`,
                          `1-${MappingPic[diceResults[1]]}.png`,
                          `1-${MappingPic[diceResults[1]]}.png`
                        ],
                        [
                          `1-${MappingPic[diceResults[2]]}.png`,
                          `1-${MappingPic[diceResults[2]]}.png`,
                          `1-${MappingPic[diceResults[2]]}.png`
                        ]
                      ]
                    }
                  }
                ]
              }
            ]
          }
        }
      }
    });

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
              description: 'Game đã kết thúc! \n\n' + resultMessage,
            },
          ],
        },
      },
    });
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

  async handleButtonClicked(data: MessageButtonClickedEvent) {
    console.log(data);
    const { message_id, button_id, sender_id, extra_data, user_id } = data;
    const userBalance = await this.prisma.user_balance.findUnique({
      where: {
        user_id: user_id,
      },
    });
    if (!userBalance) { return; }
    if (userBalance.balance < parseInt(button_id)) {
      await this.mezon.sendMessage({
        type: 'channel',
        payload: {
          channel_id: data.channel_id,
          message: {
            type: 'system',
            content: `Bạn ${userBalance.username} không có đủ tiền để đặt cược!`,
          },
        },
      });
      return;
    }
    const game = await this.prisma.baucuaGame.findFirst({
      where: {
        channelId: data.channel_id,
        status: GameStatus.WAITING,
        endedAt: null,
      },
    });
    if (!game) return;

    const userId = user_id;
    const jsonString = extra_data;
    const parsed = JSON.parse(jsonString);
    const value = parsed.BauCua[0];
    await this.prisma.baucuaBet.create({
      data: {
        gameId: game.id,
        userId: userId,
        symbol: BaucuaMappingChoice[parseInt(value)],
        amount: parseInt(button_id),
      },
    });
    await this.prisma.user_balance.update({
      where: {
        user_id: userId,
      },
      data: {
        balance: userBalance.balance - parseInt(button_id),
      },
    });
    const noti = `Người chơi ${userBalance.username} đã đặt cược: ${BaucuaMappingName[parseInt(value)]} ${parseInt(button_id)}`
    await this.mezon.updateMessage({
      channel_id: data.channel_id,
      message_id: game.messageId,
      content: {
        type: 'optional',
        content: {
          embed: [
            {
              color: "#BCC0C0",
              title: '🎲 BẦU CUA TÔM CÁ 🎲\n\t          Sẽ mở sau 1 phút',
              description: noti
            }
          ],
          components: [
            {
              components: [
                {
                  id: "BauCua",
                  type: EMessageComponentType.RADIO,
                  component: [
                    { label: "🎃 Bầu", value: "1", style: 3 },
                    { label: "🦀 Cua", value: "2", style: 3 },
                    { label: "🐔 Gà", value: "3", style: 3 },
                    { label: "🦌 Nai", value: "4", style: 3 },
                    { label: "🦐 Tôm", value: "5", style: 3 },
                    { label: "🐟 Cá", value: "6", style: 3 }
                  ]
                }
              ]
            },
            {
              components: [
                {
                  id: "Slots",
                  type: EMessageComponentType.ANIMATION,
                  component: {
                    url_image: "https://jaxx1911.github.io/GoldMiner/abcd.png",
                    url_position: "https://jaxx1911.github.io/GoldMiner/abcd.json",
                    pool: [
                      ["1-0.png", "1-1.png", "1-2.png", "1-3.png", "1-4.png", "1-5.png"],
                      ["1-1.png", "1-2.png", "1-3.png", "1-4.png", "1-5.png", "1-0.png"],
                      ["1-2.png", "1-3.png", "1-4.png", "1-5.png", "1-0.png", "1-1.png"]
                    ],
                    duration: 0.5
                  }
                }
              ]
            },
            {
              components: [
                {
                  id: '5000',
                  type: EMessageComponentType.BUTTON,
                  component: { label: '5000', style: EButtonMessageStyle.SECONDARY },
                },
                {
                  id: '10000',
                  type: EMessageComponentType.BUTTON,
                  component: { label: '10000', style: EButtonMessageStyle.PRIMARY },
                },
                {
                  id: '20000',
                  type: EMessageComponentType.BUTTON,
                  component: { label: '20000', style: EButtonMessageStyle.SUCCESS },
                },
                {
                  id: '50000',
                  type: EMessageComponentType.BUTTON,
                  component: { label: '50000', style: EButtonMessageStyle.DANGER },
                }
              ]
            }
          ]
        }
      }
    });
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
