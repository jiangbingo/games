#!/usr/bin/env node
/**
 * Cloudflare Pages 构建：组装完整 dist/（根站全部部署物）。
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
import { cpSync, mkdirSync, rmSync, existsSync } from "node:fs";
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

if (process.exitCode) {
  console.error("❌ dist/ 组装不完整，见上方缺失清单");
  process.exit(1);
}
console.log("✅ dist/ 组装完成");
