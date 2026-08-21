export type Direction = "up" | "right" | "down" | "left";

export type Point = {
  row: number;
  col: number;
};

export type ThemePalette = {
  sky: string;
  paper: string;
  wall: string;
  trail: string;
  fox: string;
  goal: string;
  accent: string;
  ink: string;
};

export type MazeTheme = {
  id: number;
  name: string;
  shortName: string;
  mission: string;
  stamp: string;
  palette: ThemePalette;
};

export type Level = {
  id: number;
  title: string;
  styleName: string;
  size: number;
  seed: number;
  theme: MazeTheme;
};

export type Maze = {
  size: number;
  walls: Uint8Array;
  start: Point;
  goal: Point;
};

export type GameSnapshot = {
  level: Level;
  position: Point;
  moves: number;
  history: Point[];
  isComplete: boolean;
  collisionTick: number;
  hintPath: Point[];
};
