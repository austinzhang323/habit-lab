import { expect, test } from "@playwright/test";
import { createHabit, resetHabits } from "./helpers";

test.beforeEach(async ({ request }) => {
  await resetHabits(request);
});

test("toggles today's completion and persists after reload", async ({ page, request }) => {
  const habit = await createHabit(request, { name: `Tracker Habit ${Date.now()}` });

  await page.goto("/tracker");
  await expect(page.getByText(habit.name)).toBeVisible();

  const checkbox = page.getByRole("checkbox", {
    name: new RegExp(`Mark "${habit.name}" complete on`, "i"),
  });

  await expect(checkbox).not.toBeChecked();
  await checkbox.check();
  await expect(checkbox).toBeChecked();

  await page.waitForResponse((response) =>
    response.url().includes("/api/habits/completions") && response.request().method() === "PATCH"
  );

  await page.reload();
  await expect(checkbox).toBeChecked();
});
