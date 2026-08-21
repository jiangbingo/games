import type { Direction, Maze, Point } from "./types";

const WALL = { up: 1, right: 2, down: 4, left: 8 } as const;

const DELTAS: Record<Direction, Point> = {
  up: { row: -1, col: 0 },
  right: { row: 0, col: 1 },
  down: { row: 1, col: 0 },
  left: { row: 0, col: -1 },
};

const OPPOSITE: Record<Direction, Direction> = { up: "down", right: "left", down: "up", left: "right" };
const DIRECTIONS = Object.keys(DELTAS) as Direction[];

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const indexOf = (size: number, point: Point) => point.row * size + point.col;

export function isInside(size: number, point: Point) {
  return point.row >= 0 && point.row < size && point.col >= 0 && point.col < size;
}

export function samePoint(a: Point, b: Point) {
  return a.row === b.row && a.col === b.col;
}

export function step(point: Point, direction: Direction): Point {
  const delta = DELTAS[direction];
  return { row: point.row + delta.row, col: point.col + delta.col };
}

export function hasWall(maze: Maze, point: Point, direction: Direction) {
  return (maze.walls[indexOf(maze.size, point)] & WALL[direction]) !== 0;
}

export function createMaze(size: number, seed: number): Maze {
  const random = seededRandom(seed);
  const walls = new Uint8Array(size * size).fill(WALL.up | WALL.right | WALL.down | WALL.left);
  const visited = new Uint8Array(size * size);
  const stack: Point[] = [{ row: 0, col: 0 }];
  visited[0] = 1;

  while (stack.length) {
    const current = stack[stack.length - 1];
    const candidates = DIRECTIONS.filter((direction) => {
      const next = step(current, direction);
      return isInside(size, next) && !visited[indexOf(size, next)];
    });

    if (!candidates.length) {
      stack.pop();
      continue;
    }

    const direction = candidates[Math.floor(random() * candidates.length)];
    const next = step(current, direction);
    walls[indexOf(size, current)] &= ~WALL[direction];
    walls[indexOf(size, next)] &= ~WALL[OPPOSITE[direction]];
    visited[indexOf(size, next)] = 1;
    stack.push(next);
  }

  return { size, walls, start: { row: 0, col: 0 }, goal: { row: size - 1, col: size - 1 } };
}

export function solveMaze(maze: Maze, from = maze.start, to = maze.goal): Point[] {
  const queue: Point[] = [from];
  const previous = new Map<number, Point | null>();
  previous.set(indexOf(maze.size, from), null);

  while (queue.length) {
    const current = queue.shift()!;
    if (samePoint(current, to)) break;
    for (const direction of DIRECTIONS) {
      if (hasWall(maze, current, direction)) continue;
      const next = step(current, direction);
      const key = indexOf(maze.size, next);
      if (!previous.has(key)) {
        previous.set(key, current);
        queue.push(next);
      }
    }
  }

  if (!previous.has(indexOf(maze.size, to))) return [];
  const path: Point[] = [];
  let cursor: Point | null = to;
  while (cursor) {
    path.unshift(cursor);
    cursor = previous.get(indexOf(maze.size, cursor)) ?? null;
  }
  return path;
}
