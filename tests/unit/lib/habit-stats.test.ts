import { describe, expect, it } from "vitest";
import { getRollingDateKeys } from "@/lib/dates";
import {
  computeHabitCompletionRate,
  computeHabitStreak,
  getBestCurrentStreak,
} from "@/lib/habit-stats";
import { makeHabitWithCompletions } from "@tests/helpers/habit-fixtures";

describe("computeHabitStreak", () => {
  const dateKeys = getRollingDateKeys(30);
  const [oldest, middle, newest] = dateKeys.slice(-3);

  it("returns 0 when there are no completions", () => {
    expect(
      computeHabitStreak(
        makeHabitWithCompletions({ createdAt: oldest }),
        dateKeys
      )
    ).toBe(0);
  });

  it("counts consecutive days ending at the most recent completion when today is incomplete", () => {
    expect(
      computeHabitStreak(
        makeHabitWithCompletions({
          createdAt: oldest,
          completedDates: [oldest, middle],
        }),
        dateKeys
      )
    ).toBe(2);
  });

  it("returns 1 when only the oldest of the last three days is completed", () => {
    expect(
      computeHabitStreak(
        makeHabitWithCompletions({
          createdAt: oldest,
          completedDates: [oldest],
        }),
        dateKeys
      )
    ).toBe(1);
  });

  it("breaks the streak after a gap once counting has started", () => {
    expect(
      computeHabitStreak(
        makeHabitWithCompletions({
          createdAt: oldest,
          completedDates: [oldest, newest],
        }),
        dateKeys
      )
    ).toBe(1);
  });

  it("ignores pre-creation days in the window", () => {
    expect(
      computeHabitStreak(
        makeHabitWithCompletions({
          createdAt: newest,
          completedDates: [newest],
        }),
        dateKeys
      )
    ).toBe(1);
  });
});

describe("computeHabitCompletionRate", () => {
  const dateKeys = getRollingDateKeys(30);
  const [oldest, middle, newest] = dateKeys.slice(-3);

  it("returns 0 when there are no completions", () => {
    expect(
      computeHabitCompletionRate(
        makeHabitWithCompletions({ createdAt: oldest }),
        dateKeys
      )
    ).toBe(0);
  });

  it("uses only trackable days in the denominator", () => {
    expect(
      computeHabitCompletionRate(
        makeHabitWithCompletions({
          createdAt: middle,
          completedDates: [middle],
        }),
        dateKeys
      )
    ).toBe(50);
  });

  it("returns 100 when every trackable day is completed", () => {
    expect(
      computeHabitCompletionRate(
        makeHabitWithCompletions({
          createdAt: newest,
          completedDates: [newest],
        }),
        dateKeys
      )
    ).toBe(100);
  });
});

describe("getBestCurrentStreak", () => {
  it("returns zero and empty names when no stats", () => {
    expect(getBestCurrentStreak([])).toEqual({
      bestStreak: 0,
      habitNames: [],
    });
  });

  it("returns all habits tied at the max streak", () => {
    expect(
      getBestCurrentStreak([
        { habitId: 1, name: "Meditation", streak: 3, completionRate: 50 },
        { habitId: 2, name: "Exercise", streak: 3, completionRate: 40 },
        { habitId: 3, name: "Water", streak: 1, completionRate: 10 },
      ])
    ).toEqual({
      bestStreak: 3,
      habitNames: ["Exercise", "Meditation"],
    });
  });
});
