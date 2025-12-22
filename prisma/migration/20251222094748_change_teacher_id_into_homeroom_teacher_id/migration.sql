/*
  Warnings:

  - You are about to drop the column `teacherId` on the `Student` table. All the data in the column will be lost.
  - Made the column `classNumber` on table `HomeroomClass` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `homeroomTeacherId` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Made the column `classNumber` on table `Student` required. This step will fail if there are existing NULL values in that column.
  - Made the column `classNumber` on table `TeachingAssignment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `classNumber` on table `TeachingClass` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
ALTER TYPE "StudentRole" ADD VALUE 'classSecretary';

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_teacherId_fkey";

-- DropIndex
DROP INDEX "Teacher_name_key";

-- AlterTable
ALTER TABLE "HomeroomClass" ALTER COLUMN "classNumber" SET NOT NULL,
ALTER COLUMN "classNumber" SET DEFAULT 'none';

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "teacherId",
ADD COLUMN     "homeroomTeacherId" TEXT NOT NULL,
ALTER COLUMN "classNumber" SET NOT NULL;

-- AlterTable
ALTER TABLE "TeachingAssignment" ALTER COLUMN "classNumber" SET NOT NULL,
ALTER COLUMN "classNumber" SET DEFAULT 'none';

-- AlterTable
ALTER TABLE "TeachingClass" ALTER COLUMN "classNumber" SET NOT NULL,
ALTER COLUMN "classNumber" SET DEFAULT 'none';

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_homeroomTeacherId_fkey" FOREIGN KEY ("homeroomTeacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
