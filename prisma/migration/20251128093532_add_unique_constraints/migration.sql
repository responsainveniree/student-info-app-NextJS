/*
  Warnings:

  - You are about to drop the column `image` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `Teacher` table. All the data in the column will be lost.
  - You are about to drop the `TeachingGrade` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_SubjectTeachers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_TeacherToTeachingGrade` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[grade,major,classNumber]` on the table `HomeroomClass` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[subjectName]` on the table `Subject` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Teacher` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "_SubjectTeachers" DROP CONSTRAINT "_SubjectTeachers_A_fkey";

-- DropForeignKey
ALTER TABLE "_SubjectTeachers" DROP CONSTRAINT "_SubjectTeachers_B_fkey";

-- DropForeignKey
ALTER TABLE "_TeacherToTeachingGrade" DROP CONSTRAINT "_TeacherToTeachingGrade_A_fkey";

-- DropForeignKey
ALTER TABLE "_TeacherToTeachingGrade" DROP CONSTRAINT "_TeacherToTeachingGrade_B_fkey";

-- AlterTable
ALTER TABLE "HomeroomClass" ALTER COLUMN "classNumber" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "image",
ALTER COLUMN "classNumber" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Teacher" DROP COLUMN "image";

-- DropTable
DROP TABLE "TeachingGrade";

-- DropTable
DROP TABLE "_SubjectTeachers";

-- DropTable
DROP TABLE "_TeacherToTeachingGrade";

-- CreateTable
CREATE TABLE "TeachingClass" (
    "id" SERIAL NOT NULL,
    "grade" "Grade" NOT NULL,
    "major" "Major" NOT NULL,
    "classNumber" TEXT,

    CONSTRAINT "TeachingClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeachingAssignment" (
    "id" SERIAL NOT NULL,
    "teacherId" TEXT NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "grade" "Grade" NOT NULL,
    "major" "Major" NOT NULL,
    "classNumber" TEXT,

    CONSTRAINT "TeachingAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_TeacherToTeachingClass" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_TeacherToTeachingClass_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeachingClass_grade_major_classNumber_key" ON "TeachingClass"("grade", "major", "classNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TeachingAssignment_teacherId_subjectId_grade_major_classNum_key" ON "TeachingAssignment"("teacherId", "subjectId", "grade", "major", "classNumber");

-- CreateIndex
CREATE INDEX "_TeacherToTeachingClass_B_index" ON "_TeacherToTeachingClass"("B");

-- CreateIndex
CREATE UNIQUE INDEX "HomeroomClass_grade_major_classNumber_key" ON "HomeroomClass"("grade", "major", "classNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_subjectName_key" ON "Subject"("subjectName");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_name_key" ON "Teacher"("name");

-- AddForeignKey
ALTER TABLE "TeachingAssignment" ADD CONSTRAINT "TeachingAssignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachingAssignment" ADD CONSTRAINT "TeachingAssignment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TeacherToTeachingClass" ADD CONSTRAINT "_TeacherToTeachingClass_A_fkey" FOREIGN KEY ("A") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TeacherToTeachingClass" ADD CONSTRAINT "_TeacherToTeachingClass_B_fkey" FOREIGN KEY ("B") REFERENCES "TeachingClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;
