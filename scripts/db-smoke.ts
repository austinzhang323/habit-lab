/**
 * CI smoke check (HAB-60): proves the test database is genuinely reachable
 * through the app's own Prisma/Accelerate path — not merely that the env vars
 * are present. Runs one real query and exits non-zero on any failure.
 *
 * Imports the same client the app uses (src/lib/prisma.ts), so it exercises
 * DATABASE_URL (the prisma:// Accelerate URL) exactly the way the running app will.
 */
import prisma from "../src/lib/prisma";

async function main() {
  const userCount = await prisma.user.count();
  console.log(`DB smoke check OK — connected to test DB, user count = ${userCount}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("DB smoke check FAILED:", error);
    process.exit(1);
  });
