-- CreateTable
CREATE TABLE `TaiXiuGame` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `status` VARCHAR(191) NOT NULL,
    `player_id` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `dice1` INTEGER NULL,
    `dice2` INTEGER NULL,
    `dice3` INTEGER NULL,
    `bet_type` VARCHAR(191) NULL,
    `result` VARCHAR(191) NULL,
    `channel_id` VARCHAR(191) NOT NULL,
    `message_id` VARCHAR(191) NOT NULL,
    `clan_id` VARCHAR(191) NOT NULL,
    `is_public_channel` BOOLEAN NOT NULL,
    `mode` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `TaiXiuGame_player_id_idx`(`player_id`),
    INDEX `TaiXiuGame_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
