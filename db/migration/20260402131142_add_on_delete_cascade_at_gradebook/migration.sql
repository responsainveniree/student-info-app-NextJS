-- DropForeignKey
ALTER TABLE "Gradebook" DROP CONSTRAINT "Gradebook_studentId_fkey";

-- AddForeignKey
ALTER TABLE "Gradebook" ADD CONSTRAINT "Gradebook_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
