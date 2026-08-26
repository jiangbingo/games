# 迷宫小小探险家：后续 AI 开发交接文档

> **项目定位**：面向约 5 岁儿童的单页在线迷宫游戏。产品采用“森林邮局 / 绘本观察板”主题，提供 120 个可重建关卡、触控与桌面键盘操作、故事与贴纸奖励、家长面板、真实森林环境音及本地周报。当前已通过 Cloudflare Pages 上线。

本文是后续 AI 的工作起点。开始任何改动前，请先阅读本文、`README.md`、`PLAN.md`、`STRUCTURE.md`、`MEMORY.md`、`AUDIO_SOURCES.md`，再检查 Git 状态；不要仅依据旧文档中出现的 Manus 静态资源 URL 判断当前部署资源路径。

## 1. 当前状态速览

| 项目项 | 当前状态 |
|---|---|
| 本机源码目录 | `/Users/jiangbin/Documents/workspace/games/kids-maze-world` |
| Git 仓库 / 生产分支 | `jiangbingo/games` / `main`；开始操作前必须以 `git branch --show-current` 与 `git status --short` 为准。 |
| 已知生产基线 | `main` 当前本地基线为 `e866d0d feat: add kids maze world game`；后续提交与部署状态不可由本文推断。 |
| Cloudflare 生产地址 | `https://kids-maze-world.pages.dev` |
| 发布形式 | Cloudflare Pages，GitHub 集成已创建；本次首次生产构建成功，但后续 `main` 推送自动触发链路尚未作为独立流程再次演练 |
| 构建目录 | `kids-maze-world`（仓库根目录下的子项目） |
| 构建命令 | `pnpm build` |
| Cloudflare 构建输出 | `dist/public` |
| Cloudflare 构建变量 | `NODE_VERSION=22` |
| 后端 / 账号 | 无；纯静态浏览器应用 |
| 数据存储 | 浏览器 `localStorage`，不会上传儿童行为数据 |
| 密钥 | 无；不需要添加环境变量或 API 密钥 |

本文不声明当前检出分支或工作区是否干净；任何操作前都必须运行 `git branch --show-current` 与 `git status --short`。用户要求：除非明确指示，否则禁止 `git push`、`git tag`、部署命令和提交；提交前必须完成 **Review → Verify → Simplify**。

### 1.1 独立接管成熟度与补充文档

本项目已具备受控开发、构建验证和已知生产环境检查的基础信息；但控制台权限、自动发布触发、回滚实操、设备矩阵和视觉素材的完整可再发布证据没有全部在本仓库内验证。因此，后续 AI 在完成本文所列验收前应只承担**受控开发与验证**，不得自行承担生产故障处置或发布决策。

| 场景 | 当前成熟度 | 交接文件 |
|---|---|---|
| 开发与架构接管 | 基本具备 | 本文第 2–4 节。 |
| 本地测试与验收 | 已有 `pnpm test` 基线；真实 iPad PWA 离线与全屏验收仍需按清单执行 | `TEST_STRATEGY.md`、`IPAD_PWA_TEST_CHECKLIST.md`。 |
| 发布、回滚与故障处置 | 可按手册受控执行；未做端到端回滚演练 | `OPS_RUNBOOK.md`。 |
| 素材与合规 | 环境音证据完整；视觉资源许可需补证 | `ASSET_LEDGER.md`。 |
| localStorage 演进 | 当前键已记录；迁移机制尚未实现 | `DATA_POLICY.md`。 |

不要将本交接包视为 Cloudflare、GitHub 或本机的凭据交接。后续操作者必须通过拥有者授权获得相应最小权限；不应在 Markdown、代码、Issue 或日志中复制 Token、Cookie、SSH 私钥或账号恢复信息。

## 2. 用户目标与不可退化的体验约束

游戏的目标用户是 5 岁儿童。后续开发必须保持操作简单、安全、低挫败，并保留以下完成能力。

