import { expect, test } from "@playwright/test";
import { resetHabits } from "./helpers";

test.beforeEach(async ({ request }) => {
  await resetHabits(request);
});

test("creates, edits, and deletes a habit", async ({ page }) => {
  const habitName = `E2E Habit ${Date.now()}`;
  const updatedName = `${habitName} Updated`;

  await page.goto("/habits");
  await expect(page.getByText("No habits yet")).toBeVisible();

  await page.getByRole("button", { name: "+ New Habit" }).click();
  await page.getByPlaceholder("e.g. Morning Exercise").fill(habitName);
  await page.getByRole("button", { name: "Create Habit" }).click();

  await expect(page.getByText("Habit created")).toBeVisible();
  await expect(page.getByRole("heading", { name: habitName })).toBeVisible();

  await page.getByRole("button", { name: "Edit" }).click();
  await page.locator('input[value="' + habitName + '"]').fill(updatedName);
  await page.getByRole("button", { name: "Save Changes" }).click();

  await expect(page.getByText("Habit updated")).toBeVisible();
  await expect(page.getByRole("heading", { name: updatedName })).toBeVisible();

  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByRole("button", { name: "Delete" }).click();
  await page.getByPlaceholder("Type habit name").fill(updatedName);
  await page.getByRole("button", { name: "Delete Habit" }).click();

  await expect(page.getByText("Habit deleted")).toBeVisible();
  await expect(page.getByText("No habits yet")).toBeVisible();
});
