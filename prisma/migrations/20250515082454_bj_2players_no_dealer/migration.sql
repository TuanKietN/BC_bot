/*
  Warnings:

  - You are about to drop the column `cost` on the `blackjack_game` table. All the data in the column will be lost.
  - You are about to drop the column `only_for_user_id` on the `blackjack_game` table. All the data in the column will be lost.
  - You are about to drop the column `only_for_user_name` on the `blackjack_game` table. All the data in the column will be lost.
  - You are about to drop the column `user_id_create` on the `blackjack_game` table. All the data in the column will be lost.
  - You are about to drop the column `user_name_create` on the `blackjack_game` table. All the data in the column will be lost.
  - Added the required column `amount` to the `blackjack_game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `game_state1` to the `blackjack_game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `game_state2` to the `blackjack_game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `player1_id` to the `blackjack_game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `player1_status` to the `blackjack_game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `player2_id` to the `blackjack_game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `player2_status` to the `blackjack_game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `turn` to the `blackjack_game` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `blackjack_game` DROP COLUMN `cost`,
    DROP COLUMN `only_for_user_id`,
    DROP COLUMN `only_for_user_name`,
    DROP COLUMN `user_id_create`,
    DROP COLUMN `user_name_create`,
    ADD COLUMN `amount` INTEGER NOT NULL,
    ADD COLUMN `game_state1` VARCHAR(191) NOT NULL,
    ADD COLUMN `game_state2` VARCHAR(191) NOT NULL,
    ADD COLUMN `player1_id` VARCHAR(191) NOT NULL,
    ADD COLUMN `player1_status` ENUM('PLAYING', 'STAND', 'BUST', 'BLACKJACK') NOT NULL,
    ADD COLUMN `player2_id` VARCHAR(191) NOT NULL,
    ADD COLUMN `player2_status` ENUM('PLAYING', 'STAND', 'BUST', 'BLACKJACK') NOT NULL,
    ADD COLUMN `turn` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `transaction_send_logs` MODIFY `note` VARCHAR(191) NOT NULL DEFAULT 'bj';
