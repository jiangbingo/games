#!/usr/bin/env node
/**
 * 批量给主页 + 12 个本地游戏页加 PWA meta（BACKLOG T3-0f，一次性脚本，幂等）。
 *
 * 每页插入（若不存在）：
 *   - <link rel="manifest" href="/manifest.webmanifest">
 *   - theme-color / mobile-web-app-capable / apple-mobile-web-app-* 三件套
 *   - apple-touch-icon → /icons/icon-192.png
 * 所有页面挂 <script src="/pwa.js" defer></script>（T3-2 补：原先只在 index 挂，
 * 直链/主屏图标直接进子游戏页时 SW 永不注册，离线失效；pwa.js 同 scope 同 sw.js，
 * 重复调用安全，更新横幅也因此全站可用）。
 *
 * 全部用站点根绝对路径，页面在 / 与 /classic-games/ 下均可用。
 * 已含 rel="manifest" 的文件跳过 meta 部分（幂等），但仍检查 pwa.js 注入。
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const PAGES = [
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
  "classic-games/snake-game.html",
  "classic-games/tetris-ink.html",
];

const THEME_COLOR = "#667eea";

function pwaBlock(title) {
  return [
    `<link rel="manifest" href="/manifest.webmanifest">`,
    `<meta name="theme-color" content="${THEME_COLOR}">`,
    `<meta name="mobile-web-app-capable" content="yes">`,
    `<meta name="apple-mobile-web-app-capable" content="yes">`,
    `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`,
    `<meta name="apple-mobile-web-app-title" content="${title}">`,
    `<link rel="apple-touch-icon" href="/icons/icon-192.png">`,
  ].join("\n");
}

let changed = 0;
for (const rel of PAGES) {
  const path = join(root, rel);
  let html = readFileSync(path, "utf8");

  // pwa.js 注入（独立于 meta，页面已有 manifest 时也要补挂）
  if (!html.includes("/pwa.js")) {
    html = html.replace(
      /(\s*)<\/body>/,
      `\n$1    <script src="/pwa.js" defer></script>$1</body>`,
    );
    writeFileSync(path, html);
    console.log(`已挂 pwa.js: ${rel}`);
  }

  if (html.includes('rel="manifest"')) {
    console.log(`跳过（已有 manifest）: ${rel}`);
    continue;
  }

  const titleMatch = html.match(/<title>([^<]*)<\/title>/);
  const title = titleMatch ? titleMatch[1].trim() : "游戏中心";

  // 插在 viewport meta 行之后（charset 之后、其它内容之前），缩进对齐该行
  const viewportRe = /([ \t]*)(<meta\s+name="viewport"[^>]*>\s*\n)/;
  const m = html.match(viewportRe);
  if (!m) {
    console.error(`未找到 viewport meta，跳过: ${rel}`);
    continue;
  }
  const indent = m[1];
  const block = pwaBlock(title)
    .split("\n")
    .map((line) => indent + line)
    .join("\n");
  html = html.replace(viewportRe, `$1$2${block}\n`);

  writeFileSync(path, html);
  changed++;
  console.log(`已更新: ${rel} (apple title: ${title})`);
}
console.log(`完成，共更新 ${changed}/${PAGES.length} 个页面`);
