/*
  Warnings:

  - Added the required column `expiresAt` to the `invitation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."invitation" ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "usedAt" TIMESTAMP(3),
ADD COLUMN     "usedById" TEXT;

-- AddForeignKey
ALTER TABLE "public"."invitation" ADD CONSTRAINT "invitation_usedById_fkey" FOREIGN KEY ("usedById") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
