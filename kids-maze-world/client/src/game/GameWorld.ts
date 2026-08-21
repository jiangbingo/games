import { createMaze, hasWall, samePoint, solveMaze, step } from "./maze";
import type { Direction, GameSnapshot, Level, Maze, Point } from "./types";

type Listener = (snapshot: GameSnapshot) => void;

export class GameWorld {
  private listeners = new Set<Listener>();
  private demoTimer: number | undefined;
  private _maze: Maze;
  private position: Point;
  private history: Point[] = [];
  private moves = 0;
  private isComplete = false;
  private collisionTick = 0;
  private hintPath: Point[] = [];

  constructor(private level: Level) {
    this._maze = createMaze(level.size, level.seed);
    this.position = { ...this._maze.start };
  }

  get maze() {
    return this._maze;
  }

  get snapshot(): GameSnapshot {
    return {
      level: this.level,
      position: { ...this.position },
      moves: this.moves,
      history: this.history.map((point) => ({ ...point })),
      isComplete: this.isComplete,
      collisionTick: this.collisionTick,
      hintPath: this.hintPath.map((point) => ({ ...point })),
    };
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => this.listeners.delete(listener);
  }

  loadLevel(level: Level) {
    this.stopDemo();
    this.level = level;
    this._maze = createMaze(level.size, level.seed);
    this.position = { ...this._maze.start };
    this.history = [];
    this.moves = 0;
    this.isComplete = false;
    this.collisionTick = 0;
    this.hintPath = [];
    this.emit();
  }

  move(direction: Direction) {
    if (this.isComplete || hasWall(this._maze, this.position, direction)) {
      this.collisionTick += 1;
      this.emit();
      return false;
    }

    this.history.push({ ...this.position });
    this.position = step(this.position, direction);
    this.moves += 1;
    this.hintPath = [];
    this.isComplete = samePoint(this.position, this._maze.goal);
    this.emit();
    return true;
  }

  undo() {
    if (!this.history.length || this.isComplete) return;
    this.position = this.history.pop()!;
    this.moves = Math.max(0, this.moves - 1);
    this.hintPath = [];
    this.emit();
  }

  restart() {
    this.position = { ...this._maze.start };
    this.history = [];
    this.moves = 0;
    this.isComplete = false;
    this.hintPath = [];
    this.emit();
  }

  showHint() {
    const path = solveMaze(this._maze, this.position, this._maze.goal);
    this.hintPath = path.slice(1, Math.min(path.length, 5));
    this.emit();
  }

  startDemo() {
    this.stopDemo();
    const path = solveMaze(this._maze);
    let index = 1;
    this.demoTimer = window.setInterval(() => {
      if (index >= path.length) {
        this.stopDemo();
        return;
      }
      const next = path[index];
      const current = this.position;
      const direction: Direction = next.row < current.row ? "up" : next.row > current.row ? "down" : next.col < current.col ? "left" : "right";
      this.move(direction);
      index += 1;
    }, 130);
  }

  stopDemo() {
    if (this.demoTimer) window.clearInterval(this.demoTimer);
    this.demoTimer = undefined;
  }

  dispose() {
    this.stopDemo();
    this.listeners.clear();
  }

  private emit() {
    const snapshot = this.snapshot;
    this.listeners.forEach((listener) => listener(snapshot));
  }
}
