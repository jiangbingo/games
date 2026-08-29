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
| T1-1 | 修更新语义：`pwa.ts:44-46`、`:58-60` 的 `SKIP_WAITING`→立即 reload 丢关卡进度 | 评估 P0 | 要么明确"立即刷新"，要么关卡退出后应用；更新前保存最小会话状态（步数/邮票） |
| T1-2 | 缓存版本治理：`sw.js:1` 固定名 `maze-explorer-shell-v1` → 构建 hash/版本化缓存名 + 新旧缓存切换回归用例 | 评估 P0 | 新版本资源生效、旧缓存可清理、离线不白屏 |
| T1-3 | 两台不同尺寸/系统 iPad 跑完 `IPAD_PWA_TEST_CHECKLIST.md`（6 组 27 项：安装/离线冷启动/横竖屏/Safe Area/后台恢复/音频/更新） | 评估 P0 | 全部通过并记录设备型号、iPadOS、Safari 版本、截图，绑定 commit |

只有 T1 全部通过，才允许合并 main 发布生产。

## 阶段 2：迷宫体验整改（对应 08-28 指令 2+4 的迷宫部分，2-3 天）

| # | 任务 | 验收标准 |
|---|---|---|
| T2-1 | 取消方向盘导航，改**手指触屏实时跟随**：`GameCanvas.tsx` 输入聚合层增加画布跟随模式（沿路径吸附移动），`GameWorld` 复用现有单步移动逻辑保持可测试 | iPad 上手指滑动即跟随；碰壁不计步、撤销/提示不退化；桌面键盘行为保留 |
| T2-2 | 产品决策点：方向盘是否保留为家长面板开关（建议保留，作为无障碍回退） | 决策落档到 HANDOFF 或本文件 |
| T2-3 | 界面遮挡改善：左上角信息卡与其他 UI 遮挡迷宫画面（竖屏尤甚）——重排 Safe Area 布局，画布区让位 | 竖屏/横屏下迷宫完整可见；对照 T1-3 清单 F 组复测 |
| T2-4 | 真机回归：iPad Safari 手指跟随 + 遮挡修复后全流程试玩 | 剧情卡→贴纸→下一关、声音、家长面板不退化 |

## 阶段 3：经典游戏 PWA 化 + 增强（对应指令 1，2-3 天/游戏）

| # | 任务 | 验收标准 |
|---|---|---|
| T3-0 | 抽公共 PWA 模板：从迷宫分支提炼 sw.js/manifest/更新提示为可复用脚手架（避免 12 个游戏各写一份） | 模板文档化，新游戏接入 ≤ 半天 |
| T3-1 | 贪吃蛇 PWA 化 + 内容增强 | 离线可玩、主屏幕安装、触屏跟随 |
| T3-2 | 水墨方块（俄罗斯方块）PWA 化 + 内容增强 | 同上 |
| T3-3 | 视觉增强可借鉴：锦鲤禅庭方案（涟漪、禅意庭院，Manus 08-14 会话已验证过玩法） | 儿童可读性优先，不为压缩降辨识度 |

## 阶段 4：10 个儿童逻辑游戏 PWA 化 + 增强（对应指令 3，批量进行）

| # | 任务 | 验收标准 |
|---|---|---|
| T4-1 | 用 T3-0 模板批量 PWA 化：颜色配对、形状拼图、记忆翻牌、动物叫声、涂鸦板、找不同、看图识物、形状配对、数字认知、模式匹配 | 全部离线可玩、可安装 |
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
