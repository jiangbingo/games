import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import { GameWorld } from "./GameWorld";
import { getLevel } from "./levels";
import { hasWall } from "./maze";
import { getThemePresentation } from "./themePresentation";
import type { Direction, GameSnapshot, Point } from "./types";

export type GameHandle = {
  scene: Scene;
  world: GameWorld;
  move: (direction: Direction) => boolean;
  undo: () => void;
  restart: () => void;
  showHint: () => void;
  loadLevel: (id: number) => void;
  pickWorld: (clientX: number, clientY: number) => { x: number; y: number };
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
  const emojiTextures = new Map<string, DynamicTexture>();
  let orthoHalfWidth = 10;
  let orthoHalfHeight = 10;
  let player = MeshBuilder.CreateDisc("fox", { radius: 0.28, tessellation: 32 }, scene);
  let target = new Vector3();
  let currentSnapshot = world.snapshot;
  let currentSize = currentSnapshot.level.size;
  let trailMaterial: StandardMaterial | null = null;
  let hintMaterial: StandardMaterial | null = null;
  let celebrationMaterial: StandardMaterial | null = null;
  let routeMarkerMaterial: StandardMaterial | null = null;
  let themeArtTexture: DynamicTexture | null = null;
  let themeArtThemeId = -1;
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

  const makeEmojiMaterial = (name: string, emoji: string) => {
    let texture = emojiTextures.get(emoji);
    if (!texture) {
      texture = new DynamicTexture(`${name}-texture`, { width: 128, height: 128 }, scene, true);
      texture.hasAlpha = true;
      const context = texture.getContext() as unknown as CanvasRenderingContext2D;
      context.font = "96px 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(emoji, 64, 70);
      texture.update();
      emojiTextures.set(emoji, texture);
    }
    const material = new StandardMaterial(name, scene);
    material.emissiveTexture = texture;
    material.opacityTexture = texture;
    material.specularColor = new Color3(0, 0, 0);
    material.disableLighting = true;
    material.backFaceCulling = false;
    materials.push(material);
    return material;
  };

  /* 主题水印必须先经 2D canvas 降采样再入 GPU：iPad Safari 对 5MB 原图直接上传会丢 WebGL 上下文，导致整个迷宫白屏。 */
  const makeThemeArtTexture = (themeId: number) => {
    const texture = new DynamicTexture("theme-art-texture", { width: 512, height: 512 }, scene, true);
    let disposed = false;
    texture.onDisposeObservable.addOnce(() => { disposed = true; });
    const image = new Image();
    image.onload = () => {
      if (disposed) return;
      const context = texture.getContext() as unknown as CanvasRenderingContext2D;
      context.clearRect(0, 0, 512, 512);
      const scale = Math.max(512 / image.width, 512 / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      context.drawImage(image, (512 - width) / 2, (512 - height) / 2, width, height);
      texture.update();
    };
    image.src = getThemePresentation(themeId).assetUrl;
    return texture;
  };

  const pickWorld = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect();
    const nx = ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
    const ny = 1 - ((clientY - rect.top) / Math.max(1, rect.height)) * 2;
    return { x: nx * orthoHalfWidth, y: ny * orthoHalfHeight };
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
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    const aspect = width / height;
    const extent = currentSize + 1.1;
    let halfHeight = extent / 2;
    if (halfHeight * aspect < extent / 2) halfHeight = (extent / 2) / aspect;
    camera.orthoTop = halfHeight;
    camera.orthoBottom = -halfHeight;
    camera.orthoLeft = -halfHeight * aspect;
    camera.orthoRight = halfHeight * aspect;
    orthoHalfWidth = camera.orthoRight;
    orthoHalfHeight = camera.orthoTop;
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
    const { paper, sky, wall, trail, goal, accent } = snapshot.level.theme.palette;
    const backdropMaterial = makeMaterial("forest-sky", sky);
    const paperMaterial = makeMaterial("maze-paper", paper);
    const wallMaterial = makeMaterial("maze-hedges", wall);
    const goalMaterial = makeMaterial("acorn-parcel", goal);
    const accentMaterial = makeMaterial("forest-dots", accent, 0.5);
    trailMaterial = makeMaterial("fox-footprints", trail, 0.88);
    hintMaterial = makeMaterial("firefly-hints", goal, 0.74);
    celebrationMaterial = makeMaterial("delivery-sparkles", accent, 0.95);
    routeMarkerMaterial = makeMaterial("route-stamps", accent, 0.9);
    const boardExtent = currentSize + 0.72;

    addPlane("sky", 0, 0, boardExtent + 3.2, boardExtent + 3.2, 0.45, backdropMaterial);
    addPlane("paper", 0, 0, boardExtent, boardExtent, 0.25, paperMaterial);

    const themeId = snapshot.level.theme.id;
    if (themeArtThemeId !== themeId || !themeArtTexture) {
      themeArtTexture?.dispose();
      themeArtTexture = makeThemeArtTexture(themeId);
      themeArtThemeId = themeId;
    }
    const artMaterial = new StandardMaterial("theme-art", scene);
    artMaterial.emissiveTexture = themeArtTexture;
    artMaterial.specularColor = new Color3(0, 0, 0);
    artMaterial.disableLighting = true;
    artMaterial.backFaceCulling = false;
    artMaterial.alpha = 0.16;
    materials.push(artMaterial);
    addPlane("theme-art", 0, 0, boardExtent - 0.3, boardExtent - 0.3, 0.12, artMaterial);

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

    const goalCenter = pointToVector(world.maze.goal, currentSize);
    const goalDisc = MeshBuilder.CreateDisc("goal", { radius: 0.3, tessellation: 32 }, scene);
    goalDisc.position = goalCenter;
    goalDisc.material = goalMaterial;
    staticMeshes.push(goalDisc as unknown as ReturnType<typeof MeshBuilder.CreatePlane>);

    const goalEmoji = MeshBuilder.CreatePlane("goal-emoji", { width: 0.5, height: 0.5 }, scene);
    goalEmoji.position = new Vector3(goalCenter.x, goalCenter.y, -0.4);
    goalEmoji.material = makeEmojiMaterial("goal-emoji-material", getThemePresentation(snapshot.level.theme.id).icon);
    staticMeshes.push(goalEmoji);

    player = MeshBuilder.CreatePlane("fox", { width: 0.66, height: 0.66 }, scene);
    player.material = makeEmojiMaterial("fox-emoji-material", "🦊");
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
    pickWorld,
    dispose: () => {
      unsubscribe();
      world.dispose();
      cleanupBoard();
      emojiTextures.forEach((texture) => texture.dispose());
      themeArtTexture?.dispose();
      themeArtTexture = null;
      scene.dispose();
    },
  };
}
