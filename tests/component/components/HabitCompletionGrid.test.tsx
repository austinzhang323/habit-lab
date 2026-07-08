import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HabitCompletionGrid from "@/components/HabitCompletionGrid";
import { formatDateRowLabel } from "@/lib/dates";
import {
  FIXED_TEST_DATE,
  getTestDateKeys,
  makeGrid,
  makeTrackerHabit,
} from "@tests/helpers/tracker-fixtures";

describe("HabitCompletionGrid", () => {
  const dateKeys = getTestDateKeys(5);
  const [oldestDateKey, , todayKey] = [
    dateKeys[0],
    dateKeys[Math.floor(dateKeys.length / 2)],
    dateKeys[dateKeys.length - 1],
  ] as const;

  const habits = [
    makeTrackerHabit({ id: 1, name: "Morning Run", category: "exercise" }),
    makeTrackerHabit({
      id: 2,
      name: "Read",
      category: "spiritual-growth",
      createdAt: todayKey,
    }),
  ];

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(`${FIXED_TEST_DATE}T12:00:00`));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders habit names and formatted categories", () => {
    render(
      <HabitCompletionGrid
        dateKeys={dateKeys}
        habits={habits}
        grid={{}}
        onToggle={vi.fn()}
      />
    );

    expect(screen.getByText("Morning Run")).toBeInTheDocument();
    expect(screen.getByText("Read")).toBeInTheDocument();
    expect(screen.getByText("exercise")).toBeInTheDocument();
    expect(screen.getByText("spiritual growth")).toBeInTheDocument();
  });

  it("renders em-dash for untrackable cells before habit creation", () => {
    const { container } = render(
      <HabitCompletionGrid
        dateKeys={[oldestDateKey, todayKey]}
        habits={[habits[1]]}
        grid={{}}
        onToggle={vi.fn()}
      />
    );

    const rows = container.querySelectorAll("tbody tr");
    const oldestRow = rows[0] as HTMLElement;
    const todayRow = rows[1] as HTMLElement;

    expect(within(oldestRow).getByText("—")).toBeInTheDocument();
    expect(within(oldestRow).queryByRole("checkbox")).not.toBeInTheDocument();
    expect(within(todayRow).getByRole("checkbox")).toBeInTheDocument();
  });

  it("reflects completed state in checkboxes for trackable cells", () => {
    render(
      <HabitCompletionGrid
        dateKeys={[todayKey]}
        habits={[habits[0]]}
        grid={makeGrid([{ habitId: 1, dateKey: todayKey, completed: true }])}
        onToggle={vi.fn()}
      />
    );

    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("calls onToggle with habit id, date key, and toggled value", () => {
    const onToggle = vi.fn();

    render(
      <HabitCompletionGrid
        dateKeys={[todayKey]}
        habits={[habits[0]]}
        grid={makeGrid([{ habitId: 1, dateKey: todayKey, completed: false }])}
        onToggle={onToggle}
      />
    );

    fireEvent.click(screen.getByRole("checkbox"));

    expect(onToggle).toHaveBeenCalledWith(1, todayKey, true);
  });

  it("disables checkboxes while saving", () => {
    render(
      <HabitCompletionGrid
        dateKeys={[todayKey]}
        habits={[habits[0]]}
        grid={makeGrid([{ habitId: 1, dateKey: todayKey, completed: false }])}
        onToggle={vi.fn()}
        saving
      />
    );

    expect(screen.getByRole("checkbox")).toBeDisabled();
  });

  it("shows Today badge on the current date row", () => {
    render(
      <HabitCompletionGrid
        dateKeys={[oldestDateKey, todayKey]}
        habits={[habits[0]]}
        grid={{}}
        onToggle={vi.fn()}
      />
    );

    const todayLabel = formatDateRowLabel(todayKey);
    const todayRow = screen.getByText(todayLabel).closest("tr");

    expect(todayRow).not.toBeNull();
    expect(within(todayRow as HTMLElement).getByText("Today")).toBeInTheDocument();
  });

  it("includes habit name and date in checkbox aria-labels", () => {
    render(
      <HabitCompletionGrid
        dateKeys={[todayKey]}
        habits={[habits[0]]}
        grid={makeGrid([{ habitId: 1, dateKey: todayKey, completed: false }])}
        onToggle={vi.fn()}
      />
    );

    const label = formatDateRowLabel(todayKey);
    expect(
      screen.getByRole("checkbox", {
        name: `Mark "Morning Run" complete on ${label}`,
      })
    ).toBeInTheDocument();
  });
});
