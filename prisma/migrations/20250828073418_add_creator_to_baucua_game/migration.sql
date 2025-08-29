/*
  Warnings:

  - Added the required column `creatorId` to the `BaucuaGame` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `BaucuaGame` ADD COLUMN `creatorId` VARCHAR(191) NOT NULL;
