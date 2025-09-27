import { MigrationInterface, QueryRunner } from "typeorm";

export class InitDb1758979824767 implements MigrationInterface {
    name = '1758979824767';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ================== user_balance ==================
        await queryRunner.query(`
      CREATE TABLE "user_balance" (
        "id" SERIAL PRIMARY KEY,
        "user_id" varchar(191) NOT NULL UNIQUE,
        "username" varchar(255) NOT NULL,
        "balance" int DEFAULT 0,
        "created_at" TIMESTAMP DEFAULT now(),
        "updated_at" TIMESTAMP DEFAULT now()
      );
      CREATE INDEX "idx_user_balance_user_id" ON "user_balance" ("user_id");
    `);

        // ================== transaction_logs ==================
        await queryRunner.query(`
      CREATE TYPE "transaction_type_enum" AS ENUM ('DEPOSIT', 'WITHDRAW');
      CREATE TABLE "transaction_logs" (
        "id" SERIAL PRIMARY KEY,
        "user_id" varchar NOT NULL,
        "amount" int NOT NULL,
        "transactionId" uuid DEFAULT gen_random_uuid(),
        "type" "transaction_type_enum" DEFAULT 'DEPOSIT',
        "created_at" TIMESTAMP DEFAULT now(),
        "updated_at" TIMESTAMP DEFAULT now()
      );
    `);

        // ================== transaction_send_logs ==================
        await queryRunner.query(`
      CREATE TABLE "transaction_send_logs" (
        "id" SERIAL PRIMARY KEY,
        "user_id" varchar NOT NULL,
        "amount" int NOT NULL,
        "to_user_id" varchar NOT NULL,
        "note" varchar DEFAULT 'bj',
        "created_at" TIMESTAMP DEFAULT now(),
        "updated_at" TIMESTAMP DEFAULT now()
      );
    `);

        // ================== BaucuaGame ==================
        await queryRunner.query(`
      CREATE TYPE "game_status_enum" AS ENUM ('WAITING','FINISHED','CANCELLED');
      CREATE TABLE "BaucuaGame" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "channelId" varchar NOT NULL,
        "messageId" varchar NOT NULL,
        "status" "game_status_enum" DEFAULT 'WAITING',
        "createdAt" TIMESTAMP DEFAULT now(),
        "updatedAt" TIMESTAMP DEFAULT now(),
        "startedAt" TIMESTAMP,
        "endedAt" TIMESTAMP,
        "creatorId" varchar NOT NULL
      );
      CREATE INDEX "IDX_BaucuaGame_channelId" ON "BaucuaGame" ("channelId");
      CREATE INDEX "IDX_BaucuaGame_status" ON "BaucuaGame" ("status");
    `);

        // ================== BaucuaBet ==================
        await queryRunner.query(`
      CREATE TYPE "dice_symbol_enum" AS ENUM ('FISH','SHRIMP','CRAB','GOURD','ROOSTER','DEER');
      CREATE TABLE "BaucuaBet" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "gameId" uuid NOT NULL,
        "userId" varchar NOT NULL,
        "symbol" "dice_symbol_enum" NOT NULL,
        "amount" int NOT NULL,
        "createdAt" TIMESTAMP DEFAULT now(),
        CONSTRAINT "FK_BaucuaBet_game" FOREIGN KEY ("gameId") REFERENCES "BaucuaGame" ("id") ON DELETE CASCADE
      );
      CREATE INDEX "IDX_BaucuaBet_gameId_userId" ON "BaucuaBet" ("gameId","userId");
    `);

        // ================== BaucuaDiceResult ==================
        await queryRunner.query(`
      CREATE TABLE "BaucuaDiceResult" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "gameId" uuid NOT NULL,
        "symbol" "dice_symbol_enum" NOT NULL,
        "position" int NOT NULL,
        "createdAt" TIMESTAMP DEFAULT now(),
        CONSTRAINT "FK_BaucuaDiceResult_game" FOREIGN KEY ("gameId") REFERENCES "BaucuaGame" ("id") ON DELETE CASCADE
      );
      CREATE INDEX "IDX_BaucuaDiceResult_gameId" ON "BaucuaDiceResult" ("gameId");
    `);

        // ================== BaucuaWinner ==================
        await queryRunner.query(`
      CREATE TABLE "BaucuaWinner" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "gameId" uuid NOT NULL,
        "userId" varchar NOT NULL,
        "amount" int NOT NULL,
        "createdAt" TIMESTAMP DEFAULT now(),
        CONSTRAINT "FK_BaucuaWinner_game" FOREIGN KEY ("gameId") REFERENCES "BaucuaGame" ("id") ON DELETE CASCADE
      );
      CREATE INDEX "IDX_BaucuaWinner_gameId" ON "BaucuaWinner" ("gameId");
      CREATE INDEX "IDX_BaucuaWinner_userId" ON "BaucuaWinner" ("userId");
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "BaucuaWinner"`);
        await queryRunner.query(`DROP TABLE "BaucuaDiceResult"`);
        await queryRunner.query(`DROP TABLE "BaucuaBet"`);
        await queryRunner.query(`DROP TABLE "BaucuaGame"`);
        await queryRunner.query(`DROP TYPE "game_status_enum"`);
        await queryRunner.query(`DROP TYPE "dice_symbol_enum"`);
        await queryRunner.query(`DROP TABLE "transaction_send_logs"`);
        await queryRunner.query(`DROP TABLE "transaction_logs"`);
        await queryRunner.query(`DROP TYPE "transaction_type_enum"`);
        await queryRunner.query(`DROP TABLE "user_balance"`);
    }
}
