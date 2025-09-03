import type { ColumnType } from "kysely";
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

import type { ETransactionType, GameStatus, DiceSymbol } from "./enums";

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
    creatorId: string;
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
    message_logs: message_logs;
    timesheet_token: timesheet_token;
    transaction_logs: transaction_logs;
    transaction_send_logs: transaction_send_logs;
    user_balance: user_balance;
};
