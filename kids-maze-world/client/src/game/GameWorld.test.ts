import { describe, expect, it } from "vitest";
import { getLevel, LEVELS } from "./levels";
import { solveMaze } from "./maze";
import { GameWorld } from "./GameWorld";
import type { Direction, Point } from "./types";

function directionBetween(from: Point, to: Point): Direction {
  if (to.row < from.row) return "up";
  if (to.row > from.row) return "down";
  if (to.col < from.col) return "left";
  return "right";
}

describe("GameWorld", () => {
  it("creates deterministic, solvable levels and collects every route marker", () => {
    for (const level of LEVELS) {
      const world = new GameWorld(level);
      const path = solveMaze(world.maze);
      const initial = world.snapshot;

      expect(path.length).toBeGreaterThan(1);
      expect(initial.routeMarkerTotal).toBeGreaterThanOrEqual(1);
      expect(initial.routeMarkerTotal).toBeLessThanOrEqual(3);

      for (let index = 1; index < path.length; index += 1) {
        expect(world.move(directionBetween(path[index - 1], path[index]))).toBe(true);
      }

      const completed = world.snapshot;
      expect(completed.isComplete).toBe(true);
      expect(completed.collectedRouteMarkerCount).toBe(completed.routeMarkerTotal);
      expect(completed.routeMarkers).toHaveLength(0);

      world.restart();
      const restarted = world.snapshot;
      expect(restarted.isComplete).toBe(false);
      expect(restarted.collectedRouteMarkerCount).toBe(0);
      expect(restarted.routeMarkers).toHaveLength(restarted.routeMarkerTotal);
    }
  });

  it("keeps a collected route marker after undo", () => {
    const world = new GameWorld(LEVELS[0]);
    const path = solveMaze(world.maze);
    const marker = world.snapshot.routeMarkers[0];
    const markerIndex = path.findIndex((point) => point.row === marker.row && point.col === marker.col);

    expect(markerIndex).toBeGreaterThan(0);
    for (let index = 1; index <= markerIndex; index += 1) {
      expect(world.move(directionBetween(path[index - 1], path[index]))).toBe(true);
    }

    expect(world.snapshot.collectedRouteMarkerCount).toBe(1);
    world.undo();

    expect(world.snapshot.collectedRouteMarkerCount).toBe(1);
    expect(world.snapshot.routeMarkers.some((item) => item.id === marker.id)).toBe(false);
  });

  it("recreates an identical board when loading the same level", () => {
    const world = new GameWorld(getLevel(48));
    const before = Array.from(world.maze.walls);

    world.loadLevel(getLevel(48));

    expect(Array.from(world.maze.walls)).toEqual(before);
  });
});
