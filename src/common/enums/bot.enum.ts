export const COMMAND_PREFIX = ['*'];

export enum GameStatus {
   WAITING = 'WAITING',
   BETTING = 'BETTING',
   ROLLING = 'ROLLING',
   FINISHED = 'FINISHED',
   CANCELLED = 'CANCELLED',
}

export enum DiceSymbol {
   FISH = 'FISH',
   SHRIMP = 'SHRIMP',
   CRAB = 'CRAB',
   GOURD = 'GOURD',
   ROOSTER = 'ROOSTER',
   DEER = 'DEER',
}
