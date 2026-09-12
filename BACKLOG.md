# Bingo 游戏中心 待办规划

> 最后更新：2026-09-12
> 覆盖范围：全仓库（14 个游戏 + kids-maze-world 子项目）

## 当前状态

- **部署**：Cloudflare Pages 主站 `bingo-games-hub.pages.dev` + Vercel 回滚镜像
- **游戏数量**：14 个（13 儿童游戏 + 1 迷宫子项目）
- **分支**：`main` 已同步 origin

## 已完成任务

### 基础设施
- ✅ 架构重构：单体拆分为自包含 HTML + 共享层（kids-ui.js/kids.css）
- ✅ 安全修复：SQL 去重、token 鉴权、XSS 防护
- ✅ PWA 支持：sw.js + manifest.webmanifest，可离线安装
- ✅ 部署迁移：Cloudflare Pages 主站 + Vercel 回滚

### 游戏增强
- ✅ 游戏分类重组：6 区分类（逻辑思维/观察记忆/美术绘画/认知启蒙/空间探索/经典游戏）
- ✅ Bingo 品牌更新：全站标题、页脚、manifest
- ✅ 贪吃蛇增强：双皮肤、手指跟随、吃食动效、速度爬升
- ✅ 水墨方块增强：字体本地化、触摸手势、墨晕与连击动效
- ✅ 记忆翻牌重写：物品主题选择、难度递增 7 关
- ✅ 逻辑游戏优化：形状拼图/形状配对/模式匹配 难度选择 + 动画

### 2026-09-12 完成
- ✅ 清理 js/ 未引用文件（ai-game-generator.js, bigmodel-client.js, category-filter.js, difficulty.js）
- ✅ 抽取公共动画到 kids.css（kui-shake, kui-pop, kui-bounce, kui-fadeIn）
- ✅ 自适应难度系统：AdaptiveDifficulty 类（kids-ui.js）
- ✅ 找不同/颜色配对/数字认知 集成自适应难度

## 待办任务

### P0（近期必须）
| # | 任务 | 验收标准 |
|---|---|---|
| T1-1 | 双 iPad 真机测试 | 两台 iPad 跑完 PWA 清单，结果补录 |
| T1-2 | 迷宫子项目独立部署 | kids-maze-world.pages.dev 启用 |

### P1（重要）
| # | 任务 | 验收标准 |
|---|---|---|
| T2-1 | 涂色画工坊增强 | 批量图片转线稿、A4 打印优化 |
| T2-2 | 看图识物增强 | 增加难度系统 |
| T2-3 | 动物叫声增强 | 增加难度系统 |

### P2（优化）
| # | 任务 | 验收标准 |
|---|---|---|
| T3-1 | 首屏加载优化 | 主题 PNG 转 WebP，减小包大小 |
| T3-2 | 无障碍改进 | 弹层 focus trap、焦点回还 |
| T3-3 | 代码质量 | 统一动画、清理死代码 |

### P3（扩展）
| # | 任务 | 验收标准 |
|---|---|---|
| T4-1 | 新玩法：森林路线拼图 | 旋转连通管路 |
| T4-2 | 新游戏：奇妙修理岛 | MVP 规格 |

## 执行纪律

1. 不主动 commit/push/部署——每阶段完成后给 diff 摘要，等明确指令
2. 每阶段 Review → Verify → Simplify
3. 视觉/交互改动必须在真实 iPad Safari 验证
4. localStorage 数据遵循 DATA_POLICY.md
