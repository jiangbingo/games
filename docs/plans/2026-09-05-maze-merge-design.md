# 迷宫并入根站设计（2026-09-05 定稿）

## 目标

把 `kids-maze-world`（React迷宫）并入根站 `/maze/` 路径，形成单域名、单SW、单部署的综合性站点。迷宫独立站 `kids-maze-world.pages.dev` 保留在线作为回滚兜底。

## 前置条件（源码兼容性）

迷宫源码中 4 处硬编码绝对路径需要改为 `import.meta.env.BASE_URL` 前缀，同一份源码同时兼容独立站（`/`）和合并站（`/maze/`）：

| 文件 | 引用 | 改动 |
|---|---|---|
| `client/src/game/themePresentation.ts` | 12 个 `assetUrl: "/assets/theme-xxx.png"` | 加 BASE_URL 前缀 |
| `client/src/game/SoundManager.ts` | `/assets/forest-ambience-cc0.mp3` | 加 BASE_URL 前缀 |
| `client/src/components/GameCanvas.tsx` | `/assets/maze-leaf-compass-logo.png` | 加 BASE_URL 前缀 |

`pwa.ts` 的 `.register("/sw.js")` **无需改动**：合并后 `/sw.js` 恰好指向根站 SW（作用域 `/` 覆盖 `/maze/`），独立站下仍是迷宫自己的 SW，零改动双兼容。

## 构建流水线

### 1. 迷宫新增 `build:embedded` 脚本

`package.json`：
```json
"build:embedded": "vite build --base=/maze/"
```

只跑 Vite 构建，跳过无用的 server esbuild 步骤。

### 2. build-cf-pages.mjs 扩展

当前 24 项预缓存 → 增加迷宫外壳：

1. 运行 `pnpm --filter kids-maze-world build:embedded`
2. 将迷宫 `dist/public/` 拷贝到根站 `dist/maze/`
3. **删除 `dist/maze/sw.js`**（迷宫 SW 不再需要，根 SW 接管）
4. 动态生成 PRECACHE：原有 24 项 + 迷宫外壳：
   - `/maze/`、`/maze/index.html`、`/maze/manifest.webmanifest`
   - `/maze/assets/maze-leaf-compass-logo.png`（3.2MB）
   - `/maze/assets/forest-ambience-cc0.mp3`（1.2MB）
   - `/maze/icons/maze-explorer-192.png`、`/maze/icons/maze-explorer-512.png`
   - glob `/maze/assets/*.js` + `/maze/assets/*.css`（~2.1MB，含哈希文件名）
5. 主题图（57MB）**不进预缓存**，运行时 cacheFirst

预缓存总量约 **7MB**（与迷宫独立站现预缓存持平）。

### 3. sw.js 改动

**预缓存列表**：从硬编码改为构建时动态写入（build-cf-pages.mjs 输出一份 manifest.json，sw.js 读取）

**导航回退**：`/maze/*` 路径的离线导航 fallback 改为 `/maze/index.html`（迷宫无路由，仅需 shell 兜底）

### 4. manifest 改相对路径

`kids-maze-world/client/public/manifest.webmanifest`：
- `start_url: "./"` （原 `"/"`）
- `scope: "./"` （原 `"/"`）
- `icons[].src: "icons/maze-xxx.png"` （原 `"/icons/maze-xxx.png"`）

相对路径在独立站和合并站都正确。Vite 构建期自动把 index.html 里的 manifest 链接改写为 `/maze/manifest.webmanifest`。

### 5. 根站 index.html 迷宫卡片

`href="https://kids-maze-world.pages.dev"` → `href="/maze/"`

### 6. _redirects

追加：`/maze /maze/ 301`

## 离线策略

| 资源 | 策略 | 备注 |
|---|---|---|
| 迷宫 shell（index.html、JS、CSS） | 预缓存 | 构建时 glob 哈希文件 |
| 迷宫图标、logo、mp3 | 预缓存 | 与独立站现状持平 |
| 迷宫主题图（12套×~4.7MB） | cacheFirst（按需缓存） | 首玩在线缓存，离线前未玩过的主题缺图——与独立站现状一致 |
| 迷宫地图（Google Maps代理） | 运行时网络 | 离线无地图——与独立站现状一致 |
| Google Fonts | 外链 | 离线回退系统字体——与独立站现状一致 |

## 兼容与回滚

- 迷宫独立站 `kids-maze-world.pages.dev` 保持在线不动（CF Pages Git 集成）
- 根站 Vercel `games-six-omega.vercel.app` 保持在线不动（回滚兜底）
- 合并站 `games-hub-nsd.pages.dev` 为新增部署（追加而非替换）

## 验证清单

1. SW 激活接管（controller 非 null）
2. 预缓存 N/N（构建时确定数量，运行时校验）
3. 在线渲染主页 13 卡片
4. 在线渲染迷宫 `/maze/`（React 挂载、标题正确）
5. 离线首页渲染（game-card x13）
6. 离线 tetris 直链可玩
7. 离线 snake 直链可玩
8. 离线迷宫 `/maze/` 直链可渲染（React 挂载）
9. 颜色认知离线可玩（按钮 ≥ 4）
10. 控制台零错误
11. curl 检查：`/maze/` → 200，`/maze` → 301
