import { createMaze, hasWall, samePoint, solveMaze, step } from "./maze";
import type { Direction, GameSnapshot, Level, Maze, Point, RouteMarker } from "./types";

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
  private routeMarkers: RouteMarker[] = [];
  private collectedRouteMarkerIds = new Set<number>();
  private routeMarkerTick = 0;

  constructor(private level: Level) {
    this._maze = createMaze(level.size, level.seed);
    this.position = { ...this._maze.start };
    this.routeMarkers = this.createRouteMarkers();
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
      routeMarkers: this.routeMarkers
        .filter((marker) => !this.collectedRouteMarkerIds.has(marker.id))
        .map((marker) => ({ ...marker })),
      routeMarkerTotal: this.routeMarkers.length,
      collectedRouteMarkerCount: this.collectedRouteMarkerIds.size,
      routeMarkerTick: this.routeMarkerTick,
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
    this.routeMarkers = this.createRouteMarkers();
    this.collectedRouteMarkerIds.clear();
    this.routeMarkerTick = 0;
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
    this.collectRouteMarker();
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
    this.collectedRouteMarkerIds.clear();
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

  private createRouteMarkers(): RouteMarker[] {
    const path = solveMaze(this._maze);
    const total = path.length >= 64 ? 4 : path.length >= 38 ? 3 : path.length >= 16 ? 2 : 1;
    const markerIndexes = new Set<number>();

    for (let index = 1; index <= total; index += 1) {
      const suggested = Math.round(((path.length - 1) * index) / (total + 1));
      markerIndexes.add(Math.max(1, Math.min(path.length - 2, suggested)));
    }

    return Array.from(markerIndexes).map((pathIndex, index) => ({
      id: index,
      ...path[pathIndex],
    }));
  }

  private collectRouteMarker() {
    const marker = this.routeMarkers.find((item) => samePoint(item, this.position));
    if (!marker || this.collectedRouteMarkerIds.has(marker.id)) return;
    this.collectedRouteMarkerIds.add(marker.id);
    this.routeMarkerTick += 1;
  }

  private emit() {
    const snapshot = this.snapshot;
    this.listeners.forEach((listener) => listener(snapshot));
  }
}
