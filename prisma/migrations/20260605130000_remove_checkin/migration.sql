-- DropForeignKey
ALTER TABLE "HabitCompletion" DROP CONSTRAINT "HabitCompletion_checkinId_fkey";

-- AlterTable
ALTER TABLE "HabitCompletion" DROP COLUMN "checkinId";

-- DropTable
DROP TABLE "Checkin";
