import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatLocalDate, playtimeKeyFor, readWeeklyActivity, recordDailyActivity } from "./activity";

function installMemoryStorage() {
  const map = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, String(value)),
    removeItem: (key: string) => void map.delete(key),
    clear: () => map.clear(),
  });
}

describe("activity", () => {
  beforeEach(() => {
    installMemoryStorage();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("zero-pads single-digit months and days", () => {
    expect(formatLocalDate(new Date(2026, 0, 5, 9, 30))).toBe("2026-01-05");
    expect(formatLocalDate(new Date(2026, 10, 20, 15, 0))).toBe("2026-11-20");
  });

  it("keeps late evening and early morning in separate local days", () => {
    const beforeMidnight = new Date(2026, 11, 31, 23, 59, 59);
    const afterMidnight = new Date(2027, 0, 1, 0, 0, 1);

    expect(formatLocalDate(beforeMidnight)).toBe("2026-12-31");
    expect(formatLocalDate(afterMidnight)).toBe("2027-01-01");
    expect(playtimeKeyFor(beforeMidnight)).toBe("maze-playtime-2026-12-31");
    expect(playtimeKeyFor(afterMidnight)).toBe("maze-playtime-2027-01-01");
    expect(playtimeKeyFor(beforeMidnight)).not.toBe(playtimeKeyFor(afterMidnight));
  });

  it("returns an empty seven-day window without records", () => {
    vi.setSystemTime(new Date(2026, 7, 30, 10, 0));
    const week = readWeeklyActivity();

    expect(week).toHaveLength(7);
    for (const day of week) {
      expect(day).toMatchObject({ seconds: 0, completed: 0, stickers: 0 });
    }
    expect(week[6]).toMatchObject({ date: "2026-08-30", label: "日" });
  });

  it("splits records across a midnight boundary and deduplicates repeats", () => {
    vi.setSystemTime(new Date(2026, 7, 30, 23, 58));
    recordDailyActivity("completed", 12);
    recordDailyActivity("completed", 12);
    recordDailyActivity("sticker", "fox");

    vi.setSystemTime(new Date(2026, 7, 31, 0, 2));
    recordDailyActivity("completed", 13);

    const week = readWeeklyActivity();
    const sunday = week.find((day) => day.date === "2026-08-30");
    const monday = week.find((day) => day.date === "2026-08-31");

    expect(sunday).toMatchObject({ completed: 1, stickers: 1 });
    expect(monday).toMatchObject({ completed: 1, stickers: 0 });
  });
});
