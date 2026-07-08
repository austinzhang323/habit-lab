import { expect, test } from "@playwright/test";
import { resetHabits } from "./helpers";

test.beforeEach(async ({ request }) => {
  await resetHabits(request);
});

test("landing page shows sign in and primary calls to action", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /Build Better/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Start Tracking →" })).toBeVisible();
});

test("desktop navigation links resolve", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: "Dashboard" }).first().click();
  await expect(page).toHaveURL("/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  await page.getByRole("link", { name: "Tracker" }).first().click();
  await expect(page).toHaveURL("/tracker");
  await expect(page.getByRole("heading", { name: "Tracker" })).toBeVisible();

  await page.getByRole("link", { name: "Habits" }).first().click();
  await expect(page).toHaveURL("/habits");
  await expect(page.getByRole("heading", { name: "My Habits" })).toBeVisible();
});

test("mobile navigation menu opens and links resolve", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");

  await page.getByRole("button", { name: "Toggle menu" }).click();
  await page.getByRole("link", { name: "Dashboard" }).last().click();

  await expect(page).toHaveURL("/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});

test("login page shows Google sign-in button", async ({ page }) => {
  await page.goto("/login");

  await expect(
    page.getByRole("button", { name: "Sign in with Google" })
  ).toBeVisible();
});
