-- DropForeignKey
ALTER TABLE "DemeritPoint" DROP CONSTRAINT "DemeritPoint_studentId_fkey";

-- AddForeignKey
ALTER TABLE "DemeritPoint" ADD CONSTRAINT "DemeritPoint_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
