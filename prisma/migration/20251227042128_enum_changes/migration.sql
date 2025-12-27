/*
  Warnings:

  - The values [schoolwork,homework,quiz,exam,project,group] on the enum `AssessmentType` will be removed. If these variants are still used in the database, this will fail.
  - The values [alpha,sick,permission] on the enum `AttendanceType` will be removed. If these variants are still used in the database, this will fail.
  - The values [tenth,eleventh,twelfth] on the enum `Grade` will be removed. If these variants are still used in the database, this will fail.
  - The values [accounting,softwareEngineering] on the enum `Major` will be removed. If these variants are still used in the database, this will fail.
  - The values [first,second] on the enum `Semester` will be removed. If these variants are still used in the database, this will fail.
  - The values [teacher,vicePrincipal,principal] on the enum `StaffRole` will be removed. If these variants are still used in the database, this will fail.
  - The values [student,classSecretary] on the enum `StudentRole` will be removed. If these variants are still used in the database, this will fail.
  - Changed the type of `category` on the `ProblemPoint` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ProblemPointCategory" AS ENUM ('DISCIPLINE', 'ACADEMIC', 'SOCIAL', 'OTHER');

-- AlterEnum
BEGIN;
CREATE TYPE "AssessmentType_new" AS ENUM ('SCHOOLWORK', 'HOMEWORK', 'QUIZ', 'EXAM', 'PROJECT', 'GROUP');
ALTER TABLE "Mark" ALTER COLUMN "type" TYPE "AssessmentType_new" USING ("type"::text::"AssessmentType_new");
ALTER TYPE "AssessmentType" RENAME TO "AssessmentType_old";
ALTER TYPE "AssessmentType_new" RENAME TO "AssessmentType";
DROP TYPE "public"."AssessmentType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "AttendanceType_new" AS ENUM ('ALPHA', 'SICK', 'PERMISSION');
ALTER TABLE "StudentAttendance" ALTER COLUMN "type" TYPE "AttendanceType_new" USING ("type"::text::"AttendanceType_new");
ALTER TYPE "AttendanceType" RENAME TO "AttendanceType_old";
ALTER TYPE "AttendanceType_new" RENAME TO "AttendanceType";
DROP TYPE "public"."AttendanceType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Grade_new" AS ENUM ('TENTH', 'ELEVENTH', 'TWELFTH');
ALTER TABLE "Student" ALTER COLUMN "grade" TYPE "Grade_new" USING ("grade"::text::"Grade_new");
ALTER TABLE "TeachingClass" ALTER COLUMN "grade" TYPE "Grade_new" USING ("grade"::text::"Grade_new");
ALTER TABLE "HomeroomClass" ALTER COLUMN "grade" TYPE "Grade_new" USING ("grade"::text::"Grade_new");
ALTER TABLE "TeachingAssignment" ALTER COLUMN "grade" TYPE "Grade_new" USING ("grade"::text::"Grade_new");
ALTER TYPE "Grade" RENAME TO "Grade_old";
ALTER TYPE "Grade_new" RENAME TO "Grade";
DROP TYPE "public"."Grade_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Major_new" AS ENUM ('ACCOUNTING', 'SOFTWARE_ENGINEERING');
ALTER TABLE "Student" ALTER COLUMN "major" TYPE "Major_new" USING ("major"::text::"Major_new");
ALTER TABLE "TeachingClass" ALTER COLUMN "major" TYPE "Major_new" USING ("major"::text::"Major_new");
ALTER TABLE "HomeroomClass" ALTER COLUMN "major" TYPE "Major_new" USING ("major"::text::"Major_new");
ALTER TABLE "TeachingAssignment" ALTER COLUMN "major" TYPE "Major_new" USING ("major"::text::"Major_new");
ALTER TYPE "Major" RENAME TO "Major_old";
ALTER TYPE "Major_new" RENAME TO "Major";
DROP TYPE "public"."Major_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Semester_new" AS ENUM ('FIRST', 'SECOND');
ALTER TABLE "SubjectMark" ALTER COLUMN "semester" TYPE "Semester_new" USING ("semester"::text::"Semester_new");
ALTER TYPE "Semester" RENAME TO "Semester_old";
ALTER TYPE "Semester_new" RENAME TO "Semester";
DROP TYPE "public"."Semester_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "StaffRole_new" AS ENUM ('TEACHER', 'VICE_PRINCIPAL', 'PRINCIPAL');
ALTER TABLE "Teacher" ALTER COLUMN "role" TYPE "StaffRole_new" USING ("role"::text::"StaffRole_new");
ALTER TYPE "StaffRole" RENAME TO "StaffRole_old";
ALTER TYPE "StaffRole_new" RENAME TO "StaffRole";
DROP TYPE "public"."StaffRole_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "StudentRole_new" AS ENUM ('STUDENT', 'CLASS_SECRETARY');
ALTER TABLE "public"."Student" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "Student" ALTER COLUMN "role" TYPE "StudentRole_new" USING ("role"::text::"StudentRole_new");
ALTER TYPE "StudentRole" RENAME TO "StudentRole_old";
ALTER TYPE "StudentRole_new" RENAME TO "StudentRole";
DROP TYPE "public"."StudentRole_old";
ALTER TABLE "Student" ALTER COLUMN "role" SET DEFAULT 'STUDENT';
COMMIT;

-- AlterTable
ALTER TABLE "ProblemPoint" DROP COLUMN "category",
ADD COLUMN     "category" "ProblemPointCategory" NOT NULL;

-- AlterTable
ALTER TABLE "Student" ALTER COLUMN "role" SET DEFAULT 'STUDENT';

-- AlterTable
ALTER TABLE "Teacher" ALTER COLUMN "role" SET DEFAULT 'TEACHER';

-- DropEnum
DROP TYPE "problemPointCategory";
