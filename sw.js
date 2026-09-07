/* 游戏中心 Service Worker —— 由 kids-maze-world/client/public/sw.js 改编
 * （BACKLOG T3-0b，架构决策 D1 方案 A：整站一个 PWA，一次安装覆盖全部本地游戏）。
 *
 * 预缓存范围 = 主页 + 13 个本地游戏页 + 涂色画工坊 js + 共享 js/storage.js + 图标。
 * 迷宫（kids-maze-world.pages.dev）为外部域名，跨域不可由本源 SW 预缓存，
 * 其离线能力由迷宫自己的 PWA 负责。
 *
 * 缓存名含 __BUILD_VERSION__，每次部署由 tools/inject-sw-version.mjs 注入真实版本
 * （与迷宫 vite 构建注入同语义），activate 时整代更换、删除旧缓存——
 * 因此本站静态文件虽无内容 hash 文件名，cacheFirst 也不会跨版本陈旧。
 */
const CACHE_NAME = "games-hub-shell-__BUILD_VERSION__";

const PRECACHE = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/js/storage.js",
  "/pwa.js",
  "/color-matching.html",
  "/shape-puzzle.html",
  "/memory-cards.html",
  "/animal-sounds.html",
  "/drawing-board.html",
  "/find-differences.html",
  "/picture-recognition.html",
  "/shape-matching.html",
  "/number-counting.html",
  "/pattern-match.html",
  "/coloring-studio.html",
  "/js/coloring-studio.js",
  "/js/coloring-paint.js",
  "/js/coloring-lineart.js",
  "/classic-games/snake-game.html",
  "/classic-games/tetris-ink.html",
  "/classic-games/fonts/MaShanZheng-sub.woff2",
  "/classic-games/fonts/NotoSerifSC-400-sub.woff2",
  "/classic-games/fonts/NotoSerifSC-700-sub.woff2",
  "/classic-games/icons/beian-icon.png",
  /* __MAZE_ENTRIES__ */
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith("games-hub-") && key !== CACHE_NAME)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

/* 缓存匹配 + 平台 URL 归一化回退。
 * Cloudflare Pages 会把 /x.html 308 到 /x，Chrome 的 cache.addAll 跟随重定向后
 * 以最终 URL（无扩展名）为键存储；Vercel 则直接以 .html 为键。
 * 因此先按原请求匹配，未命中再试去扩展名变体，两平台皆可离线命中。 */
async function matchWithFallback(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const url = new URL(request.url);
  if (url.pathname.endsWith(".html")) {
    url.pathname = url.pathname.replace(/\.html$/, "");
    return caches.match(url.toString());
  }
  return null;
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await matchWithFallback(request);
    if (cached) return cached;
    /* 仅导航请求回退到主页外壳；子资源失败直接报错，
       避免把 HTML 当 JS/CSS 喂出去（迷宫版无此分支，本站页面结构不同故细化）。
       主页键在 Vercel 为 /index.html、CF Pages 为 /，逐一尝试。 */
    if (request.mode === "navigate") {
      /* /maze/* 导航回退迷宫外壳，其余回退主页外壳。
         键在 Vercel 为 /index.html、CF Pages 为 /，逐一尝试。 */
      if (url.pathname.startsWith("/maze/")) {
        return (
          (await caches.match("/maze/index.html")) || (await caches.match("/maze/"))
        );
      }
      return (
        (await caches.match("/index.html")) || (await caches.match("/"))
      );
    }
    return Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  /* 导航 networkFirst（离线回退缓存/主页），同源静态 cacheFirst（整代换缓存保证新鲜）。 */
  if (event.request.mode === "navigate") {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(cacheFirst(event.request));
});
