-- AlterTable
ALTER TABLE "Habit" ADD COLUMN     "archivedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "timezone" TEXT;