| 能力 | 当前行为 |
|---|---|
| 关卡 | 120 个确定性可重建的完美迷宫，12 个主题、每主题 10 关；尺寸从 5×5 逐步到 10×10。 |
| 儿童控制 | 右下方向盘、画布单指滑动、桌面方向键与大小写 WASD；每次只移动一格。 |
| 低挫败机制 | 碰壁不计步，提供撤销、重来和有限 BFS 提示；路线上的邮路印记提供非计分式探索反馈，**首次收集后即永久保留，撤销不恢复**。 |
| 通关循环 | 主题绘本剧情卡 → 未收集时显示贴纸奖励 → 下一关。 |
| 桌面键盘 | `Enter` / `Space` 按上下文确认；`Esc` 按优先级关闭帮助、故事、贴纸、贴纸册、家长面板、地图；右上“按键”打开帮助卡。 |
| iPad | 横屏 / 竖屏均有大按钮与正交相机视野调整；PWA 使用 `viewport-fit=cover` 和 Safe Area 布局变量，触摸控件优先，键盘帮助卡在小于 1024px 时隐藏。真实设备验收按 `IPAD_PWA_TEST_CHECKLIST.md` 执行。 |
| 声音 | Web Audio 合成交互音；真实森林录音首次主动交互后按需加载；2G、slow-2G 或省流模式不加载环境音。 |
| 家长能力 | 查看今日时长、通关数、贴纸数、声音开关、每日建议时长、近 7 天本地报告与双确认重置。 |
| 隐私 | 所有进度 / 时长 / 周报均只写浏览器本地；不引入儿童登录、遥测、第三方行为追踪。 |

禁止把任何个人评估报告、家庭 / 雇主信息、联系方式、浏览器凭据、Token 或密钥加入该仓库。禁止伪造评价、评分或用户反馈。

## 3. 技术架构

### 3.1 技术栈

| 层 | 技术 |
|---|---|
| UI 宿主 | React 19 + TypeScript |
| 构建 | Vite 7 + pnpm 10 |
| 样式 | Tailwind 4（仅基础）+ 自定义 CSS（核心游戏布局） |
| 游戏渲染 | BabylonJS 9，正交 2D 相机与程序化网格 |
| 状态与算法 | 框架无关的 TypeScript 类和函数 |
| 静态发布 | Cloudflare Pages |
| 数据 | `localStorage`，无数据库、无 API |

架构原则是：**React 是外层交互框架，Babylon 是迷宫画布，`client/src/game/` 是可测试的游戏逻辑层。** 不要将迷宫规则重新塞回 React 状态，也不要将静态 UI 控制交给 Babylon。

### 3.2 关键源码地图

| 文件 | 职责与注意点 |
|---|---|
| `client/src/App.tsx` | 实际入口直接渲染 `GameCanvas`；不依赖 starter 的 `Home.tsx`。 |
| `client/src/components/GameCanvas.tsx` | 游戏 React 外壳：Babylon 生命周期、输入聚合、localStorage、通关流程、贴纸、家长面板、键盘快捷键、播放时长。是功能最集中的文件。 |
| `client/src/game/GameWorld.ts` | 游戏状态机：移动、碰壁、历史、撤销、提示、路线邮票、重玩、自动演示。保持无 React 依赖。 |
| `client/src/game/maze.ts` | 种子化 DFS 完美迷宫、墙体查询、BFS 求解。修改后必须重新验证 120 关均可解。 |
| `client/src/game/levels.ts` | 120 关和 12 个主题调色 / 文案。主题与关卡通过 `Math.floor(index / 10)` 对应。 |
| `client/src/game/scene.ts` | Babylon 场景、网格、玩家 / 目标、动态足迹、路线邮票与提示、正交相机；iPad 竖屏视野调整逻辑在此。 |
| `client/src/game/themePresentation.ts` | 12 主题的 `/assets/*.png`、伙伴、终点物、剧情、主题音色映射，是内容层事实来源。 |
| `client/src/game/SoundManager.ts` | Web Audio 与真实环境音；不能在页面加载时主动拉取音频。 |
| `client/src/game/activity.ts` | 本地周报数据与日期处理。 |
| `client/src/components/ThemeStory.tsx` | 通关后主题剧情卡的纯展示组件。 |
| `client/src/components/ParentPanel.tsx` | 家长统计、时长建议、声音和双确认重置 UI。 |
| `client/src/index.css` | 游戏的实际响应式样式中心，包含 iPad 横 / 竖屏规则、大方向盘、弹层、动效和 reduced motion。 |
| `client/public/assets/` | Cloudflare 自包含资源：logo、12 张主题图、森林 MP3。运行时必须保持 `/assets/...` 路径。 |
| `client/public/_headers` | Cloudflare 安全响应头和资源缓存头；`sw.js` 与 Manifest 采用无缓存响应头以发现版本更新。 |
| `client/public/manifest.webmanifest` / `client/public/sw.js` / `client/src/pwa.ts` | Home Screen PWA 元数据、离线缓存与受控更新入口；更新提示只在家长面板展示。 |
| `IPAD_PWA_TEST_CHECKLIST.md` | 真实 iPad 上的安装、全屏、Safe Area、离线、恢复和更新验收记录。 |

