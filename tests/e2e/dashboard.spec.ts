import { expect, test } from "@playwright/test";
import { createHabit, markHabitComplete, resetHabits } from "./helpers";

test.beforeEach(async ({ request }) => {
  await resetHabits(request);
});

test("shows streak and completion sections for habits with completions", async ({
  page,
  request,
}) => {
  const habitName = `Dashboard Habit ${Date.now()}`;
  const habit = await createHabit(request, { name: habitName });
  await markHabitComplete(request, habit.id);

  await page.goto("/dashboard");

  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("Current streak")).toBeVisible();
  await expect(page.getByText("Streaks by habit")).toBeVisible();
  await expect(page.getByText("Completion rate by habit")).toBeVisible();
  await expect(page.getByRole("cell", { name: habitName })).toBeVisible();
});

test("shows empty state when there are no habits", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(
    page.getByText("No habits yet. Create habits to start tracking your progress.")
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Create habits →" })).toBeVisible();
});
