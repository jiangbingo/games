# Agents Guide

## Repository Overview

Children's logic games (ages 3-6). Managed as a **pnpm workspace monorepo** (single lockfile at repo root):

- **Root (`/`)**: 14 games (11 root game HTML pages + classic-games snake/tetris + maze app) + optional Express backend
- **`kids-maze-world/`**: React/TypeScript maze game (120 levels, Vite build)
- **`backend/`**: optional Express API workspace package (`kids-logic-games-backend`)
- **`packages/*`**: reserved for future shared packages (PWA template, per BACKLOG T3-0)

## Quick Commands

### Workspace root
```bash
pnpm install                        # installs ALL workspace packages at once
pnpm --filter kids-maze-world test  # run maze vitest from anywhere
```

### Root project
```bash
make start          # Python http.server on port 8000
make test           # Basic file existence + HTTP check
make build          # Basic copy to dist/ (css/js/index.html — INCOMPLETE for deploy)
make build-cf       # Full dist/ assembly (root + maze merge) for Cloudflare Pages
make deploy-cf      # Deploy to Cloudflare Pages (primary: bingo-games-hub.pages.dev)
make deploy-root    # Deploy to Vercel (rollback mirror: games-six-omega.vercel.app)
make deploy         # EdgeOne deploy (manual upload of dist/)
```

### kids-maze-world (separate React app)
```bash
pnpm --filter kids-maze-world dev              # Vite dev server (port 3000)
pnpm --filter kids-maze-world build            # vite build + esbuild server bundle
pnpm --filter kids-maze-world build:embedded   # base=/maze/ for root-site merge
pnpm --filter kids-maze-world check            # tsc --noEmit
pnpm --filter kids-maze-world test             # vitest run
pnpm --filter kids-maze-world format           # prettier
```

## Architecture

### Root project
- `index.html` — game hub linking all games (incl. kids-maze-world pages.dev)
- `*.html` — individual game HTML pages (link shared css/kids.css + js/kids-ui.js)
- `js/` — shared modules: `kids-ui.js` (UI lib), `api.js`, `config.js`, `storage.js`, `coloring-studio.js`, `coloring-paint.js`, `difficulty.js`, `bigmodel-client.js`, and `games/` subdir (per-game scripts)
- `css/kids.css` — shared styles (kui- design system)
- `backend/` — Express API (optional, for progress sync)
- `docs/` — design docs and historical reports
- `kids-maze-world/` — React app as a workspace package (no code sharing with root games)
- `pnpm-workspace.yaml` — workspace root: `kids-maze-world`, `backend`, `packages/*`

### kids-maze-world
- `client/` — React frontend (Vite + TailwindCSS 4)
- `server/` — Express backend (bundled with esbuild)
- `shared/` — Shared types between client/server
- Uses pnpm workspaces, React 19, Vite 7, TypeScript 5.6

## Key Conventions

1. **Root games are HTML files with shared assets** — games link `/css/kids.css` and `/js/kids-ui.js`; must be served from repo root (file:// breaks shared asset paths)
2. **Backend is optional** — all games work with localStorage only; backend adds cloud sync
3. **kids-maze-world is isolated** — own package.json and build system; the pnpm lockfile lives at the repo root (workspace mode). Do NOT mix dependencies
4. **Chinese UI** — all user-facing text is Chinese (Simplified)
5. **Mobile-first** — touch optimization is critical, test on iPhone/iPad
6. **No build step for root** — HTML files are served as-is; no transpilation

## Gotchas

- `config.js` must NOT contain a real API key (BigModel/GLM) — a leaked key was removed in `e806c0a` but remains in pushed git history; the key must be revoked/rotated in the BigModel console
- `kids-maze-world` requires **Node.js 22** and pnpm (packageManager: pnpm@10.4.1). Do not use npm — the single lockfile at repo root is pnpm-only
- Root HTML games have no bundled dependencies — vanilla JS via CDN or script tags; always use pnpm at the workspace root, never `npm install`
- The single lockfile is `pnpm-lock.yaml` at the **repo root**; `pnpm.overrides` (nanoid pin) live in the root `package.json`, not in `kids-maze-world/`
- Cloudflare Pages builds the maze with root dir `kids-maze-world` but pnpm walks up to the workspace root — the root lockfile must be committed before any maze deploy
- `make build` only copies css/js/index.html to dist/ — it is incomplete for deployment; use `make build-cf` to assemble the full dist/ (all 12 game pages + classic-games + assets + maze merge)
- `docker-compose.yml` is for optional backend services (PostgreSQL, Redis). Not required for core games

## Deployment

- **Root（主站）**: Cloudflare Pages（bingo-games-hub.pages.dev，`make deploy-cf`）
- **Root（回滚镜像）**: Vercel（games-six-omega.vercel.app，`make deploy-root`）
- **Root（EdgeOne）**: Tencent EdgeOne，`make deploy`（manual upload of `dist/`）
- **kids-maze-world**: Cloudflare Pages (Root dir: `kids-maze-world`, Build: `pnpm build`, Output: `dist/public`)

## Parallel Development Protocol（并行开发协议）

多个 agent/session 并行开发时使用 **git worktree 隔离**。主 worktree（仓库根目录）始终停留在 `main` 分支，只做三件事：merge、BACKLOG.md 登记、部署。开发全部在 `.worktrees/` 下的任务 worktree 中进行（目录已被 gitignore）。

### 每个任务的开局流程

1. 先在 BACKLOG.md 认领任务（条目旁标记 `（进行中 @<session标识>）`），在主 worktree commit——防止两个 session 做同一任务。
2. 创建 worktree：
   ```bash
   git worktree add .worktrees/<task-id> -b feat/<task-id>
   cd .worktrees/<task-id>
   pnpm install   # pnpm 内容寻址存储，安装很快
   ```
3. 在 worktree 内开发、提交。绝不改动主 worktree 的文件。

### 分支命名

- `feat/<task-id-or-name>`，如 `feat/t6-4-a11y`、`feat/t4-1-bank`。
- merge 后删分支；已存在的长期分支（如 `feat/ipad-pwa-baseline`）继续原工作流。

### Merge 回主协议

1. 任务 worktree 内：`git fetch origin && git rebase origin/main`——冲突在自己 worktree 里解决，绝不把冲突带回主目录。
2. 回主 worktree：`git fetch && git merge --no-ff feat/<task-id>`。
3. `git push origin main`，然后 `git worktree remove .worktrees/<task-id>` 并删分支。

### BACKLOG.md 并发写入规则

- 只追加/修改自己任务的条目，绝不重排别人的条目。
- 认领标记 `（进行中 @…）` 与完成状态只在**主 worktree** 写——任务 worktree 不改 BACKLOG.md（避免冲突）。
- rebase 时若 BACKLOG.md 冲突，按「保留双方条目」方式解决。

### 部署锁

- 只有**主 worktree** 能执行 `make deploy-cf` / `make deploy-root`。部署严格串行——同一时间只有一个 session 部署。
- 部署前必须 `git pull`，确保所有已完成任务都包含在内。
- 部署期间版本号注入会临时修改 `sw.js`，任何人不得在主 worktree 动文件，直到部署结束。