### 3.3 已知文档与模板残留

部分历史文件记录的是 Manus WebDev 阶段，不能直接当作当前 Cloudflare 部署规范。

| 文件 | 当前处理原则 |
|---|---|
| `PLAN.md` / `ASSETS.md` | 保留设计与历史来源价值，但其中 `/manus-storage/...` URL 是历史记录，**不可**重新写回当前 Cloudflare 运行时。 |
| `MEMORY.md` | 第 6 行关于“大图使用 Manus URL”的描述已过时；实际独立发布副本使用 `client/public/assets/`。 |
| `STRUCTURE.md` | 列出的 `client/src/game/input.ts` 已不存在；当前输入处理在 `GameCanvas.tsx`。 |
| `client/src/pages/Home.tsx`、`components/Map.tsx`、`components/ManusDialog.tsx` | starter 模板遗留，实际游戏入口不使用它们。清理前需确认不会影响模板依赖或开发体验。 |

## 4. 运行、构建与验证

### 4.1 本机命令

在项目目录执行：

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
pnpm dev
```

`pnpm build` 会执行 `vite build`，生成 Cloudflare Pages 所需的 `dist/public`，随后也会构建仅为模板兼容保留的 `dist/index.js`。Cloudflare Pages **只使用** `dist/public`，不要尝试启动 Express 服务器。

### 4.2 已完成验证

| 验证 | 结果 |
|---|---|
| `pnpm install --frozen-lockfile` | 通过。 |
| `pnpm check` | 通过，无 TypeScript 错误。 |
| `pnpm test` | 已新增 Vitest 基线；覆盖 120 关确定性、可解性、路线邮票收集/重开、**收集后撤销仍保持已收集**，以及同关卡重建。 |
| `pnpm build` | 通过；Vite 对大 chunk 给出警告，但不失败。 |
| `git diff --check` | 通过。 |
| 迷宫算法审计 | 临时脚本逐关验证了 120 关的 seed 确定性、BFS 可达、路径不穿墙与步进一致性；结果为 120/120 通过，最短解 8 步，最长解 70 步。临时脚本已删除，未留下源码改动。 |
| 静态资源审计 | 所有 `client/src` 中 `/assets/...` 引用都有对应的 `client/public/assets` 文件；无 `/manus-storage/` 运行时引用。 |
| Cloudflare 生产检查 | 首页、`/assets/maze-leaf-compass-logo.png`、`/assets/forest-ambience-cc0.mp3` 都返回 HTTP 200，首页未发现 Manus 路径。 |
| 交互历史验证 | 已手工验证桌面 Enter / Space / Esc / WASD、剧情→贴纸→下一关流程，以及 iPad 横竖屏布局与环境音按需请求。Home Screen PWA 的真实设备离线与全屏验收应以 `IPAD_PWA_TEST_CHECKLIST.md` 为准。 |

### 4.3 后续变更的最低验证门槛

任何影响游戏逻辑、输入、资源或发布的更改至少执行：

```bash
pnpm check
pnpm build
git diff --check
```

迷宫算法或关卡参数改动后，必须运行 `pnpm test` 覆盖全部 120 关的确定性、可解性和路线邮票路径；后续应继续补齐 `maze.test.ts`、日期和输入边界测试。

视觉或交互改动后，应在真实 iPad Safari 验证竖屏、横屏、方向盘、画布滑动、弹层关闭和首次音频交互。Mac Chrome 的设备模式只能做布局预检，不能替代 iPad Safari 的触控与音频验证。

## 5. Cloudflare Pages 与 GitHub 操作说明

### 5.1 已上线配置

Cloudflare 中已经创建的是 **Pages** 项目，不是 Worker。早期误建过同名 Worker，因根目录为 `/` 导致找不到 `package.json`，该错误 Worker 已删除。

正确 Pages 配置如下：

| 字段 | 值 |
|---|---|
| GitHub repository | `jiangbingo/games` |
| Production branch | `main` |
| Project name | `kids-maze-world` |
| Root directory | `kids-maze-world` |
| Build command | `pnpm build` |
| Build output directory | `dist/public` |
| Build variable | `NODE_VERSION=22` |
| 生产地址 | `https://kids-maze-world.pages.dev` |

