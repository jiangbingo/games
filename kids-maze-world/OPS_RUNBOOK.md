# 迷宫小小探险家：发布、回滚与运维手册

> 本手册用于**受控操作**。它不授予发布权限。未经用户明确确认，后续 AI 或开发者不得创建提交、推送、删除部署、变更 Cloudflare 配置、绑定域名或触发生产发布。

## 1. 已知生产配置与待确认项

| 项目 | 已核实状态 | 未核实 / 必须在操作前确认 |
|---|---|---|
| 项目类型 | Cloudflare **Pages**，不是 Worker。 | 不得改用 `npx wrangler deploy`。 |
| 生产地址 | `https://kids-maze-world.pages.dev` 曾返回 200。 | 自定义域名目前未配置或未验证。 |
| Git 源 | `jiangbingo/games`，生产分支 `main`。 | 当前操作人是否拥有该仓库写入权限。 |
| Pages 根目录 | `kids-maze-world`。 | 控制台中仍保持该值。 |
| 构建 | `pnpm build`，输出 `dist/public`，`NODE_VERSION=22`。 | pnpm / 构建镜像版本变化后的兼容性。 |
| 首次部署 | 已成功；曾打开并检查首页与两个关键资源。 | 后续提交自动触发构建、分支预览与回滚流程尚未作为演练闭环验证。 |
| 后端 / 密钥 | 纯静态；当前不需要密钥。 | 不得为了方便在 Pages 环境变量中新增不必要的秘密。 |

Cloudflare Pages 对仓库内非生产分支和 Pull Request 可以创建独立预览 URL；默认预览 URL 是公开的。如项目加入用户数据、内部素材或未公开内容，应先在 Pages 设置中启用预览访问控制。[1]

## 2. 权限与配置治理

### 2.1 最小权限清单

| 系统 | 执行受控开发所需权限 | 生产变更前额外确认 |
|---|---|---|
| 本机工作区 | 读写 `games/kids-maze-world` | 是否允许提交。 |
| GitHub | 读取仓库、创建分支 / PR（如团队流程允许） | 写 `main`、合并 PR、push。 |
| Cloudflare | 查看 Pages 项目、Deployments、构建日志和域名设置 | 发布、回滚、删除部署、修改 Access、域名、构建变量与缓存头。 |

不要把账户 ID、人员邮箱、Token、Cookie、SSH key 或 Git credential 记录在项目中。控制台配置不能只存在于个人记忆：每次更改后在 `CHANGELOG`、PR 描述或运维记录里记下**日期、操作者、变更字段、旧值、新值、关联提交和验证结果**，但不得写入秘密值。

### 2.2 配置变更判定

| 变更 | 风险级别 | 要求 |
|---|---|---|
| 仅文案 / 主题色 | 中 | 完成本机构建、视觉回归与明确提交确认。 |
| 游戏算法、输入、localStorage | 高 | 增加 / 更新测试，执行 iPad 回归，并保留迁移说明。 |
| 资源路径、`_headers`、缓存策略 | 高 | 预览环境验证所有资源状态码和缓存头。 |
| Pages 根目录、构建命令、Node、分支、域名、Access | 高 | 先导出或截图旧值；得到所有者明确确认；变更后立即健康检查。 |
| 删除部署、删除项目、回滚、变更仓库连接 | 严重 | 必须得到明确、针对性确认，并记录回退目标或恢复计划。 |

## 3. 标准发布流程

### 3.1 发布前门禁

1. 在本机项目根目录确认 `git status --short`；明确列出计划提交的文件。不得夹带 `node_modules/`、`dist/`、临时脚本、报告或个人资料。
2. 完成 **Review → Verify → Simplify**。Review 至少检查路径、隐私、资源授权、键盘 / iPad 输入和 localStorage 兼容性；Verify 至少执行下方命令；Simplify 移除不需要的依赖和死代码。
3. 执行：

   ```bash
   pnpm install --frozen-lockfile
   pnpm check
   pnpm build
   git diff --check
   ```

4. 若改动迷宫逻辑或关卡参数，运行 120 关确定性 / BFS 可解性审计；若尚未将审计固化为 Vitest，必须在交接记录中附上临时脚本和输出。
5. 若改动 UI、声音或资源，在真实 iPad Safari 做横 / 竖屏回归；若无实机，标记为“模拟器 / 桌面模拟，实机待验”。
6. 将预期生产 commit、风险、回滚目标和健康检查人写入验收记录。生产发布需要用户明确确认。

### 3.2 推荐预览流程

推荐使用特性分支和 Pull Request，不直接把未经审核的变更推到 `main`。Cloudflare Pages 能为仓库内分支或 PR 创建 hash URL 和分支别名，且预览部署不改变生产站点。[1]

在 Preview 上检查：首页、12 个主题至少抽检 3 个、方向盘、画布滑动、通关、家长面板、以及资源 URL。确认 Preview URL 的 `X-Robots-Tag: noindex`；如果预览含不应公开的信息，先启用 Cloudflare Access。[1]

