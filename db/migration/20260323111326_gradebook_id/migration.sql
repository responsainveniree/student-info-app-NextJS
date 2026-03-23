-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN     "gradebookId" INTEGER;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_gradebookId_fkey" FOREIGN KEY ("gradebookId") REFERENCES "Gradebook"("id") ON DELETE SET NULL ON UPDATE CASCADE;
