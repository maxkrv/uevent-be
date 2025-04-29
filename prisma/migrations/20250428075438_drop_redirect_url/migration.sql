/*
  Warnings:

  - You are about to drop the column `redirect_url` on the `events` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "events" DROP COLUMN "redirect_url";
