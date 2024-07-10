/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `UserProfile` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Subscription` ADD COLUMN `active` BOOLEAN NOT NULL DEFAULT true,
    MODIFY `teamId` VARCHAR(191) NOT NULL,
    MODIFY `leagueId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `UserProfile_email_key` ON `UserProfile`(`email`);
