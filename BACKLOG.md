# games 仓库待办规划（2026-08-30）

> 依据：Manus 档案（HANDOFF.md 第 7/9 节、kids_maze_pwa_comprehensive_evaluation、08-28 用户四点指令）+ 2026-08-30 本机实测。
> 覆盖范围：全仓库（主页 12 个游戏 + kids-maze-world 子项目）。

## 现状核查（2026-08-30 实测，规划的前提）

- 当前分支 `feat/ipad-pwa-baseline`，**领先 origin/main 5 个提交且未推送**：7ec5b02 PWA 基线、1b7a442 路线邮票、e58557f 交接文档、e806c0a 移除硬编码 BigModel key（+e866d0d 之前的迷宫本体）
- `main` 无 manifest/sw.js——**线上 kids-maze-world.pages.dev 仍是无 PWA 旧版**
- PWA 文件已在分支上就位：`client/public/manifest.webmanifest`、`client/public/sw.js`、`client/src/pwa.ts`
- 仓库根目录 = 主页（index.html 引 10 个儿童逻辑游戏 + classic-games/）+ kids-maze-world/ 子项目

## 阶段 0：基线固定（约 0.5 天，先于一切改动）

| # | 任务 | 验收标准 |
|---|---|---|
| T0-1 | ✅ 2026-08-30 完成：固化迷宫算法测试 `client/src/game/maze.test.ts`：120 关 BFS 可解性、相同 seed 确定性、边界墙、步进一致性 | 已达成：`pnpm test` 12/12 通过（maze 5 + activity 4 + GameWorld 3），test 脚本 Manus 已预先加好 |
| T0-2 | ✅ 2026-08-30 完成：`client/src/game/activity.test.ts`——午夜前后分日、零填充、7 天窗口、重复去重（fake timers + localStorage stub，未改生产代码） | 已达成：`formatLocalDate()`、`playtimeKeyFor`、`readWeeklyActivity` 均有午夜用例覆盖 |
| T0-3 | 决策：分支合并路径——push `feat/ipad-pwa-baseline` 到 origin 触发 Cloudflare Preview（**需用户明确授权 push**；SSH 异常时按 HANDOFF 5.2 处理，不改全局配置） | Preview URL 可访问且带 PWA |

依赖：无。产物：后续所有改动的回归保护网。

## 阶段 1：P0 门禁——迷宫 PWA 生产准入（1-2 天，真机为主）

| # | 任务 | 来源/证据 | 验收标准 |
|---|---|---|---|
| T1-1 | ✅ 2026-08-30 完成：`pwa.ts` 删除 `controllerchange`→立即 `reload()`——新 SW 接管后仅收起横幅，不打断进行中关卡，下次打开自动用新版（与家长面板"重开后生效、进度保留"文案一致；关卡/邮票/进度本就持久化在 localStorage） | 语义=关卡退出后应用，进度零丢失；待 T1-3 真机更新流程验证 |
| T1-2 | ✅ 2026-08-30 完成：`sw.js` 缓存名 `__BUILD_VERSION__` 由 vite 构建时注入（每次部署自动换代+activate 清旧缓存）；请求两档策略——导航与非 /assets/ 走 networkFirst（离线回退 index.html）；/assets/ 一律 cacheFirst（vite 产物全带内容 hash、不可变，原设想的 stale-while-revalidate 档无陈旧风险，并入此档，见 sw.js 内注释） | `pnpm build` 产物注入验证 ✓（`maze-explorer-shell-mtf9y9b5`）、node --check 语法 ✓；新旧缓存切换待 T1-3 真机回归 |
| T1-3 | 两台不同尺寸/系统 iPad 跑完 `IPAD_PWA_TEST_CHECKLIST.md`（6 组 27 项：安装/离线冷启动/横竖屏/Safe Area/后台恢复/音频/更新） | 评估 P0 | 全部通过并记录设备型号、iPadOS、Safari 版本、截图，绑定 commit |

只有 T1 全部通过，才允许合并 main 发布生产。

> **发布记录（2026-08-30）**：用户指令"合并到main发布"，feat/ipad-pwa-baseline 提前放行合并 main。T1-3 双 iPad 真机清单与 T2-4 真机回归**尚未执行**，结果待补录；补录前如真机发现 P0 问题，按 OPS_RUNBOOK 以最近一次成功生产部署回滚。