Pages 连接 `main` 后，未来推送到 `main` 会产生新的生产构建。因此在修改 / 推送前必须先本机构建，且仅在用户明确授权时创建提交和推送。

### 5.2 Git 注意事项

用户全局 Git 曾设置将 GitHub HTTPS 重写到 `ghfast.top`。不要修改用户全局配置。此前成功推送使用了局部覆盖：

```bash
GIT_CONFIG_GLOBAL=/dev/null git -c credential.helper='!gh auth git-credential' \
  push https://github.com/jiangbingo/games.git HEAD:main
```

当前 `games` 的远程地址已切到 `git@github.com:jiangbingo/games.git`。如果 SSH 连接异常，先报告问题并征求用户意见，不要自行改变远程、Git 全局配置或强推。

### 5.3 资源与缓存

`client/public/_headers` 给 `/assets/*` 配置了一年 `immutable` 缓存。当前文件名是稳定语义名而非内容 hash；若替换同名 PNG / MP3，旧设备可能继续读取浏览器缓存。资源更新时优先使用带版本或内容 hash 的新文件名，并同步更新 `themePresentation.ts` / `GameCanvas.tsx` / `SoundManager.ts` 的引用。

## 6. 数据、声音、版权与隐私

### 6.1 localStorage 键

| 键 | 用途 |
|---|---|
| `maze-last-level` | 当前 / 最近关卡。 |
| `maze-completed-levels` | 已通关关卡 ID 数组。 |
| `maze-sticker-book` | 已解锁贴纸 ID 数组。 |
| `maze-sound-enabled` | 互动音效开关。 |
| `maze-ambient-enabled` | 森林环境音开关。 |
| `maze-daily-limit` | 家长面板每日建议分钟数。 |
| `maze-playtime-YYYY-MM-DD` | 每日游玩秒数。 |
| `maze-daily-activity` | 每日新增通关 / 贴纸日志，供 7 天报告使用。 |

重置进度目前只清除关卡、贴纸与当前关卡，不清除每日时长 / 周报。此行为在面板中有说明，但若产品希望“全面重置”，需明确产品决策后扩展。

### 6.2 音频

真实森林环境音文件为 `client/public/assets/forest-ambience-cc0.mp3`。来源记录见 `AUDIO_SOURCES.md`：BigSoundBank / LaSonotheque 的 `Forest`（Sound #0100），作者 Joseph SARDIN，CC0 / Public Domain，可用于公开项目。[1]

不能在首屏预加载或自动播放该录音。当前正确策略是：第一次 `pointerdown` 或按钮交互解锁声音上下文后，才在非低带宽网络按需创建 `Audio` 并播放。必须保留 iPad Safari 的“用户手势后播放”约束。

## 7. 已发现风险、优先级与建议处理方案

### P2：动态材质生命周期已修复，仍需 iPad 长时观察

`scene.ts` 已将足迹、提示、庆祝与路线邮票材质提升为关卡级复用对象；每次状态更新只释放并重建动态 mesh，不再为每一步新建 `StandardMaterial`。

* 证据：`client/src/game/scene.ts:53-56`、`client/src/game/scene.ts:100-134`、`client/src/game/scene.ts:147-151`。
* 验证：`pnpm test` 已覆盖 120 关路线邮票路径；仍应在真实 iPad Safari 做连续试玩，观察长路径和跨主题切换后的内存与帧率。

### P1：首屏资源体积偏大

构建产物约 73MB；主题 PNG 单张约 4.4–5.2MB，logo 约 3.2MB，Babylon 主 chunk 约 1.49MB（gzip 约 388KB）。当前主题插画会在首屏 UI 中显示，弱网与国内移动网络下可能影响体验。

* 推荐顺序：先转换主题 PNG / logo 为 WebP 或 AVIF（需保留透明度与视觉质量），再使用内容 hash 文件名；之后考虑 Babylon 深层导入与更细的代码分包。
* 不要为了压缩而降低迷宫墙线、按钮和文字的可辨识性；游戏性视觉优先。

### P3：每日游玩时长已统一为本地日期键

`GameCanvas.tsx` 已复用 `activity.ts` 的 `playtimeKeyFor()`，使每日时长与周报均按浏览器本地日期归档。

