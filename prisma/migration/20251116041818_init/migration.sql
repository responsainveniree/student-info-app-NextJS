-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('teacher', 'vicePrincipal', 'principal');

-- CreateEnum
CREATE TYPE "StudentRole" AS ENUM ('student');

-- CreateEnum
CREATE TYPE "Grade" AS ENUM ('tenth', 'eleventh', 'twelfth');

-- CreateEnum
CREATE TYPE "Major" AS ENUM ('accounting', 'softwareEngineering');

-- CreateEnum
CREATE TYPE "Semester" AS ENUM ('first', 'second');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('schoolwork', 'homework', 'quiz', 'exam', 'project', 'group');

-- CreateEnum
CREATE TYPE "problemPointCategory" AS ENUM ('discipline', 'academic', 'social', 'other');

-- CreateEnum
CREATE TYPE "AttendanceType" AS ENUM ('absent', 'sick', 'permission');

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "emailVerified" TIMESTAMP(3),
    "isVerified" BOOLEAN NOT NULL,
    "image" TEXT,
    "role" "StudentRole" NOT NULL DEFAULT 'student',
    "grade" "Grade" NOT NULL,
    "major" "Major" NOT NULL,
    "classNumber" INTEGER,
    "teacherId" TEXT NOT NULL,
    "otp" TEXT,
    "otpExpiresAt" TIMESTAMP(3),
    "otpRequestCount" INTEGER NOT NULL DEFAULT 0,
    "otpResetAt" TIMESTAMP(3),
    "otpAttemptCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectMark" (
    "id" SERIAL NOT NULL,
    "subjectName" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "semester" "Semester" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubjectMark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mark" (
    "id" SERIAL NOT NULL,
    "subjectMarkId" INTEGER NOT NULL,
    "type" "AssessmentType" NOT NULL,
    "number" INTEGER NOT NULL,
    "descriptionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarkDescription" (
    "id" SERIAL NOT NULL,
    "givenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarkDescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentAttendance" (
    "id" SERIAL NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "AttendanceType" NOT NULL,
    "description" TEXT,

    CONSTRAINT "StudentAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProblemPoint" (
    "id" SERIAL NOT NULL,
    "studentId" TEXT NOT NULL,
    "point" INTEGER NOT NULL,
    "category" "problemPointCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "recordedBy" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProblemPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Teacher" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "image" TEXT,
    "role" "StaffRole" NOT NULL,
    "otp" TEXT,
    "otpExpiresAt" TIMESTAMP(3),
    "otpRequestCount" INTEGER NOT NULL DEFAULT 0,
    "otpResetAt" TIMESTAMP(3),
    "otpAttemptCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeachingGrade" (
    "id" SERIAL NOT NULL,
    "grade" "Grade" NOT NULL,
    "major" "Major" NOT NULL,

    CONSTRAINT "TeachingGrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeroomClass" (
    "id" SERIAL NOT NULL,
    "grade" "Grade" NOT NULL,
    "major" "Major" NOT NULL,
    "classNumber" INTEGER,
    "teacherId" TEXT NOT NULL,

    CONSTRAINT "HomeroomClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentSession" (
    "sessionToken" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "TeacherSession" (
    "sessionToken" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" SERIAL NOT NULL,
    "subjectName" TEXT NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateTable
CREATE TABLE "_SubjectStudents" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_SubjectStudents_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_TeacherToTeachingGrade" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_TeacherToTeachingGrade_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SubjectTeachers" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SubjectTeachers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Student_email_key" ON "Student"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_email_key" ON "Teacher"("email");

-- CreateIndex
CREATE UNIQUE INDEX "HomeroomClass_teacherId_key" ON "HomeroomClass"("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentSession_sessionToken_key" ON "StudentSession"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherSession_sessionToken_key" ON "TeacherSession"("sessionToken");

-- CreateIndex
CREATE INDEX "_SubjectStudents_B_index" ON "_SubjectStudents"("B");

-- CreateIndex
CREATE INDEX "_TeacherToTeachingGrade_B_index" ON "_TeacherToTeachingGrade"("B");

-- CreateIndex
CREATE INDEX "_SubjectTeachers_B_index" ON "_SubjectTeachers"("B");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectMark" ADD CONSTRAINT "SubjectMark_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mark" ADD CONSTRAINT "Mark_subjectMarkId_fkey" FOREIGN KEY ("subjectMarkId") REFERENCES "SubjectMark"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mark" ADD CONSTRAINT "Mark_descriptionId_fkey" FOREIGN KEY ("descriptionId") REFERENCES "MarkDescription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAttendance" ADD CONSTRAINT "StudentAttendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemPoint" ADD CONSTRAINT "ProblemPoint_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemPoint" ADD CONSTRAINT "ProblemPoint_recordedBy_fkey" FOREIGN KEY ("recordedBy") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeroomClass" ADD CONSTRAINT "HomeroomClass_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSession" ADD CONSTRAINT "StudentSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherSession" ADD CONSTRAINT "TeacherSession_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SubjectStudents" ADD CONSTRAINT "_SubjectStudents_A_fkey" FOREIGN KEY ("A") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SubjectStudents" ADD CONSTRAINT "_SubjectStudents_B_fkey" FOREIGN KEY ("B") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TeacherToTeachingGrade" ADD CONSTRAINT "_TeacherToTeachingGrade_A_fkey" FOREIGN KEY ("A") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TeacherToTeachingGrade" ADD CONSTRAINT "_TeacherToTeachingGrade_B_fkey" FOREIGN KEY ("B") REFERENCES "TeachingGrade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SubjectTeachers" ADD CONSTRAINT "_SubjectTeachers_A_fkey" FOREIGN KEY ("A") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SubjectTeachers" ADD CONSTRAINT "_SubjectTeachers_B_fkey" FOREIGN KEY ("B") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
