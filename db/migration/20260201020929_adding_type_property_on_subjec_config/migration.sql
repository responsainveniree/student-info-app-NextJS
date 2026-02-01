/*
  Warnings:

  - Added the required column `subjectType` to the `SubjectConfig` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SubjectType" AS ENUM ('GENERAL', 'MAJOR');

-- AlterTable
ALTER TABLE "SubjectConfig" ADD COLUMN     "subjectType" "SubjectType" NOT NULL;