* 证据：`client/src/components/GameCanvas.tsx:8`、`:43`，以及 `client/src/game/activity.ts:8-9`。
* 后续：补充跨午夜、UTC 日界和夏令时地区的自动化测试。

### P2：家长“每日时长”是软提醒，不是硬控制

家长面板会在达到时长后显示休息文案，但不会暂停游戏或显示休息遮罩。

* 证据：`client/src/components/ParentPanel.tsx:24`、`client/src/components/ParentPanel.tsx:42`，以及 `GameCanvas.tsx` 的计时逻辑。
* 产品决策：若保留温和提醒，应把文案统一为“建议时长”；若要真正控制，应增加到时后的可选休息弹层，避免强制阻断造成儿童挫败。

### P2：资源缓存更新风险

`/assets/*` 使用一年 `immutable` 缓存，但文件名并不包含 hash。

* 证据：`client/public/_headers:7`。
* 推荐修复：改用版本化 / hash 文件名，或减短缓存并使用部署版本策略。

### P3：弹层无障碍可进一步完善

贴纸、家长和关卡地图均已设置 `role="dialog"`、`aria-modal="true"`，但尚未实现焦点捕获与关闭后的焦点回还。

* 证据：`client/src/components/GameCanvas.tsx:379`、`:395`、`:412`、`:415`。
* 对儿童触控主流程影响较小，但应在后续无障碍完善时处理。

## 8. iPad 实机回归清单

真实 iPad Safari 打开 `https://kids-maze-world.pages.dev`，请至少执行以下检查。

| 场景 | 预期 |
|---|---|
| 竖屏首屏 | 顶部信息、中央迷宫、底部工具和方向盘不重叠；方向按钮足够大。 |
| 横屏首屏 | 任务卡、进度卡、中央迷宫、左右底部控件均可见。 |
| 画布滑动 | 每次有效滑动只移动一格；短触碰不会误移动。 |
| 方向盘 | 任一方向可靠移动；碰壁不增加步数。 |
| 首次声音 | 主动点击或滑动后才开始环境音；静音 / 环境音开关可生效。 |
| 完成关卡 | 剧情卡 → 贴纸 → 下一关顺序正确；Esc / Enter / Space 在桌面行为不退化。 |
| 家长面板 | 时长、7 日柱状图、声音开关、双确认重置正常；面板可滚动并关闭。 |
| 低网环境 | 至少观察首屏加载、主题图出现与声音不阻塞操作。 |

在 Mac 上调试真实 iPad：Mac Safari 开启“开发”菜单，iPad Safari 开启“网页检查器”，以有线或无线连接后在 Safari **开发**菜单中选择 iPad 和对应页面。Chrome 设备模拟仅用于快速布局预览。

## 9. 推荐的下一轮开发顺序

1. **先修 P1 动态材质生命周期**，执行 `?demo` 长路径和真实 iPad 连续试玩。
2. **统一本地日期键**，为午夜前后时间构造单元测试，并明确“软提醒 / 硬控制”的产品语义。
3. **建立正式测试套件**：固化 120 关算法测试，增加 `pnpm test`，至少覆盖迷宫可解性、相同 seed、边界墙、进度 key 与日期。
4. **资源优化**：无损 / 高质量 WebP 或 AVIF、哈希文件名、验证 Cloudflare 缓存更新；压缩后重新检查儿童可读性。
5. **性能优化**：评估 Babylon chunk 分包与运行时内存，必须先量化再改动。
6. **可访问性完善**：弹层 focus trap、焦点回还、必要的屏幕阅读器提示。
7. 每一阶段都遵循：**Review → Verify → Simplify**；完成后先给用户 diff 摘要，等待明确指令再提交 / 推送。

## 10. 交接时禁止的误操作

- 不要把 Cloudflare 运行时资源改回 `/manus-storage/...`。
- 不要误建 Worker 或设置 `npx wrangler deploy`；本项目是 **Cloudflare Pages** 静态站点。
- 不要将 `dist/`、`node_modules/` 或临时算法审计文件提交。
- 不要在未经授权时 push、commit、tag 或部署。
- 不要删除 `client/public/_headers`，除非同时给出等价的安全与缓存策略。
- 不要把用户个人资料、凭据或上传报告加入仓库。
- 不要用伪造的儿童评价 / 用户评分填充 UI。

## References

[1]: https://bigsoundbank.com/forest-s0100.html "BigSoundBank / LaSonotheque — Forest (Sound #0100)"
