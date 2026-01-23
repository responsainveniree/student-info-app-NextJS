/*
  Warnings:

  - You are about to drop the column `homeroomTeacherId` on the `Student` table. All the data in the column will be lost.
  - Added the required column `homeroomClassId` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_homeroomTeacherId_fkey";

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "homeroomTeacherId",
ADD COLUMN     "homeroomClassId" INTEGER NOT NULL,
ADD COLUMN     "teacherId" TEXT;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_homeroomClassId_fkey" FOREIGN KEY ("homeroomClassId") REFERENCES "HomeroomClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