## 阶段 2：迷宫体验整改（对应 08-28 指令 2+4 的迷宫部分，2-3 天）

| # | 任务 | 验收标准 |
|---|---|---|
| T2-1 | ✅ 2026-08-30 完成：方向盘已删，画布手指实时跟随上线——`follow.ts` 纯函数按主导轴消费位移（阈值 0.62 格、50ms tick、每 tick ≤2 步、碰壁只清该轴意图可顺势拐弯），`GameWorld` 复用单步移动，桌面键盘保留；本地浏览器已验证跟随/键盘/碰壁语义 | 已达成（实现方式与原设想的"全路径 BFS 吸附"不同：改为方向消费模型以保留路口决策、不塌难度）；iPad 真机复测并入 T2-4 |
| T2-2 | ✅ 决策落档：2026-08-30 用户拍板**彻底移除方向盘**，不做家长面板开关回退 | 已落档本文件 |
| T2-3 | ✅ 2026-08-30 完成（二轮布局重排）：卡片从"悬浮画布上"改为文档流占位——shell 改 flex 列（header → hud-row 卡片行 → maze-stage 画布独占剩余空间），从结构上根除遮挡；相机 updateCamera 按舞台尺寸精确拟合棋盘（删 aspect 钳制 hack），任意视口迷宫完整入画；setPointerCapture 加 Safari 抛错防护 | 桌面 820×1180 竖屏 + 1180×820 横屏截图验证零遮挡、棋盘完整；iPad 真机复测并入 T2-4 |
| T2-4 | 真机回归：iPad Safari 手指跟随 + 遮挡修复后全流程试玩 | 剧情卡→贴纸→下一关、声音、家长面板不退化 |
| T2-5 | ✅ 2026-08-30 完成（用户新增需求）：难度提升（120 关 5-10 格 → **8-15 格** 10 档 × 12 关，大迷宫邮票上限 3→4 枚）+ 主题形象化（12 主题各配终点 emoji：火车🚂/蜂蜜🍯/蘑菇🍄等，画布终点=主题色圆盘+emoji、小狐狸换🦊、进度卡/成功条/地图章节同步图标）+ **主题背景水印**（主题大图**先经 2D canvas 降采样至 512² 再入 GPU**（α=0.16 嵌入纸张层 z=0.12，随主题切换，按 themeId 缓存；⚠️ 直接上传 5MB 原图会让 iPad Safari 丢 WebGL 上下数→全屏白屏，2026-08-30 真机踩坑后修复））+ **HUD 自动隐藏**（进度卡/任务卡/工具条静置 4s 淡出并收起占位、点按任意处唤回，播放区最大化）+ **环境音随主题切换**（森林底噪按主题 texture 变速 soft 0.92/sine 1.0/triangle 1.06 + 用主题 base/bright 音色参数合成极轻持续和声垫（增益 0.02、0.12Hz 呼吸 LFO、切换时 2s 淡入淡出），零新增素材） | `pnpm test` 17/17 绿；隐藏/唤回桌面截图已验证；水印与音频待真机确认 |

## 阶段 3：经典游戏 PWA 化 + 增强（对应指令 1，2026-08-30 详细化）

### 架构决策 D1（待用户拍板，推荐方案 A）

调研事实（2026-08-30 实测）：根级 `assets/` 为空，13 个游戏全部自包含单文件（11-52KB，合计约 133KB）；主页 index.html 零外部引用（无 script/link）；仅 memory-cards.html 引 `js/storage.js`，ai-api-test.html（非入口页）引 3 个 js。全站离线预缓存总量 <1MB。

- **方案 A（推荐）：单站点 PWA——「游戏中心」整体可安装**。根级一套 manifest + sw.js + 图标 + 更新横幅，一次安装覆盖全部 13 个游戏并全量预缓存。理由：3-6 岁用户是家长装一次、孩子点一个图标进枢纽自选；PWA 基建 ×1 而非 ×12；与迷宫（独立域名独立 PWA）互不影响。T4-1 在此方案下收敛为「预缓存清单 + 每页 meta」，接近零成本。
- 方案 B（备选）：每游戏目录化独立 PWA（12 套 manifest/sw/图标，manifest scope 限制在各自目录）。仅当"每个游戏必须能单独安装到主屏幕"是硬需求时选，否则是纯基建负担。

