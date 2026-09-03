#!/usr/bin/env node
/**
 * 根站 sw.js 版本号注入/还原（无构建场景，语义对齐迷宫 vite 注入，BACKLOG T3-0c）。
 *
 * 用法：
 *   node tools/inject-sw-version.mjs            # __BUILD_VERSION__ → <git短hash>-<时间戳36进制>
 *   node tools/inject-sw-version.mjs --restore  # 从 sw.js.orig 还原
 *
 * 配合 Makefile deploy-root：注入 → vercel --prod → 还原，保证 git 工作区不脏。
 */
import { execSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const swPath = join(root, "sw.js");
const backupPath = `${swPath}.orig`;
const PLACEHOLDER = "__BUILD_VERSION__";

if (process.argv.includes("--restore")) {
  if (!existsSync(backupPath)) {
    console.error("没有可还原的 sw.js.orig");
    process.exit(1);
  }
  renameSync(backupPath, swPath);
  console.log("sw.js 已还原，工作区恢复干净");
  process.exit(0);
}

if (existsSync(backupPath)) {
  console.error("已存在 sw.js.orig，请先执行 --restore");
  process.exit(1);
}

const source = readFileSync(swPath, "utf8");
if (!source.includes(PLACEHOLDER)) {
  console.error("sw.js 中找不到 __BUILD_VERSION__ 占位符");
  process.exit(1);
}

const shortHash = execSync("git rev-parse --short HEAD", { cwd: root })
  .toString()
  .trim();
const version = `${shortHash}-${Date.now().toString(36)}`;
copyFileSync(swPath, backupPath);
writeFileSync(swPath, source.replaceAll(PLACEHOLDER, version));
console.log(`sw.js 版本号已注入: ${version}`);
