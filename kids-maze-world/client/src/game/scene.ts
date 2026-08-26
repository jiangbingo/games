import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import { GameWorld } from "./GameWorld";
import { getLevel } from "./levels";
import { hasWall } from "./maze";
import type { Direction, GameSnapshot, Point } from "./types";

export type GameHandle = {
  scene: Scene;
  world: GameWorld;
  move: (direction: Direction) => boolean;
  undo: () => void;
  restart: () => void;
  showHint: () => void;
  loadLevel: (id: number) => void;
  dispose: () => void;
};

type SceneOptions = {
  onStateChange?: (snapshot: GameSnapshot) => void;
  demo?: boolean;
};

const hex = (value: string) => Color3.FromHexString(value);

const pointToVector = (point: Point, size: number) => new Vector3(point.col - (size - 1) / 2, (size - 1) / 2 - point.row, -0.35);

export async function createGameScene(engine: Engine, canvas: HTMLCanvasElement, options: SceneOptions = {}): Promise<GameHandle> {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0, 0, 0, 0);
  scene.ambientColor = new Color3(1, 1, 1);
  const camera = new FreeCamera("maze-camera", new Vector3(0, 0, -20), scene);
  camera.setTarget(Vector3.Zero());
  camera.mode = FreeCamera.ORTHOGRAPHIC_CAMERA;
  scene.activeCamera = camera;

  const requestedLevel = Number(new URLSearchParams(window.location.search).get("level"));
  const storedLevel = Number(localStorage.getItem("maze-last-level")) || 1;
  const world = new GameWorld(getLevel(options.demo && requestedLevel ? requestedLevel : storedLevel));
  const staticMeshes: ReturnType<typeof MeshBuilder.CreatePlane>[] = [];
  const dynamicMeshes: ReturnType<typeof MeshBuilder.CreateDisc>[] = [];
  const materials: StandardMaterial[] = [];
  let player = MeshBuilder.CreateDisc("fox", { radius: 0.28, tessellation: 32 }, scene);
  let target = new Vector3();
  let playerMaterial: StandardMaterial;
  let currentSnapshot = world.snapshot;
  let currentSize = currentSnapshot.level.size;
  let trailMaterial: StandardMaterial | null = null;
  let hintMaterial: StandardMaterial | null = null;
  let celebrationMaterial: StandardMaterial | null = null;
  let routeMarkerMaterial: StandardMaterial | null = null;
  let unsubscribe: () => void = () => {};

  const makeMaterial = (name: string, color: string, alpha = 1) => {
    const material = new StandardMaterial(name, scene);
    material.diffuseColor = hex(color);
    material.emissiveColor = hex(color);
    material.specularColor = new Color3(0, 0, 0);
    material.disableLighting = true;
    material.alpha = alpha;
    material.backFaceCulling = false;
    materials.push(material);
    return material;
  };

  const cleanupBoard = () => {
    staticMeshes.splice(0).forEach((mesh) => mesh.dispose());
    dynamicMeshes.splice(0).forEach((mesh) => mesh.dispose());
    materials.splice(0).forEach((material) => material.dispose());
    trailMaterial = null;
    hintMaterial = null;
    celebrationMaterial = null;
    routeMarkerMaterial = null;
    player.dispose();
  };

  const addPlane = (name: string, x: number, y: number, width: number, height: number, z: number, material: StandardMaterial) => {
    const mesh = MeshBuilder.CreatePlane(name, { width, height }, scene);
    mesh.position = new Vector3(x, y, z);
    mesh.material = material;
    staticMeshes.push(mesh);
    return mesh;
  };

  const updateCamera = () => {
    const aspect = Math.max(0.75, canvas.clientWidth / Math.max(1, canvas.clientHeight));
    const isPortraitTablet = canvas.clientWidth >= 768 && aspect < 0.9;
    const halfHeight = isPortraitTablet ? Math.max(5.25, currentSize / 2 + 1.9) : Math.max(4.4, currentSize / 2 + 1.15);
    camera.orthoTop = halfHeight;
    camera.orthoBottom = -halfHeight;
    camera.orthoLeft = -halfHeight * aspect;
    camera.orthoRight = halfHeight * aspect;
  };

  const redrawDynamic = (snapshot: GameSnapshot) => {
    dynamicMeshes.splice(0).forEach((mesh) => mesh.dispose());
    if (!trailMaterial || !hintMaterial || !celebrationMaterial || !routeMarkerMaterial) return;

    snapshot.history.slice(-16).forEach((point, index) => {
      const disc = MeshBuilder.CreateDisc(`trail-${index}`, { radius: 0.09, tessellation: 16 }, scene);
      const position = pointToVector(point, currentSize);
      disc.position = new Vector3(position.x, position.y - 0.22, -0.18);
      disc.material = trailMaterial;
      dynamicMeshes.push(disc);
    });
    snapshot.hintPath.forEach((point, index) => {
      const disc = MeshBuilder.CreateDisc(`hint-${index}`, { radius: 0.11 + index * 0.012, tessellation: 20 }, scene);
      const position = pointToVector(point, currentSize);
      disc.position = new Vector3(position.x, position.y, -0.15);
      disc.material = hintMaterial;
      dynamicMeshes.push(disc);
    });
    snapshot.routeMarkers.forEach((marker) => {
      const stamp = MeshBuilder.CreateDisc(`route-stamp-${marker.id}`, { radius: 0.17, tessellation: 6 }, scene);
      const position = pointToVector(marker, currentSize);
      stamp.position = new Vector3(position.x, position.y, -0.16);
      stamp.rotation.z = Math.PI / 6;
      stamp.material = routeMarkerMaterial;
      dynamicMeshes.push(stamp);
    });
    if (snapshot.isComplete) {
      const center = pointToVector(world.maze.goal, currentSize);
      Array.from({ length: 8 }).forEach((_, index) => {
        const angle = (Math.PI * 2 * index) / 8;
        const disc = MeshBuilder.CreateDisc(`sparkle-${index}`, { radius: 0.07, tessellation: 12 }, scene);
        disc.position = new Vector3(center.x + Math.cos(angle) * 0.48, center.y + Math.sin(angle) * 0.48, -0.2);
        disc.material = celebrationMaterial;
        dynamicMeshes.push(disc);
      });
    }
  };

  const buildBoard = (snapshot: GameSnapshot) => {
    cleanupBoard();
    currentSize = snapshot.level.size;
    const { paper, sky, wall, trail, fox, goal, accent } = snapshot.level.theme.palette;
    const backdropMaterial = makeMaterial("forest-sky", sky);
    const paperMaterial = makeMaterial("maze-paper", paper);
    const wallMaterial = makeMaterial("maze-hedges", wall);
    const goalMaterial = makeMaterial("acorn-parcel", goal);
    playerMaterial = makeMaterial("fox-postman", fox);
    const accentMaterial = makeMaterial("forest-dots", accent, 0.5);
    trailMaterial = makeMaterial("fox-footprints", trail, 0.88);
    hintMaterial = makeMaterial("firefly-hints", goal, 0.74);
    celebrationMaterial = makeMaterial("delivery-sparkles", accent, 0.95);
    routeMarkerMaterial = makeMaterial("route-stamps", accent, 0.9);
    const boardExtent = currentSize + 0.72;

    addPlane("sky", 0, 0, boardExtent + 3.2, boardExtent + 3.2, 0.45, backdropMaterial);
    addPlane("paper", 0, 0, boardExtent, boardExtent, 0.25, paperMaterial);

    for (let row = 0; row < currentSize; row += 1) {
      for (let col = 0; col < currentSize; col += 1) {
        const point = { row, col };
        const x = col - (currentSize - 1) / 2;
        const y = (currentSize - 1) / 2 - row;
        if (hasWall(world.maze, point, "up")) addPlane(`top-${row}-${col}`, x, y + 0.5, 1.12, 0.13, -0.02, wallMaterial);
        if (hasWall(world.maze, point, "left")) addPlane(`left-${row}-${col}`, x - 0.5, y, 0.13, 1.12, -0.02, wallMaterial);
        if (row === currentSize - 1 && hasWall(world.maze, point, "down")) addPlane(`bottom-${row}-${col}`, x, y - 0.5, 1.12, 0.13, -0.02, wallMaterial);
        if (col === currentSize - 1 && hasWall(world.maze, point, "right")) addPlane(`right-${row}-${col}`, x + 0.5, y, 0.13, 1.12, -0.02, wallMaterial);
      }
    }

    [
      [-boardExtent / 2 + 0.27, boardExtent / 2 + 0.5],
      [boardExtent / 2 - 0.32, boardExtent / 2 + 0.38],
      [-boardExtent / 2 + 0.42, -boardExtent / 2 - 0.34],
      [boardExtent / 2 - 0.5, -boardExtent / 2 - 0.44],
    ].forEach(([x, y], index) => {
      const decoration = MeshBuilder.CreateDisc(`forest-dot-${index}`, { radius: 0.11 + (index % 2) * 0.05, tessellation: 18 }, scene);
      decoration.position = new Vector3(x, y, -0.1);
      decoration.material = accentMaterial;
      staticMeshes.push(decoration as unknown as ReturnType<typeof MeshBuilder.CreatePlane>);
    });

    const goalDisc = MeshBuilder.CreateDisc("goal", { radius: 0.3, tessellation: 32 }, scene);
    goalDisc.position = pointToVector(world.maze.goal, currentSize);
    goalDisc.material = goalMaterial;
    staticMeshes.push(goalDisc as unknown as ReturnType<typeof MeshBuilder.CreatePlane>);

    player = MeshBuilder.CreateDisc("fox", { radius: 0.29, tessellation: 32 }, scene);
    player.material = playerMaterial;
    player.position = pointToVector(snapshot.position, currentSize);
    target = player.position.clone();
    redrawDynamic(snapshot);
    updateCamera();
  };

  const applySnapshot = (snapshot: GameSnapshot) => {
    const levelChanged = snapshot.level.id !== currentSnapshot.level.id;
    currentSnapshot = snapshot;
    if (levelChanged) buildBoard(snapshot);
    target = pointToVector(snapshot.position, currentSize);
    redrawDynamic(snapshot);
    options.onStateChange?.(snapshot);
  };

  buildBoard(currentSnapshot);
  unsubscribe = world.subscribe(applySnapshot);
  scene.onBeforeRenderObservable.add(() => {
    updateCamera();
    const delta = Math.min(1, scene.getEngine().getDeltaTime() / 90);
    player.position.x += (target.x - player.position.x) * delta;
    player.position.y += (target.y - player.position.y) * delta;
    const nudge = currentSnapshot.collisionTick % 2 === 1 ? 1.08 : 1;
    player.scaling.x += (nudge - player.scaling.x) * Math.min(1, delta * 1.6);
    player.scaling.y += (nudge - player.scaling.y) * Math.min(1, delta * 1.6);
  });

  if (options.demo) window.setTimeout(() => world.startDemo(), 650);

  return {
    scene,
    world,
    move: (direction) => world.move(direction),
    undo: () => world.undo(),
    restart: () => world.restart(),
    showHint: () => world.showHint(),
    loadLevel: (id) => world.loadLevel(getLevel(id)),
    dispose: () => {
      unsubscribe();
      world.dispose();
      cleanupBoard();
      scene.dispose();
    },
  };
}
