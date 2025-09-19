-- CreateTable
CREATE TABLE `BaucuaGame` (
    `id` VARCHAR(191) NOT NULL,
    `channelId` VARCHAR(191) NOT NULL,
    `messageId` VARCHAR(191) NOT NULL,
    `status` ENUM('WAITING', 'BETTING', 'ROLLING', 'FINISHED', 'CANCELLED') NOT NULL DEFAULT 'WAITING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `startedAt` DATETIME(3) NULL,
    `endedAt` DATETIME(3) NULL,
    `totalBets` INTEGER NOT NULL DEFAULT 0,
    `totalAmount` INTEGER NOT NULL DEFAULT 0,

    INDEX `BaucuaGame_channelId_idx`(`channelId`),
    INDEX `BaucuaGame_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BaucuaDiceResult` (
    `id` VARCHAR(191) NOT NULL,
    `gameId` VARCHAR(191) NOT NULL,
    `symbol` ENUM('FISH', 'SHRIMP', 'CRAB', 'GOURD', 'ROOSTER', 'DEER') NOT NULL,
    `position` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `BaucuaDiceResult_gameId_idx`(`gameId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BaucuaBet` (
    `id` VARCHAR(191) NOT NULL,
    `gameId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `symbol` ENUM('FISH', 'SHRIMP', 'CRAB', 'GOURD', 'ROOSTER', 'DEER') NOT NULL,
    `amount` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `BaucuaBet_gameId_idx`(`gameId`),
    INDEX `BaucuaBet_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BaucuaWinner` (
    `id` VARCHAR(191) NOT NULL,
    `gameId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `BaucuaWinner_gameId_idx`(`gameId`),
    INDEX `BaucuaWinner_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BaucuaPlayerStats` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `totalGames` INTEGER NOT NULL DEFAULT 0,
    `totalBets` INTEGER NOT NULL DEFAULT 0,
    `totalWins` INTEGER NOT NULL DEFAULT 0,
    `totalLosses` INTEGER NOT NULL DEFAULT 0,
    `totalWinnings` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `BaucuaPlayerStats_userId_key`(`userId`),
    INDEX `BaucuaPlayerStats_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
