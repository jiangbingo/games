import { describe, expect, it } from "vitest";
import { LEVELS } from "./levels";
import { createMaze, hasWall, isInside, samePoint, solveMaze, step } from "./maze";
import type { Direction, Point } from "./types";

const OPPOSITE: Record<Direction, Direction> = { up: "down", right: "left", down: "up", left: "right" };
const DIRECTIONS = Object.keys(OPPOSITE) as Direction[];

function directionBetween(from: Point, to: Point): Direction {
  if (to.row === from.row - 1 && to.col === from.col) return "up";
  if (to.row === from.row + 1 && to.col === from.col) return "down";
  if (to.col === from.col - 1 && to.row === from.row) return "left";
  if (to.col === from.col + 1 && to.row === from.row) return "right";
  throw new Error(`path cells must be adjacent: ${JSON.stringify({ from, to })}`);
}

describe("maze", () => {
  it("rebuilds identical walls from the same seed for all 120 levels", () => {
    for (const level of LEVELS) {
      const first = createMaze(level.size, level.seed);
      const second = createMaze(level.size, level.seed);
      expect(Array.from(second.walls), `level ${level.id}`).toEqual(Array.from(first.walls));
    }
  });

  it("solves every level from start to goal through open passages only", () => {
    for (const level of LEVELS) {
      const maze = createMaze(level.size, level.seed);
      const path = solveMaze(maze);

      expect(path.length, `level ${level.id} should be solvable`).toBeGreaterThan(1);
      expect(samePoint(path[0], maze.start)).toBe(true);
      expect(samePoint(path[path.length - 1], maze.goal)).toBe(true);

      for (let index = 1; index < path.length; index += 1) {
        const from = path[index - 1];
        const to = path[index];
        const direction = directionBetween(from, to);
        expect(hasWall(maze, from, direction), `level ${level.id} path must not cross walls at ${from.row},${from.col}`).toBe(false);
      }
    }
  });

  it("keeps the outer boundary sealed for all 120 levels", () => {
    for (const level of LEVELS) {
      const maze = createMaze(level.size, level.seed);
      for (let row = 0; row < maze.size; row += 1) {
        for (let col = 0; col < maze.size; col += 1) {
          const point = { row, col };
          if (row === 0) expect(hasWall(maze, point, "up"), `level ${level.id} top row at ${row},${col}`).toBe(true);
          if (col === 0) expect(hasWall(maze, point, "left"), `level ${level.id} left column at ${row},${col}`).toBe(true);
          if (row === maze.size - 1) expect(hasWall(maze, point, "down"), `level ${level.id} bottom row at ${row},${col}`).toBe(true);
          if (col === maze.size - 1) expect(hasWall(maze, point, "right"), `level ${level.id} right column at ${row},${col}`).toBe(true);
        }
      }
    }
  });

  it("mirrors walls between neighbouring cells in all 120 levels", () => {
    for (const level of LEVELS) {
      const maze = createMaze(level.size, level.seed);
      for (let row = 0; row < maze.size; row += 1) {
        for (let col = 0; col < maze.size; col += 1) {
          const point = { row, col };
          for (const direction of DIRECTIONS) {
            const next = step(point, direction);
            if (!isInside(maze.size, next)) continue;
            expect(hasWall(maze, next, OPPOSITE[direction]), `level ${level.id} walls must be symmetric at ${row},${col} toward ${direction}`).toBe(
              hasWall(maze, point, direction),
            );
          }
        }
      }
    }
  });

  it("steps exactly one cell in each direction", () => {
    const center = { row: 4, col: 6 };
    expect(step(center, "up")).toEqual({ row: 3, col: 6 });
    expect(step(center, "right")).toEqual({ row: 4, col: 7 });
    expect(step(center, "down")).toEqual({ row: 5, col: 6 });
    expect(step(center, "left")).toEqual({ row: 4, col: 5 });
  });
});
