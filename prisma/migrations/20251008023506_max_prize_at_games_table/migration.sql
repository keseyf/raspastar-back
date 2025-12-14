/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Game" ADD COLUMN     "maxPrize" DOUBLE PRECISION NOT NULL DEFAULT 2500;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");
