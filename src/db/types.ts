import type { ColumnType } from "kysely";
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

import type { ETransactionType, EBlackjackGameStatus, EBlackjackCardSuit, EBlackjackPlayerStatus, GameStatus, DiceSymbol } from "./enums";

export type BaucuaBet = {
    id: string;
    gameId: string;
    userId: string;
    symbol: DiceSymbol;
    amount: number;
    createdAt: Generated<Timestamp>;
};
export type BaucuaDiceResult = {
    id: string;
    gameId: string;
    symbol: DiceSymbol;
    position: number;
    createdAt: Generated<Timestamp>;
};
export type BaucuaGame = {
    id: string;
    channelId: string;
    messageId: string;
    status: Generated<GameStatus>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    startedAt: Timestamp | null;
    endedAt: Timestamp | null;
    totalBets: Generated<number>;
    totalAmount: Generated<number>;
};
export type BaucuaPlayerStats = {
    id: string;
    userId: string;
    totalGames: Generated<number>;
    totalBets: Generated<number>;
    totalWins: Generated<number>;
    totalLosses: Generated<number>;
    totalWinnings: Generated<number>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
};
export type BaucuaWinner = {
    id: string;
    gameId: string;
    userId: string;
    amount: number;
    createdAt: Generated<Timestamp>;
};
export type blackjack_game = {
    id: Generated<number>;
    status: EBlackjackGameStatus;
    player1_id: string;
    player2_id: string;
    amount: number;
    game_state1: string;
    game_state2: string;
    player1_status: EBlackjackPlayerStatus;
    player2_status: EBlackjackPlayerStatus;
    turn: string;
    channel_id: string;
    message_id: string;
    clan_id: string;
    is_public_channel: number;
    mode: string;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type blackjack_game_logs = {
    id: Generated<number>;
    game_id: number;
    user_id: string;
    cards: string;
    player_status: EBlackjackPlayerStatus;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type message_logs = {
    id: Generated<number>;
    message_id: string;
    sender_avatar: string;
    sender_name: string;
    sender_id: string;
    sender_username: string;
    content: unknown;
    created_at: Generated<Timestamp>;
    channel_id: string;
    clan_id: string;
    clan_avatar: string;
    clan_name: string;
    clan_username: string;
    channel_label: Generated<string>;
    display_name: Generated<string>;
};
export type tai_xiu_game = {
    id: Generated<number>;
    status: string;
    player_id: string;
    amount: number;
    dice1: number | null;
    dice2: number | null;
    dice3: number | null;
    bet_type: string | null;
    result: string | null;
    channel_id: string;
    message_id: string;
    clan_id: string;
    is_public_channel: number;
    mode: string;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type tai_xiu_game_logs = {
    id: Generated<number>;
    game_id: number;
    user_id: string;
    dice1: number;
    dice2: number;
    dice3: number;
    total: number;
    bet_type: string;
    result: string;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type timesheet_token = {
    id: Generated<number>;
    user_id: string;
    token: string;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
    expires_at: Timestamp;
};
export type transaction_logs = {
    id: Generated<number>;
    user_id: string;
    amount: number;
    transaction_id: string;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
    type: Generated<ETransactionType>;
};
export type transaction_send_logs = {
    id: Generated<number>;
    user_id: string;
    amount: number;
    to_user_id: string;
    note: Generated<string>;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type user_balance = {
    id: Generated<number>;
    user_id: string;
    username: string;
    balance: Generated<number>;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type DB = {
    BaucuaBet: BaucuaBet;
    BaucuaDiceResult: BaucuaDiceResult;
    BaucuaGame: BaucuaGame;
    BaucuaPlayerStats: BaucuaPlayerStats;
    BaucuaWinner: BaucuaWinner;
    blackjack_game: blackjack_game;
    blackjack_game_logs: blackjack_game_logs;
    message_logs: message_logs;
    tai_xiu_game: tai_xiu_game;
    tai_xiu_game_logs: tai_xiu_game_logs;
    timesheet_token: timesheet_token;
    transaction_logs: transaction_logs;
    transaction_send_logs: transaction_send_logs;
    user_balance: user_balance;
};
