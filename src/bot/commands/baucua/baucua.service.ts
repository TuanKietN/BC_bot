import { user_balance } from './../../../db/types';
import { Injectable, Logger } from "@nestjs/common";
import {
  ChannelMessage,
  EButtonMessageStyle,
  EMessageComponentType,
} from "mezon-sdk";
import { MezonService } from "../../../mezon/mezon.service";
import { MessageButtonClickedEvent } from "../topup/types";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In, Not, IsNull } from "typeorm";
import { BaucuaGame } from "../../models/baucua-game.entity";
import { BaucuaBet } from "../../models/baucua-bet.entity";
import { BaucuaDiceResult } from "../../models/baucua-dice-result.entity";
import { UserBalance } from "../../models/user-balance.entity";
import { DiceSymbol, GameStatus } from "../../../common/enums/bot.enum";
import { BauCuaSelect } from "../../../common/component/BauCuaSelect";

export const BaucuaMappingChoice = {
  6: "FISH",
  5: "SHRIMP",
  2: "CRAB",
  1: "GOURD",
  3: "ROOSTER",
  4: "DEER",
};

export const BaucuaMappingChoiceReverse = {
  FISH: 6,
  SHRIMP: 5,
  CRAB: 2,
  GOURD: 1,
  ROOSTER: 3,
  DEER: 4,
};

export const BaucuaMappingName = {
  1: "Bầu",
  2: "Cua",
  3: "Gà",
  4: "Nai",
  5: "Tôm",
  6: "Cá",
};