### T3-0 根站点 PWA 基建（按方案 A，0.5-1 天）

| # | 子任务 | 落点 | 验收 |
|---|---|---|---|
| T3-0a | 根级 `manifest.webmanifest`（name=游戏中心（名字拍板时可改）、zh-CN、standalone、theme 色对齐主页、192/512 图标含 maskable） | 仓库根 | 安装提示正常、Lighthouse installable |
| T3-0b | 根级 `sw.js`：迷宫版改编（同源守卫、两档策略保留），预缓存=主页+13 游戏页+`js/storage.js`；导航 networkFirst 离线回退主页，同源静态 cacheFirst | 仓库根 | 断网后全部游戏可玩 |
| T3-0c | 版本注入（无构建场景）：sw.js 源码保留 `__BUILD_VERSION__` 占位；新增 `tools/inject-sw-version.mjs` + `make deploy-root`（注入 → `vercel --prod` → 还原工作区），与迷宫 vite 注入同语义 | tools/ + Makefile | 部署产物含真实版本号、git 工作区不脏 |
| T3-0d | `pwa.js`（vanilla 更新横幅）：SW 注册 + installing→installed 提示 + `SKIP_WAITING` postMessage + controllerchange 只收横幅不刷新（与迷宫 T1-1 同语义）；index.html 引入并挂横幅 UI | 仓库根 pwa.js | 更新不打断进行中的游戏 |
| T3-0e | vercel.json 增加 headers：`/sw.js` no-cache、`/manifest.webmanifest` no-cache（builds 模式若不生效则改走 routes 头） | vercel.json | 线上响应头可验证 |
| T3-0f | 13 个游戏页 + 主页批量加 `<link rel="manifest">`、`theme-color`、`apple-mobile-web-app-*` meta（脚本化一次性修改）；生成主屏图标 192/512 | *.html + icons/ | iPad Safari 可添加到主屏幕 |

### T3-1 贪吃蛇增强（0.5-1 天）

- 触控审计：现有 5 处 touch/pointer 处理对齐 T2-1 范式（手指跟随、意图轴消费、碰壁语义），桌面键盘保留
- 内容增强（T3-3 锦鲤禅庭视觉参考，儿童可读性优先）：主题化皮肤 ×2、吃食反馈动效（缩放/涟漪，只用 transform/opacity）、速度随得分平滑爬升
- 验收：生产站离线可玩、iPad Safari 手指跟随无误触、动画不掉帧

### T3-2 水墨方块增强（1-1.5 天）

- 触控方案（现状仅 1 处 touch 处理，是主要工作量）：横向拖动=平移（位移消费模型，复用迷宫 follow 思路）、点画布=旋转、下滑=软降/速降；屏幕按钮保留但降为辅助
- 本地化：`cdn.hailuoai.com` 远程 logo 替换为本地资源（离线不缺图）；minimax 页脚署名与外链保留（来源合规）
- 内容增强：行消除"墨晕扩散"动效 + 连击提示；难度曲线复核（前 10 行宽容）
- 验收：同 T3-1 + 单手可完整打一局

### 阶段 3 并行项（不阻塞，随时可做）

- T1-3 双 iPad 清单 + T2-4 真机回归：改对**生产站**执行（kids-maze-world.pages.dev），结果补录本文件
- T6-1 日期键统一 / T6-2 材质复用：随 T3 收尾穿插

| 原任务编号 | 对应关系 |
|---|---|
| T3-0 | 由上方 T3-0a-f 取代（原"每游戏模板脚手架"随 D1 方案 A 调整为"站点级基建"；若拍板 B 则恢复脚手架形态） |
| T3-1 / T3-2 | 上方详细化，验收标准合并了原 T3-3 的儿童可读性要求 |

## 阶段 4：10 个儿童逻辑游戏 PWA 化 + 增强（对应指令 3，批量进行）

