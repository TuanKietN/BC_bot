export const ETransactionType = {
    DEPOSIT: "DEPOSIT",
    WITHDRAW: "WITHDRAW"
} as const;
export type ETransactionType = (typeof ETransactionType)[keyof typeof ETransactionType];
export const EBlackjackGameStatus = {
    PLAYING: "PLAYING",
    ENDED: "ENDED"
} as const;
export type EBlackjackGameStatus = (typeof EBlackjackGameStatus)[keyof typeof EBlackjackGameStatus];
export const EBlackjackCardSuit = {
    SPADES: "SPADES",
    HEARTS: "HEARTS",
    DIAMONDS: "DIAMONDS",
    CLUBS: "CLUBS"
} as const;
export type EBlackjackCardSuit = (typeof EBlackjackCardSuit)[keyof typeof EBlackjackCardSuit];
export const EBlackjackPlayerStatus = {
    PLAYING: "PLAYING",
    STAND: "STAND",
    BUST: "BUST",
    BLACKJACK: "BLACKJACK"
} as const;
export type EBlackjackPlayerStatus = (typeof EBlackjackPlayerStatus)[keyof typeof EBlackjackPlayerStatus];
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