export const MappingPic = {
  DEER: "1.png",
  GOURD: "3.png",
  ROOSTER: "2.png",
  FISH: "4.png",
  CRAB: "5.png",
  SHRIMP: "6.png",
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
      const randomSym =
        allSymbols[Math.floor(Math.random() * allSymbols.length)];
      reel.push(MappingPic[randomSym]);
    }
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
  private gameTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private userChoices: Map<string, string> = new Map();

  constructor(
    private readonly mezon: MezonService,
    @InjectRepository(BaucuaGame)
    private readonly gameRepo: Repository<BaucuaGame>,
    @InjectRepository(BaucuaBet)
    private readonly betRepo: Repository<BaucuaBet>,
    @InjectRepository(BaucuaDiceResult)
    private readonly diceRepo: Repository<BaucuaDiceResult>,
    @InjectRepository(UserBalance)
    private readonly userBalanceRepo: Repository<UserBalance>
  ) { }

  /** Khởi tạo game */
  async createBaucua(message: ChannelMessage) {
    const existingGame = await this.gameRepo.findOne({
      where: {
        channelId: message.channel_id,
        status: GameStatus.WAITING,
        endedAt: IsNull(),
        creatorId: message.sender_id,
      },
    });

    if (existingGame) {
      await this.mezon.sendMessage({
        type: "channel",
        payload: {
          channel_id: message.channel_id,
          message: { type: "system", content: "Bạn đã có 1 ván cược đang chờ kết thúc!" },
        },
      });
      return;
    }

    const response = await this.mezon.sendMessage({
      type: "channel",
      payload: {
        channel_id: message.channel_id,
        message: {
          type: "optional",
          content: {
            embed: [
              {
                color: "#BCC0C0",
                title: " BẦU CUA TÔM CÁ ",
                description: "Chọn cửa cược và số tiền để tham gia",
              },
            ],
            components: [
              { components: [BauCuaSelect] },
              {
                components: [
                  {
                    id: "5000",
                    type: EMessageComponentType.BUTTON,
                    component: {
                      label: "5000",
                      style: EButtonMessageStyle.SECONDARY,
                    },
                  },
                  {
                    id: "10000",
                    type: EMessageComponentType.BUTTON,
                    component: {
                      label: "10000",
                      style: EButtonMessageStyle.PRIMARY,
                    },
                  },
                  {
                    id: "20000",
                    type: EMessageComponentType.BUTTON,
                    component: {
                      label: "20000",
                      style: EButtonMessageStyle.SUCCESS,
                    },
                  },
                  {
                    id: "50000",
                    type: EMessageComponentType.BUTTON,
                    component: {
                      label: "50000",
                      style: EButtonMessageStyle.DANGER,
                    },
                  },
                ],
              },
            ],
          },
        },
      },
    });

    const newGame = this.gameRepo.create({
      channelId: message.channel_id,
      messageId: response.message_id,
      status: GameStatus.WAITING,
      creatorId: message.sender_id,
    });
    await this.gameRepo.save(newGame);
  }

  /** xử lý chọn cửa */
  async handleSelectChoice(userId: string, value: string, channelId: string) {
    const game = await this.gameRepo.findOne({
      where: { channelId, status: GameStatus.WAITING, endedAt: IsNull(), creatorId: userId },
      order: { startedAt: "DESC" },
    });
    if (!game) return;

    if (game.creatorId !== userId) return;

    const key = `${userId}_${channelId}`;
    this.userChoices.set(key, value);

    await this.mezon.sendMessage({
      type: "channel",
      payload: {
        channel_id: channelId,
        message: {
          type: "system",
          content: `👉 Bạn đã chọn cửa: ${BaucuaMappingName[parseInt(value)]
            }`,
        },
      },
    });
  }

  /** xử lý đặt tiền */
  async handleButtonClicked(data: MessageButtonClickedEvent) {
    const { button_id, user_id, channel_id } = data;
    const betAmount = parseInt(button_id, 10);

    const user = await this.ensureUserBalance(user_id);
    if (user.balance < betAmount) return;

    const choice = this.userChoices.get(`${user_id}_${channel_id}`);
    if (!choice) return;

    const game = await this.gameRepo.findOne({
      where: { channelId: channel_id, status: GameStatus.WAITING, endedAt: IsNull(), creatorId: user_id },
    });
    if (!game) return;

    // lưu cược
    await this.betRepo.save(
      this.betRepo.create({
        gameId: game.id,
        userId: user_id,
        symbol: BaucuaMappingChoice[parseInt(choice)],
        amount: betAmount,
      })
    );

    // trừ tiền
    await this.userBalanceRepo.decrement({ user_id }, "balance", betAmount);

    // đếm ngược
    if (!game.startedAt) {
      await this.gameRepo.update(game.id, { startedAt: new Date() });

      for (let i = 5; i > 0; i--) {
        setTimeout(async () => {
          await this.mezon.updateMessage({
            channel_id: game.channelId,
            message_id: game.messageId,
            content: {
              type: "optional",
              content: {
                embed: [
                  {
                    color: "#BCC0C0",
                    title: " BẦU CUA BẮT ĐẦU ",
                    description: `⏳ Còn ${i} giây để quay...`,
                  },
                ],
              },
            },
          });
        }, (5 - i) * 1000);
      }

      const timeout = setTimeout(() => this.rollDiceAndPayout(game.id), 5000);
      this.gameTimeouts.set(game.id, timeout);
    }
  }

  /** hiển thị kết quả đặt cược */
  async handleBetResult(data: ChannelMessage) {
    const user = await this.ensureUserBalance(
      data.sender_id,
      data.username,
      data.display_name
    );

    const game = await this.gameRepo.findOne({
      where: { channelId: data.channel_id, status: GameStatus.WAITING, endedAt: IsNull() },
      relations: ["bets"],
    });
    if (!game) return;

    const user_balance = await this.userBalanceRepo.findOne({
      where: { user_id: data.sender_id },
    });
    if (!user_balance) return;

    const bets = game.bets;
    const content =
      `Kết quả đặt cược: \n` +
      `Bầu 🎃 : ${bets
        .filter((b) => b.symbol === DiceSymbol.GOURD)
        .reduce((acc, b) => acc + b.amount, 0)}\n` +
      `Cua 🦀 : ${bets
        .filter((b) => b.symbol === DiceSymbol.CRAB)
        .reduce((acc, b) => acc + b.amount, 0)}\n` +
      `Gà 🐔 : ${bets
        .filter((b) => b.symbol === DiceSymbol.ROOSTER)
        .reduce((acc, b) => acc + b.amount, 0)}\n` +
      `Nai 🦌 : ${bets
        .filter((b) => b.symbol === DiceSymbol.DEER)
        .reduce((acc, b) => acc + b.amount, 0)}\n` +
      `Tôm 🦐 : ${bets
        .filter((b) => b.symbol === DiceSymbol.SHRIMP)
        .reduce((acc, b) => acc + b.amount, 0)}\n` +
      `Cá 🐟 : ${bets
        .filter((b) => b.symbol === DiceSymbol.FISH)
        .reduce((acc, b) => acc + b.amount, 0)}\n` +
      `-----------------------------------\n` +
      `Người chơi ${user.username} đã đặt cược: \n${bets
        .filter((b) => b.userId === user.user_id)
        .map(
          (b) =>
            `${BaucuaMappingName[BaucuaMappingChoiceReverse[b.symbol]]} ${b.amount
            }`
        )
        .join("\n")}`;

    await this.mezon.sendMessage({
      type: "channel",
      payload: { channel_id: data.channel_id, message: { type: "system", content } },
    });
  }

  /** lịch sử 5 ván gần nhất */
  async handleGameHistory(data: ChannelMessage) {
    const totalGames = await this.gameRepo.count({
      where: { channelId: data.channel_id, status: GameStatus.FINISHED, endedAt: Not(IsNull()) },
    });

    const games = await this.gameRepo.find({
      where: { channelId: data.channel_id, status: GameStatus.FINISHED, endedAt: Not(IsNull()) },
      order: { endedAt: "DESC" },
      take: 5,
    });

    const results = await this.diceRepo.find({
      where: { gameId: In(games.map((g) => g.id)) },
      order: { position: "ASC" },
    });

    let content = "";
    for (let i = 0; i < games.length; i++) {
      const g = games[i];
      const gameResults = results.filter((r) => r.gameId === g.id);
      content += `Ván ${totalGames - i}:\n`;
      content += `Kết quả: ${gameResults
        .map(
          (r) =>
            `${BaucuaMappingName[BaucuaMappingChoiceReverse[r.symbol]]} ${this.getSymbolEmoji(r.symbol)}`
        )
        .join(" | ")}\n`;
      content += `Thời gian: ${g.endedAt!.toLocaleString("vi-VN")}\n\n`;
    }

    await this.mezon.sendMessage({
      type: "channel",
      payload: {
        channel_id: data.channel_id,
        message: {
          type: "optional",
          content: { embed: [{ title: "📜 LỊCH SỬ 5 VÁN CƯỢC GẦN NHẤT 📜", description: content }] },
        },
      },
    });
  }

  /** random dice */
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
      [DiceSymbol.FISH]: "🐟",
      [DiceSymbol.SHRIMP]: "🦐",
      [DiceSymbol.CRAB]: "🦀",
      [DiceSymbol.GOURD]: "🎃",
      [DiceSymbol.ROOSTER]: "🐔",
      [DiceSymbol.DEER]: "🦌",
    };
    return emojiMap[symbol];
  }

  /** xử lý kết quả quay và trả thưởng */
  private async rollDiceAndPayout(gameId: string) {
    const game = await this.gameRepo.findOne({
      where: { id: gameId },
      relations: ["bets"],
    });
    if (!game || game.status !== GameStatus.WAITING) return;

    const timeout = this.gameTimeouts.get(gameId);
    if (timeout) {
      clearTimeout(timeout);
      this.gameTimeouts.delete(gameId);
    }

    const diceResults = this.generateDiceResults();
    for (let i = 0; i < diceResults.length; i++) {
      await this.diceRepo.save(
        this.diceRepo.create({ gameId, symbol: diceResults[i], position: i + 1 })
      );
    }

    const symbolCount = new Map<DiceSymbol, number>();
    diceResults.forEach((s) =>
      symbolCount.set(s, (symbolCount.get(s) || 0) + 1)
    );

    const winnings = new Map<string, number>();
    for (const bet of game.bets) {
      const count = symbolCount.get(bet.symbol) || 0;
      if (count > 0) {
        const winAmount = bet.amount + bet.amount * count;
        winnings.set(bet.userId, (winnings.get(bet.userId) || 0) + winAmount);
      }
    }

    const pool = generateBauCuaPool(diceResults);
    await this.mezon.updateMessage({
      channel_id: game.channelId,
      message_id: game.messageId,
      content: {
        type: "optional",
        content: {
          embed: [
            {
              title: " BẦU CUA ĐANG QUAY ",
              description: "Đang quay kết quả...",
              fields: [
                {
                  name: "",
                  value: "",
                  inputs: {
                    id: `baucua`,
                    type: EMessageComponentType.ANIMATION,
                    component: {
                      url_image:
                        "https://cdn.mezon.ai/1840702095641022464/1840702095661993984/1783440675396653000/1757515585389_baucua.png",
                      url_position:
                        "https://cdn.mezon.ai/1840702095641022464/1840702095661993984/1840674320150433800/1757515675145_1757138049982_baucua.json",
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

    setTimeout(async () => {
      let resultMessage =
        "Xúc xắc: " +
        diceResults.map((s) => this.getSymbolEmoji(s)).join(" ") +
        "\n\n";
      if (winnings.size > 0) {
        resultMessage += `Người thắng:\n`;
        for (const [userId, amount] of winnings) {
          const user = await this.userBalanceRepo.findOne({
            where: { user_id: userId },
          });
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
          type: "optional",
          content: {
            embed: [
              {
                title: " KẾT QUẢ BẦU CUA ",
                description: "Game đã kết thúc!\n\n" + resultMessage,
                fields: [
                  {
                    name: "",
                    value: "",
                    inputs: {
                      id: `baucua`,
                      type: EMessageComponentType.ANIMATION,
                      component: {
                        url_image:
                          "https://cdn.mezon.ai/1840702095641022464/1840702095661993984/1783440675396653000/1757515585389_baucua.png",
                        url_position:
                          "https://cdn.mezon.ai/1840702095641022464/1840702095661993984/1840674320150433800/1757515675145_1757138049982_baucua.json",
                        pool: finalPool,
                        repeat: 1,
                        duration: 0,
                      },
                    },
                  },
                ] as any,
              },
            ],
          },
        },
      });

      for (const [userId, amount] of winnings) {
        await this.userBalanceRepo.increment(
          { user_id: userId },
          "balance",
          amount
        );
      }

      await this.gameRepo.update(gameId, {
        status: GameStatus.FINISHED,
        endedAt: new Date(),
      });
    }, 5000);
  }

  /** Tìm hoặc tạo user balance */
  async ensureUserBalance(userId: string, username?: string, displayName?: string) {
    let user = await this.userBalanceRepo.findOne({ where: { user_id: userId } });

    const finalName = username ?? displayName ?? `User-${userId}`;

    if (!user) {
      user = this.userBalanceRepo.create({
        user_id: userId,
        username: finalName,
        balance: 0,
      });
      await this.userBalanceRepo.save(user);
    } else if (finalName && user.username !== finalName) {
      user.username = finalName;
      await this.userBalanceRepo.save(user);
    }
    return user;
  }
}
