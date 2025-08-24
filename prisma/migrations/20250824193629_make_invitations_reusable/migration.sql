/*
  Warnings:

  - You are about to drop the column `expiresAt` on the `invitation` table. All the data in the column will be lost.
  - You are about to drop the column `usedAt` on the `invitation` table. All the data in the column will be lost.
  - You are about to drop the column `usedById` on the `invitation` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `invitation` DROP FOREIGN KEY `invitation_usedById_fkey`;

-- DropIndex
DROP INDEX `invitation_usedById_fkey` ON `invitation`;

-- AlterTable
ALTER TABLE `invitation` DROP COLUMN `expiresAt`,
    DROP COLUMN `usedAt`,
    DROP COLUMN `usedById`;
