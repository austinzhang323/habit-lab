import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HabitsPage from "@/app/habits/page";
import { mockFetch } from "@tests/helpers/fetch-mock";
import { FIXED_TEST_DATE, makeApiHabit } from "@tests/helpers/tracker-fixtures";

describe("HabitsPage", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(`${FIXED_TEST_DATE}T12:00:00`));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("shows loading then empty state when there are no habits", async () => {
    mockFetch(() =>
      Promise.resolve(
        new Response(JSON.stringify({ data: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    render(<HabitsPage />);

    expect(screen.getByText("Loading your habits...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("No habits yet")).toBeInTheDocument();
    });
  });

  it("creates a habit from the new habit form", async () => {
    const user = userEvent.setup();
    const createdHabit = makeApiHabit({ id: 99, name: "Evening Walk" });

    const fetchMock = mockFetch((input, init) => {
      const url = String(input);

      if (url.endsWith("/api/habits") && (!init || init.method === undefined)) {
        return Promise.resolve(
          new Response(JSON.stringify({ data: [] }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        );
      }

      if (url.endsWith("/api/habits") && init?.method === "POST") {
        return Promise.resolve(
          new Response(JSON.stringify({ data: createdHabit }), {
            status: 201,
            headers: { "Content-Type": "application/json" },
          })
        );
      }

      return Promise.resolve(new Response(null, { status: 404 }));
    });

    render(<HabitsPage />);

    await waitFor(() => {
      expect(screen.getByText("No habits yet")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "+ New Habit" }));
    await user.type(screen.getByPlaceholderText("e.g. Morning Exercise"), "Evening Walk");
    await user.click(screen.getByRole("button", { name: "Create Habit" }));

    await waitFor(() => {
      expect(screen.getByText("Evening Walk")).toBeInTheDocument();
    });

    expect(screen.getByText("Habit created")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/habits",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: "Evening Walk",
          description: "",
          frequency: "daily",
          category: "exercise",
        }),
      })
    );
  });

  it("edits an existing habit", async () => {
    const user = userEvent.setup();
    const habit = makeApiHabit({ id: 5, name: "Morning Run" });
    const updatedHabit = { ...habit, name: "Sunrise Run" };

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

      if (url.endsWith("/api/habits") && init?.method === "PATCH") {
        return Promise.resolve(
          new Response(JSON.stringify({ data: updatedHabit }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        );
      }

      return Promise.resolve(new Response(null, { status: 404 }));
    });

    render(<HabitsPage />);

    await waitFor(() => {
      expect(screen.getByText("Morning Run")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Edit" }));

    const nameInput = screen.getByDisplayValue("Morning Run");
    await user.clear(nameInput);
    await user.type(nameInput, "Sunrise Run");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(screen.getByText("Sunrise Run")).toBeInTheDocument();
    });

    expect(screen.getByText("Habit updated")).toBeInTheDocument();
  });

  it("deletes a habit after confirmation", async () => {
    const user = userEvent.setup();
    const habit = makeApiHabit({ id: 8, name: "Read Books" });

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

      if (url.endsWith("/api/habits") && init?.method === "DELETE") {
        return Promise.resolve(
          new Response(JSON.stringify({ success: true, data: { id: habit.id, name: habit.name } }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        );
      }

      return Promise.resolve(new Response(null, { status: 404 }));
    });

    render(<HabitsPage />);

    await waitFor(() => {
      expect(screen.getByText("Read Books")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    const dialog = screen.getByRole("heading", { name: "Delete Habit" }).closest("div");
    expect(dialog).not.toBeNull();

    const confirmInput = within(dialog as HTMLElement).getByPlaceholderText("Type habit name");
    await user.type(confirmInput, "Read Books");
    await user.click(screen.getByRole("button", { name: "Delete Habit" }));

    await waitFor(() => {
      expect(screen.queryByText("Read Books")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Habit deleted")).toBeInTheDocument();
  });

  it("keeps delete disabled until the habit name matches", async () => {
    const user = userEvent.setup();
    const habit = makeApiHabit({ id: 12, name: "Meditate" });

    mockFetch(() =>
      Promise.resolve(
        new Response(JSON.stringify({ data: [habit] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    render(<HabitsPage />);

    await waitFor(() => {
      expect(screen.getByText("Meditate")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    const deleteButton = screen.getByRole("button", { name: "Delete Habit" });
    expect(deleteButton).toBeDisabled();

    const dialog = screen.getByRole("heading", { name: "Delete Habit" }).closest("div");
    const confirmInput = within(dialog as HTMLElement).getByPlaceholderText("Type habit name");
    await user.type(confirmInput, "Wrong name");
    expect(deleteButton).toBeDisabled();

    await user.clear(confirmInput);
    await user.type(confirmInput, "Meditate");
    expect(deleteButton).toBeEnabled();
  });
});
