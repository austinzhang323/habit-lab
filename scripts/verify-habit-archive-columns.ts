/**
 * HAB-62 local verification: runs a real write + read through the new
 * User.timezone / Habit.archivedAt columns, then rolls the transaction back
 * so nothing persists. Local .env points at production here, so this is
 * intentionally non-destructive — verification only, not a seed script.
 *
 * Run: npx tsx scripts/verify-habit-archive-columns.ts
 */
import prisma from "../src/lib/prisma";

class Rollback extends Error {}

async function main() {
  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findFirst();
      if (!user) {
        console.log("No existing User row found — sign in once via the app, then re-run this.");
        throw new Rollback();
      }

      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { timezone: "America/Chicago" },
      });
      console.log(`User.timezone write+read OK -> ${updatedUser.timezone}`);

      const habit = await tx.habit.findFirst({ where: { userId: user.id } });
      if (!habit) {
        console.log("No existing Habit row for this user — skipping archivedAt check.");
        throw new Rollback();
      }

      const archivedHabit = await tx.habit.update({
        where: { id: habit.id },
        data: { archivedAt: new Date() },
      });
      console.log(`Habit.archivedAt write+read OK -> ${archivedHabit.archivedAt?.toISOString()}`);

      // Always roll back: this script verifies the columns work, it never
      // leaves data changed.
      throw new Rollback();
    });
  } catch (error) {
    if (error instanceof Rollback) {
      console.log("Rolled back — verification only, no data changed.");
      return;
    }
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Verification FAILED:", error);
    process.exit(1);
  });
