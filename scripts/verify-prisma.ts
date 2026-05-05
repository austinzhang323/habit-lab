import "dotenv/config";
import { withAccelerate } from "@prisma/extension-accelerate";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  accelerateUrl: process.env.DATABASE_URL!,
}).$extends(withAccelerate());

async function main() {
  const habitCount = await prisma.habit.count();
  console.log(`✅ Connected. Habits in DB: ${habitCount}`);
}

main()
  .catch((e) => {
    console.error("❌ Connection failed:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
