import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TrackerPage from "@/app/tracker/page";
import { getDateKey } from "@/lib/dates";
import { mockFetch } from "@tests/helpers/fetch-mock";
import { FIXED_TEST_DATE, makeApiHabit } from "@tests/helpers/tracker-fixtures";

describe("TrackerPage", () => {
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

    render(<TrackerPage />);

    expect(screen.getByText("Loading tracker…")).toBeInTheDocument();
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

    render(<TrackerPage />);

    await waitFor(() => {
      expect(screen.getByText("No habits yet.")).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: "Create habits" })).toHaveAttribute(
      "href",
      "/habits"
    );
  });

  it("renders the completion grid for fetched habits", async () => {
    mockFetch(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            data: [makeApiHabit({ name: "Morning Run" })],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
    );

    render(<TrackerPage />);

    await waitFor(() => {
      expect(screen.getByText("Morning Run")).toBeInTheDocument();
    });

    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("debounces completion saves after toggling a checkbox", async () => {
    const todayKey = getDateKey();
    const habit = makeApiHabit({ id: 42, name: "Morning Run" });
    const fetchMock = mockFetch((input, init) => {
      const url = String(input);

      if (url.endsWith("/api/habits") && (!init || init.method === undefined)) {
        return Promise.resolve(
          new Response(JSON.stringify({ data: [habit] }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        );
      }

      if (url.endsWith("/api/habits/completions") && init?.method === "PATCH") {
        return Promise.resolve(
          new Response(JSON.stringify({ data: [habit] }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        );
      }

      return Promise.resolve(new Response(null, { status: 404 }));
    });

    render(<TrackerPage />);

    await waitFor(() => {
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("checkbox"));

    expect(fetchMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(400);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    const patchCall = fetchMock.mock.calls.find(
      ([url, init]) =>
        String(url).endsWith("/api/habits/completions") && init?.method === "PATCH"
    );

    expect(patchCall).toBeDefined();
    expect(JSON.parse(String(patchCall?.[1]?.body))).toEqual({
      updates: [{ habitId: 42, date: todayKey, completed: true }],
    });
  });

  it("shows an error toast and reverts the grid when save fails", async () => {
    const habit = makeApiHabit({ id: 7, name: "Morning Run" });

    mockFetch((input, init) => {
      const url = String(input);

      if (url.endsWith("/api/habits") && (!init || init.method === undefined)) {
        return Promise.resolve(
          new Response(JSON.stringify({ data: [habit] }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        );
      }

      if (url.endsWith("/api/habits/completions") && init?.method === "PATCH") {
        return Promise.resolve(
          new Response(JSON.stringify({ error: "Failed to save changes" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          })
        );
      }

      return Promise.resolve(new Response(null, { status: 404 }));
    });

    render(<TrackerPage />);

    await waitFor(() => {
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    await vi.advanceTimersByTimeAsync(400);

    await waitFor(() => {
      expect(screen.getByText("Failed to save changes")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole("checkbox")).not.toBeChecked();
    });
  });
});
