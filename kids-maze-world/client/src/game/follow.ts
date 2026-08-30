import type { Direction } from "./types";

export type WorldPoint = { x: number; y: number };
export type FollowAxis = "x" | "y";
export type FollowStep = { axis: FollowAxis; direction: Direction };

export const FOLLOW_STEP_THRESHOLD = 0.62;

export function pickFollowStep(consumed: WorldPoint, finger: WorldPoint, threshold = FOLLOW_STEP_THRESHOLD): FollowStep | null {
  const dx = finger.x - consumed.x;
  const dy = finger.y - consumed.y;
  if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return null;
  if (Math.abs(dx) >= Math.abs(dy)) return { axis: "x", direction: dx > 0 ? "right" : "left" };
  return { axis: "y", direction: dy > 0 ? "up" : "down" };
}

export function consumeStep(consumed: WorldPoint, step: FollowStep): WorldPoint {
  const next = { x: consumed.x, y: consumed.y };
  if (step.axis === "x") next.x += step.direction === "right" ? 1 : -1;
  else next.y += step.direction === "up" ? 1 : -1;
  return next;
}
