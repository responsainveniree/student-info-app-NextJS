/*
  Warnings:

  - You are about to drop the column `submittedAt` on the `MarkDescription` table. All the data in the column will be lost.
  - Added the required column `detail` to the `MarkDescription` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Mark" ALTER COLUMN "number" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "MarkDescription" DROP COLUMN "submittedAt",
ADD COLUMN     "detail" TEXT NOT NULL;