| # | 任务 | 验收标准 |
|---|---|---|
| T4-1 | 批量 PWA 化 10 个逻辑游戏：颜色配对、形状拼图、记忆翻牌、动物叫声、涂鸦板、找不同、看图识物、形状配对、数字认知、模式匹配。D1 拍板方案 A 后收敛为「预缓存清单核对 + 每页 meta 抽查」（T3-0f 已批量覆盖，此处核对补漏）；拍板方案 B 则用脚手架逐游戏目录化 | 全部离线可玩、可安装 |
| T4-2 | 内容增强：题库三级分级（种子/新芽/星星）、错题回顾、家长周报——机制参考 Manus「奇趣儿童乐园」设计（对话 VpNw…，代码未落盘需重建） | 每游戏至少一个增强点上线 |
| T4-3 | 统一主页统计口径："15+"、旧 README"13 个"与实际入口数不一致 | 主页、README、CLNZ 盘点三方一致 |

## 阶段 5：主页全局 iPad 适配（对应指令 4，1-2 天）

| # | 任务 | 验收标准 |
|---|---|---|
| T5-1 | 各游戏卡片操作栏不遮挡游戏视线；卡片点击区与游戏画布分层 | iPad 横竖屏逐游戏过一遍 |
| T5-2 | 统一触屏跟随交互范式（与 T2-1 同一套输入约定） | 手指操作在 13 个游戏中行为一致 |

## 阶段 6：质量债（穿插在 2-5 各阶段收尾时做，不单独立阶段 blocking）

| # | 任务 | 证据 |
|---|---|---|
| T6-1 | 日期键统一：`GameCanvas.tsx:43` UTC → 复用 `activity.ts:8` 的本地日期（配合 T0-2 单测） | HANDOFF P2 |
| T6-2 | Babylon 动态材质复用：`scene.ts:67/92/95` 3 个实例复用或随 mesh dispose；`?demo` 长路径 + iPad 试跑 | HANDOFF P1 |
| T6-3 | 首屏 73MB → 主题 PNG/logo 转 WebP/AVIF + hash 文件名 + 更新 `themePresentation.ts` 等引用；评估 Babylon 分包（先量化再改） | HANDOFF P1 |
| T6-4 | 无障碍：弹层 focus trap、焦点回还、删 `maximum-scale=1`、家长控制文案"诚实化"（建议时长 vs 硬控制二选一） | 评估 P1/P3 |
| T6-5 | `_headers` 缓存策略与 hash 文件名配套（T6-3 完成后） | HANDOFF P2 |

## 阶段 7：内容扩展与素材合规（最后启动）

| # | 任务 | 来源 |
|---|---|---|
| T7-1 | 新玩法 P0：森林路线拼图（旋转连通管路）+ 邮包配对（翻卡记忆）——按 `GAME_EXPANSION_RESEARCH.md` A-D 四阶段 | 已有蓝图 |
| T7-2 | 新游戏立项：奇妙修理岛（MVP 规格+技术规格已在 Manus 档案，首关包 ≤4MiB 约束） | `agent-artifacts/manus-takeover/knowledge/personal-assets.md` |
| T7-3 | ASSET_LEDGER 12 张主题 PNG 授权补证（仅森林音频已有 CC0 记录） | ASSET_LEDGER.md |

## 执行纪律（每个任务都适用）

1. **不主动 commit/push/tag/部署**——每阶段完成后给 diff 摘要，等明确指令
2. 每阶段 Review → Verify → Simplify；验证门槛 `pnpm check && pnpm build && git diff --check`
3. 迷宫算法/关卡参数改动后必须重跑 120 关审计（T0-1 固化后即 `pnpm test`）
4. 视觉/交互改动必须在真实 iPad Safari 验证（Mac 设备模式只能预检布局）
5. 禁止：改回 `/manus-storage/` 路径、误建 Worker（本项目是 Pages）、提交 dist//node_modules/、删除 `_headers`
6. localStorage 数据遵循 `DATA_POLICY.md`：只增不改、ID 稳定、先读后写、`maze-storage-version` 演进

## 建议节奏

- **第 1 周**：T0 全部 + T1（P0 门禁）→ 迷宫 PWA 具备生产准入
- **第 2 周**：T2 迷宫手指跟随 + 遮挡改善（用户最关心的体验项）+ T6-1/T6-2 穿插
- **第 3-4 周**：T3 经典游戏 ×2 → T4 逻辑游戏批量 → T5 主页适配 + T6-3/T6-4 收尾
- **之后**：T7 扩展按 GAME_EXPANSION_RESEARCH 节奏推进

> 注：当前分支领先 origin/main 5 个提交未推送，含 1 个移除硬编码 key 的修复——阶段 0 的 T0-3 授权推送后即可消除这层悬置状态。
