#!/usr/bin/env node
/**
 * Cloudflare Pages 构建：组装完整 dist/（根站 + 迷宫合并部署物）。
 *
 * 背景：历史 `make build` 只拷贝 css/js/index.html，缺 13 个入口页、
 * sw.js、manifest、icons、classic-games（含字体/图标子集），无法用于
 * 完整部署（Vercel 直传仓库根目录绕过了这个问题，CF Pages 需显式输出目录）。
 *
 * 用法：
 *   node tools/build-cf-pages.mjs   # 清空并重建 dist/
 *
 * 配合 Makefile deploy-cf：注入 sw 版本 → 本脚本组装 → wrangler pages deploy dist。
 */
import { cpSync, mkdirSync, rmSync, existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

/** 拷贝 src（相对仓库根）到 dist 同名路径；缺失文件直接报错 */
const copy = (src) => {
  const from = join(root, src);
  if (!existsSync(from)) {
    console.error(`❌ 缺失部署物: ${src}`);
    process.exitCode = 1;
    return;
  }
  cpSync(from, join(dist, src), { recursive: true });
};

// ── 迷宫构建（Vite base=/maze/，仅客户端，无 server esbuild）──
console.log("🔨 构建迷宫（base=/maze/）…");
try {
  execSync("pnpm --filter kids-maze-world build:embedded", {
    cwd: root,
    stdio: "inherit",
    timeout: 120_000,
  });
} catch {
  console.error("❌ 迷宫构建失败");
  process.exit(1);
}

// 迷宫产物拷贝到 dist/maze/，删除迷宫自有 SW（由根站 SW 接管）
const mazePublic = join(root, "kids-maze-world", "dist", "public");
const mazeDest = join(dist, "maze");
cpSync(mazePublic, mazeDest, { recursive: true });
const mazeSw = join(mazeDest, "sw.js");
if (existsSync(mazeSw)) rmSync(mazeSw);
console.log("✅ 迷宫 dist/public → dist/maze/（sw.js 已删除）");

// 13 个入口页 + 3 个历史测试页（与 Vercel 现状对齐，见 BACKLOG T4-1a）
const pages = [
  "index.html",
  "color-matching.html",
  "shape-puzzle.html",
  "memory-cards.html",
  "animal-sounds.html",
  "drawing-board.html",
  "find-differences.html",
  "picture-recognition.html",
  "shape-matching.html",
  "number-counting.html",
  "pattern-match.html",
  "ai-api-test.html",
  "animal-sounds-voice-demo.html",
  "test_category.html",
];
for (const p of pages) copy(p);

// 经典游戏（HTML + 自托管字体子集 + 备案图标）
copy("classic-games");

// 共享资源
copy("css");
copy("js");

// PWA
copy("sw.js");
copy("pwa.js"); // SW 注册 + 更新横幅（每页 <script src="/pwa.js"> 引用，缺了 SW 不注册）
copy("manifest.webmanifest");
copy("favicon.ico");
copy("icons");

// Cloudflare Pages 响应头与重写规则（_headers/_redirects 不会被当作内容下发）
copy("_headers");
copy("_redirects");

// 与 Vercel 行为对齐：README 也在站上
copy("README.md");

// ── 动态注入迷宫预缓存条目到 dist/sw.js ──
// glob dist/maze/assets/*.js + *.css（哈希文件名，每次构建不同）
const mazeAssetsDir = join(mazeDest, "assets");
let mazePrecacheEntries = "";
if (existsSync(mazeAssetsDir)) {
  const files = readdirSync(mazeAssetsDir);
  const hashed = files.filter((f) => f.endsWith(".js") || f.endsWith(".css"));
  const lines = hashed.map((f) => `  "/maze/assets/${f}",`);
  mazePrecacheEntries = [
    "  \"/maze/\",",
    "  \"/maze/index.html\",",
    "  \"/maze/manifest.webmanifest\",",
    "  \"/maze/icons/maze-explorer-192.png\",",
    "  \"/maze/icons/maze-explorer-512.png\",",
    "  \"/maze/assets/maze-leaf-compass-logo.png\",",
    "  \"/maze/assets/forest-ambience-cc0.mp3\",",
    ...lines,
  ].join("\n");
} else {
  console.error("⚠️  dist/maze/assets/ 不存在，跳过迷宫预缓存注入");
}

const swPath = join(dist, "sw.js");
if (existsSync(swPath)) {
  let swContent = readFileSync(swPath, "utf-8");
  swContent = swContent.replace("  /* __MAZE_ENTRIES__ */", mazePrecacheEntries);
  writeFileSync(swPath, swContent);
  console.log(`✅ sw.js PRECACHE 注入 ${mazePrecacheEntries.split("\n").length} 条迷宫条目`);
} else {
  console.error("⚠️  dist/sw.js 不存在，跳过 PRECACHE 注入");
}

if (process.exitCode) {
  console.error("❌ dist/ 组装不完整，见上方缺失清单");
  process.exit(1);
}
console.log("✅ dist/ 组装完成");
