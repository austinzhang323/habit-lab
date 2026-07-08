import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DashboardPage from "@/app/dashboard/page";
import { getRollingDateKeys } from "@/lib/dates";
import { mockFetch } from "@tests/helpers/fetch-mock";
import { FIXED_TEST_DATE, makeApiHabit } from "@tests/helpers/tracker-fixtures";

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(`${FIXED_TEST_DATE}T12:00:00`));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("shows loading state before habits are fetched", () => {
    mockFetch(() => new Promise(() => undefined));

    render(<DashboardPage />);

    expect(screen.getByText("Loading your dashboard...")).toBeInTheDocument();
  });

  it("shows empty state when there are no habits", async () => {
    mockFetch(() =>
      Promise.resolve(
        new Response(JSON.stringify({ data: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("No habits yet. Create habits to start tracking your progress.")).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: "Create habits →" })).toHaveAttribute(
      "href",
      "/habits"
    );
  });

  it("shows tracker prompt when habits exist but have no completions", async () => {
    mockFetch(() =>
      Promise.resolve(
        new Response(JSON.stringify({ data: [makeApiHabit()] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    render(<DashboardPage />);

    await waitFor(() => {
      expect(
        screen.getByText("No completions yet. Mark your first habits in the tracker.")
      ).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: "Start tracking →" })).toHaveAttribute(
      "href",
      "/tracker"
    );
  });

  it("renders streak and completion sections when habits have completions", async () => {
    const dateKeys = getRollingDateKeys(30);
    const [yesterday, today] = dateKeys.slice(-2);

    mockFetch(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            data: [
              makeApiHabit({
                name: "Morning Run",
                completedDates: [yesterday, today],
              }),
            ],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
    );

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Streaks by habit")).toBeInTheDocument();
    });

    expect(screen.getByText("Completion rate by habit")).toBeInTheDocument();
    expect(screen.getAllByText("Morning Run").length).toBeGreaterThan(0);
    expect(screen.getByText("Current streak")).toBeInTheDocument();
  });
});
