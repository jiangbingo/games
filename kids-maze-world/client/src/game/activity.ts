/** 森林邮差日记：只记录设备本地的每日探索足迹，不上传儿童行为数据。 */
export type DailyActivity = { completedIds: number[]; stickerIds: string[] };
export type WeeklyDay = { date: string; label: string; seconds: number; completed: number; stickers: number };

const ACTIVITY_KEY = "maze-daily-activity";
const weekdayLabels = ["日", "一", "二", "三", "四", "五", "六"];

export const formatLocalDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export const playtimeKeyFor = (date = new Date()) => `maze-playtime-${formatLocalDate(date)}`;

const readJournal = (): Record<string, DailyActivity> => {
  try {
    return JSON.parse(localStorage.getItem(ACTIVITY_KEY) ?? "{}") as Record<string, DailyActivity>;
  } catch {
    return {};
  }
};

export const recordDailyActivity = (kind: "completed" | "sticker", id: number | string) => {
  const journal = readJournal();
  const date = formatLocalDate();
  const day = journal[date] ?? { completedIds: [], stickerIds: [] };
  const list = kind === "completed" ? day.completedIds : day.stickerIds;
  if (!list.includes(id as never)) list.push(id as never);
  journal[date] = day;
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(journal));
};

export const readWeeklyActivity = (): WeeklyDay[] => {
  const journal = readJournal();
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const key = formatLocalDate(date);
    const day = journal[key] ?? { completedIds: [], stickerIds: [] };
    return {
      date: key,
      label: weekdayLabels[date.getDay()],
      seconds: Number(localStorage.getItem(playtimeKeyFor(date))) || 0,
      completed: day.completedIds.length,
      stickers: day.stickerIds.length,
    };
  });
};
