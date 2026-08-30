# Agents Guide

## Repository Overview

Children's logic games (ages 3-6). Managed as a **pnpm workspace monorepo** (single lockfile at repo root):

- **Root (`/`)**: 13 static HTML games + optional Express backend
- **`kids-maze-world/`**: React/TypeScript maze game (120 levels, Vite build)
- **`backend/`**: workspace package (`kids-logic-games-backend`, migrated from npm to pnpm)
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
make build          # Copy to dist/
vercel --prod       # Deploy to Vercel
```

### kids-maze-world (separate project)
```bash
cd kids-maze-world
pnpm install --frozen-lockfile
pnpm dev            # Vite dev server
pnpm build          # Builds to dist/public
pnpm check          # TypeScript type check
pnpm test           # Vitest
pnpm format         # Prettier
```

## Architecture

### Root project
- `index.html` — game hub linking all games (incl. kids-maze-world pages.dev)
- `*.html` — individual game files (single-file games)
- `js/` — shared modules (games.js, app.js, api.js, config.js, storage.js)
- `css/styles.css` — shared styles
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

1. **Root games are standalone HTML files** — each game works independently, can be opened directly in browser
2. **Backend is optional** — all games work with localStorage only; backend adds cloud sync
3. **kids-maze-world is isolated** — own package.json and build system; the pnpm lockfile lives at the repo root (workspace mode). Do NOT mix dependencies
4. **Chinese UI** — all user-facing text is Chinese (Simplified)
5. **Mobile-first** — touch optimization is critical, test on iPhone/iPad
6. **No build step for root** — HTML files are served as-is; no transpilation

## Gotchas

- `config.js` must NOT contain a real API key (BigModel/GLM) — a leaked key was removed in `e806c0a` but remains in pushed git history; the key must be revoked/rotated in the BigModel console
- `kids-maze-world` requires Node.js 22 and pnpm. Do not use npm
- Root HTML games have no bundled dependencies — vanilla JS via CDN or script tags; always use pnpm at the workspace root, never `npm install`
- The single lockfile is `pnpm-lock.yaml` at the **repo root**; `pnpm.overrides` (nanoid pin) live in the root `package.json`, not in `kids-maze-world/`
- Cloudflare Pages builds the maze with root dir `kids-maze-world` but pnpm walks up to the workspace root — the root lockfile must be committed before any maze deploy
- `docker-compose.yml` is for optional backend services (PostgreSQL, Redis). Not required for core games

## Deployment

- **Root**: Vercel (`vercel --prod`), static files only
- **kids-maze-world**: Cloudflare Pages (Root dir: `kids-maze-world`, Build: `pnpm build`, Output: `dist/public`)