> 当前项目没有保存“已经实际演练成功的 preview 流程”记录。首次由后续开发者使用前，应将该演练记录写入验收日志。

### 3.3 生产发布步骤

1. 仅在用户授权后创建提交和 push；不要自行用 GitHub / Cloudflare CLI 发布。
2. 在 Cloudflare **Workers & Pages → kids-maze-world → Deployments** 中确认生产构建已触发，来源为期望的 `main` commit，根目录为 `kids-maze-world`，构建命令为 `pnpm build`，输出为 `dist/public`。
3. 构建完成后执行第 5 节健康检查；未通过时不要宣布上线成功。
4. 保留此次 deployment ID、commit SHA、构建开始 / 结束时间、操作者和健康检查结论。

## 4. 构建失败排障

| 症状 | 优先检查 | 处置原则 |
|---|---|---|
| `ERR_PNPM_NO_IMPORTER_MANIFEST_FOUND` | Cloudflare Root directory 是否错误为 `/`。 | 改回 `kids-maze-world`；仓库根的 `package.json` / `pnpm-workspace.yaml` 是 workspace 配置（2026-08-30 起），属预期存在，不要删除或绕过。 |
| 找不到 `dist/public` | 构建命令 / 输出目录、`vite.config.ts`、构建日志。 | 保持 `pnpm build` 与 `dist/public`，先本机复现。 |
| pnpm / Node 安装失败 | `NODE_VERSION=22`、`packageManager`、仓库根 `pnpm-lock.yaml`（workspace 唯一锁文件）。 | 先本机冻结安装；不要删除根锁文件；改动依赖后必须重新生成并提交根锁文件再触发部署。 |
| 资源 404 | `client/public/assets`、源码 `/assets/` 引用、Pages 构建产物。 | 不要改回 `/manus-storage/`；逐条验证路径与大小写。 |
| 页面可开但迷宫空白 | 浏览器控制台、Babylon chunk、canvas 尺寸和 `scene.ts` 生命周期。 | 先检查静态资源和 console，再处理 GPU / WebGL 兼容性。 |
| 新旧图片混用 | `_headers` 中一年 immutable 缓存及稳定文件名。 | 改用版本化文件名，必要时按用户确认清理缓存。 |

Cloudflare 构建日志是故障事实来源。每次失败应保存失败阶段、首个错误、关联 commit、控制台配置和本机复现结果；不要只截图“失败”标题。

## 5. 发布后健康检查

生产构建显示成功后，按顺序检查。

| 检查 | 预期 | 记录方式 |
|---|---|---|
| 首页 | `https://kids-maze-world.pages.dev/` 返回 200，迷宫 UI 可见。 | 浏览器截图 + HTTP 状态。 |
| 关键图片 | `/assets/maze-leaf-compass-logo.png` 与至少 1 张主题图返回 200 和正确图片类型。 | URL 与响应头。 |
| 音频 | `/assets/forest-ambience-cc0.mp3` 返回 200，类型为音频。 | URL 与响应头。 |
| 独立部署 | 页面和构建 JS 中不出现 `/manus-storage/`。 | 源码 / 页面文本检查。 |
| 桌面交互 | 方向键 / WASD、Enter / Space、Esc、通关循环正常。 | 测试者和结果。 |
| iPad 交互 | 横竖屏、方向盘、单指滑动、首次声音、家长面板正常。 | 设备 / Safari 版本 / 截图。 |
| 控制台 | 无阻断性错误；音频被浏览器策略阻断应标明复现条件。 | Safari Web Inspector / Chrome DevTools。 |

若健康检查失败且影响儿童主流程，立即执行回滚决策；不要依赖“稍后再看”。

## 6. 回滚流程

Cloudflare Pages 的已成功生产部署可以作为回滚目标；preview 部署不能作为回滚目标。官方路径为：**Pages 项目 → Deployments → All deployments → 目标生产部署的三点菜单 → Rollback to this deployment → 确认**。回滚会将生产部署切换到选定的成功版本。[2]

回滚前记录：故障描述、当前坏版本 commit / deployment ID、目标好版本 commit / deployment ID、是否受缓存影响、授权人。回滚后立即执行第 5 节最小健康检查，并在记录中写明恢复是否成功。

如果没有可用的成功生产部署、或问题由域名 / Access / 缓存头引起，**不要猜测性修改生产设置**。先冻结进一步发布、导出当前日志和配置，再由项目所有者确认恢复策略。

## 7. 运维记录模板

每一次 Preview、生产部署、回滚或控制台配置变更，建议创建一条记录：

```text
日期与时区：
操作者：
动作：Preview / Production / Rollback / Config change
Git commit / branch：
Cloudflare deployment ID / URL：
旧配置 → 新配置（不写秘密）：
本机验证：
生产健康检查：
iPad 验证设备与结果：
故障 / 回滚目标：
所有者确认记录：
```

## References

[1]: https://developers.cloudflare.com/pages/configuration/preview-deployments/ "Cloudflare Pages preview deployments"

[2]: https://developers.cloudflare.com/pages/configuration/rollbacks/ "Cloudflare Pages rollbacks"
