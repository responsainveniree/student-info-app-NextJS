/*
  Warnings:

  - A unique constraint covering the columns `[subjectMarkId,assessmentNumber]` on the table `Mark` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "AttendanceType" ADD VALUE 'LATE';

-- CreateIndex
CREATE UNIQUE INDEX "Mark_subjectMarkId_assessmentNumber_key" ON "Mark"("subjectMarkId", "assessmentNumber");
