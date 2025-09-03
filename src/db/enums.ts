export const ETransactionType = {
    DEPOSIT: "DEPOSIT",
    WITHDRAW: "WITHDRAW"
} as const;
export type ETransactionType = (typeof ETransactionType)[keyof typeof ETransactionType];
export const GameStatus = {
    WAITING: "WAITING",
    BETTING: "BETTING",
    ROLLING: "ROLLING",
    FINISHED: "FINISHED",
    CANCELLED: "CANCELLED"
} as const;
export type GameStatus = (typeof GameStatus)[keyof typeof GameStatus];
export const DiceSymbol = {
    FISH: "FISH",
    SHRIMP: "SHRIMP",
    CRAB: "CRAB",
    GOURD: "GOURD",
    ROOSTER: "ROOSTER",
    DEER: "DEER"
} as const;
export type DiceSymbol = (typeof DiceSymbol)[keyof typeof DiceSymbol];
