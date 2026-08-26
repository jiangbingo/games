# 迷宫小小探险家：素材台账与合规缺口

> 本文只陈述当前仓库内可核实的来源证据。**没有书面证据的素材不得被描述为“已完成商业再发布许可”。** 在更换供应商、对外授权、接入广告、二次分发或进入更严格的应用商店流程前，应由项目所有者补齐视觉素材来源和使用权限记录。

## 1. 生产素材清单

| 类别 | 生产文件 | 当前用途 | 来源 / 授权证据状态 | 后续动作 |
|---|---|---|---|---|
| 品牌图标 | `maze-leaf-compass-logo.png` | Header 品牌图标。 | 项目历史 `ASSETS.md` 记录为 Manus 生成的“叶片罗盘”；仓库中无原始生成任务、提示词、许可证快照或再发布台账。 | **待补证**：保存生成来源、生成日期、服务条款版本 / 权利说明和原始文件 checksum。 |
| 主题插画 | `theme-flower-rain-assets.png` | 花雨主题任务图 / 剧情卡。 | 历史上作为项目生成资产使用；无独立许可台账。 | **待补证**。 |
| 主题插画 | `theme-blueberry-assets.png` | 蓝莓主题。 | 同上。 | **待补证**。 |
| 主题插画 | `theme-honey-assets.png` | 蜂蜜主题。 | 同上。 | **待补证**。 |
| 主题插画 | `theme-mushroom-assets.png` | 蘑菇主题。 | 同上。 | **待补证**。 |
| 主题插画 | `theme-kite-assets.png` | 风筝主题。 | 同上。 | **待补证**。 |
| 主题插画 | `theme-acorn-library-assets.png` | 橡果书屋主题。 | 同上。 | **待补证**。 |
| 主题插画 | `theme-firefly-night-assets.png` | 萤火虫夜邮主题。 | 同上。 | **待补证**。 |
| 主题插画 | `theme-rainbow-umbrella-assets.png` | 彩虹雨伞主题。 | 同上。 | **待补证**。 |
| 主题插画 | `theme-strawberry-tea-assets.png` | 草莓茶会主题。 | 同上。 | **待补证**。 |
| 主题插画 | `theme-seashell-assets.png` | 海盐贝壳主题。 | 同上。 | **待补证**。 |
| 主题插画 | `theme-maple-train-assets.png` | 枫叶小火车主题。 | 同上。 | **待补证**。 |
| 主题插画 | `theme-cedar-cabin-assets.png` | 雪松小屋主题。 | 同上。 | **待补证**。 |
| 环境音 | `forest-ambience-cc0.mp3` | 用户首次操作后按需循环播放。 | `AUDIO_SOURCES.md` 记录 BigSoundBank / LaSonotheque 的 Forest Sound #0100，作者 Joseph SARDIN，页面标注 CC0 / Public Domain。 | **已具备项目内来源记录**；仍建议保存原始页面快照 / 下载日期 / checksum。 |
| 迷宫 / 玩家 / 足迹 | 无外部文件；Babylon 程序化绘制。 | 迷宫墙、目标、狐狸圆盘、提示与足迹。 | 自有代码生成。 | 维护源代码许可证和依赖许可证。 |
| UI 图标 | `lucide-react` 图标组件。 | 控制、提示、面板图标。 | npm 依赖；应在发行前核查当前许可证文本。 | 补充第三方依赖 SBOM / license 报告。 |

## 2. 资产来源事实与不能作出的结论

`ASSETS.md` 记录了视觉方向及历史 Manus 静态资源 URL；当前 Cloudflare 运行时已改为 `client/public/assets/`，不再依赖这些 URL。该历史记录可以说明资产曾进入项目流程，但**不能替代**以下材料：生成平台条款、资产生成任务 ID、提示词 / 输入素材来源、责任主体、商用 / 再分发权利和第三方元素排查。

因此，后续 AI 不得编造“所有 logo 与插画均为 CC0”“已经获得独占许可”“所有素材均可无条件再分发”等结论。正确状态是：**音频有来源与 CC0 记录；视觉图已有项目历史来源线索，但缺完整授权台账。**

## 3. 需要由项目所有者补齐的台账字段

| 字段 | 必填原因 |
|---|---|
| Asset ID、文件名、SHA-256、像素 / 时长 | 确保待发布文件与证据文件一致。 |
| 制作方式 | 自制 / AI 生成 / 购买库存 / 委托 / 开源。 |
| 作者 / 供应商与获取日期 | 追溯来源。 |
| 原始 URL / 订单 / 生成任务引用 | 可复核。 |
| 授权条款快照、适用地域、期限、商用 / 再分发条件 | 支撑发布判断。 |
| 是否使用第三方输入、人物、商标或受限 IP | 降低侵权与肖像风险。 |
| 审核人、审核日期、批准用途 | 明确责任边界。 |
| 版本与替换记录 | 对应缓存、回滚和再发布。 |

建议把可公开的台账摘要放入仓库的 `docs/assets/`；订单、账户截图、合同和含个人资料的凭证应放在受控私有文档库，只在台账中记录受控引用，不要提交。

## 4. 素材变更流程

1. 在替换素材前确认许可证和原始输入材料可用于公开儿童产品。
2. 使用内容 hash 或版本化文件名，例如 `theme-kite-assets.v2.webp`，避免 `_headers` 的一年 immutable 缓存导致旧文件滞留。
3. 更新 `themePresentation.ts`、`GameCanvas.tsx` 或 `SoundManager.ts` 引用，并运行资源引用审计。
4. 对新图测试 iPad 文字对比、透明边缘、尺寸、首屏加载与内容适龄性。
5. 把旧文件留到部署稳定后再由项目所有者确认删除；不要在同一发布中同时删除唯一可回滚的素材版本。

## References

[1]: https://bigsoundbank.com/forest-s0100.html "BigSoundBank / LaSonotheque — Forest (Sound #0100)"
