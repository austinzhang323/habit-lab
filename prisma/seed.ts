import "dotenv/config";
import { withAccelerate } from "@prisma/extension-accelerate";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  accelerateUrl: process.env.DATABASE_URL!,
}).$extends(withAccelerate());

async function main() {
  console.log("Seeding database...");

  // Create starter habits
  const habits = await Promise.all([
    prisma.habit.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: "Morning Walk",
        description: "30 minutes of walking to start the day",
        frequency: "DAILY",
        category: "FITNESS",
      },
    }),
    prisma.habit.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: "Read",
        description: "Read at least 20 pages",
        frequency: "DAILY",
        category: "LEARNING",
      },
    }),
    prisma.habit.upsert({
      where: { id: 3 },
      update: {},
      create: {
        name: "Meditate",
        description: "10 minutes of mindfulness",
        frequency: "DAILY",
        category: "MINDFULNESS",
      },
    }),
  ]);

  // Create a starter check-in
  const checkin = await prisma.checkin.create({
    data: {
      sleepHours: 7.5,
      energy: 8,
      mood: 7,
      focus: 8,
      notes: "Feeling good today!",
    },
  });

  // Mark the first habit as completed today
  const today = new Date().toISOString().slice(0, 10);
  await prisma.habitCompletion.upsert({
    where: { habitId_date: { habitId: habits[0].id, date: today } },
    update: {},
    create: {
      habitId: habits[0].id,
      checkinId: checkin.id,
      date: today,
    },
  });

  console.log(
    `✅ Seeded ${habits.length} habits, 1 check-in, and 1 completion.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
