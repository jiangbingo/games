# 迷宫小小探险家：本地数据、迁移与兼容策略

## 1. 当前数据模型

应用是纯静态站点，没有账号、服务器数据库、云同步或远程备份。所有儿童相关进度都保存在**当前浏览器、当前设备、当前站点 origin** 的 `localStorage` 中。清除网站数据、切换浏览器 / 设备、无痕模式退出、域名变化或用户手动重置可能导致数据不可恢复。

| localStorage 键 | 当前类型 | 写入位置 | 语义 |
|---|---|---|---|
| `maze-last-level` | 数字字符串 | `GameCanvas.tsx` | 最近关卡。 |
| `maze-completed-levels` | `number[]` JSON | `GameCanvas.tsx` | 已完成关卡。 |
| `maze-sticker-book` | `StickerId[]` JSON | `GameCanvas.tsx` | 已解锁贴纸。 |
| `maze-sound-enabled` | `"true"` / `"false"` | `GameCanvas.tsx` | 互动音效偏好。 |
| `maze-ambient-enabled` | `"true"` / `"false"` | `GameCanvas.tsx` | 环境音偏好。 |
| `maze-daily-limit` | 数字字符串 | `GameCanvas.tsx` | 每日建议时长分钟数。 |
| `maze-playtime-YYYY-MM-DD` | 数字字符串 | `GameCanvas.tsx` / `activity.ts` | 每日游玩秒数。 |
| `maze-daily-activity` | `Record<date, DailyActivity>` JSON | `activity.ts` | 每日新增关卡 / 贴纸，供 7 天周报。 |

## 2. 当前行为与产品限制

| 行为 | 当前实现 | 必须知晓的限制 |
|---|---|---|
| 自动恢复 | 通过 `maze-last-level` 恢复最近关卡。 | 仅限同一 origin / 同一浏览器。 |
| 奖励去重 | 通过关卡 / 贴纸 ID 集合防重复。 | 更换贴纸规则前需写迁移。 |
| 进度重置 | 清除关卡、贴纸、最近关卡。 | 不清除时长 / 周报；需在 UI 和交接中明确。 |
| 每日统计 | 记录秒数和日记。 | `GameCanvas.tsx` 与 `activity.ts` 均通过 `playtimeKeyFor()` 使用浏览器本地日期；跨午夜与夏令时边界仍需自动化测试。 |
| 数据恢复 | 无。 | 当前没有导出 / 导入、同步或恢复支持。 |

儿童数据虽然不出本机，但仍应最小化保存，避免把姓名、学校、精确位置、设备指纹、联系方式或自由文本写入 localStorage。

## 3. 现阶段迁移政策

当前代码**没有 schema version、迁移器、备份或导入导出能力**。在未实现前，所有影响 localStorage 结构、键名或 ID 语义的变更都属于高风险变更，必须遵守以下保守策略。

1. **只增不改**：优先新增兼容字段，不改变已有键的数据类型；旧键读取失败时使用安全默认值，不抛出异常。
2. **ID 稳定**：已发布关卡 ID、主题 ID、贴纸 ID 不能随意重排。若必须改名，保留旧 ID 到新 ID 的映射。
3. **先读后写**：首次读取旧数据时验证数组 / 对象结构、数值边界和去重；无效数据应回退默认状态，不应阻断游戏。
4. **不自动删历史**：没有用户可见说明和回退期时，不要静默删除旧键。
5. **为未来预留**：推荐新增 `maze-storage-version` 数字键，并以单一 `migrateStorage(fromVersion)` 处理一次性迁移。

## 4. 建议的数据演进方案（尚未实现）

```ts
type StorageVersion = 1;

type MazeStorageV1 = {
  completedLevelIds: number[];
  stickerIds: string[];
  lastLevelId: number;
  settings: { sound: boolean; ambient: boolean; dailyLimitMinutes: number };
  dailyActivity: Record<string, { completedIds: number[]; stickerIds: string[] }>;
};
```

建议以一个受控 JSON 根对象替代分散键，或在保留分散键的前提下以版本键驱动迁移。无论选择哪种方式，都必须：

| 变更步骤 | 验收要求 |
|---|---|
| 设计迁移 | 列出 vN → vN+1 的输入、输出、丢失字段和回滚限制。 |
| 单元测试 | 覆盖空值、损坏 JSON、旧版本、重复 ID、未知主题、日期边界。 |
| 用户保护 | 在危险迁移前提供家长可见的“导出进度”或至少说明无法恢复。 |
| 灰度验证 | 先在 Preview 和测试浏览器 profile 验证；不要用真实儿童主要进度做首次迁移测试。 |
| 发布后观察 | 检查控制台、进度恢复、贴纸数量和周报；若异常，优先停止进一步写入。 |

## 5. 数据导出与删除建议

当前没有导出功能。若未来需要家长可控备份，导出文件应只包含本游戏的最小状态，不包括浏览器其他 localStorage，也不上传服务器。建议格式为带版本的 JSON，并在导入前显示版本、关卡数、贴纸数和确认提示。

家长“重置进度”应至少提供两种明确语义：

| 选项 | 应清除 | 不应清除 |
|---|---|---|
| 重置游戏进度 | 已完成关卡、贴纸、最近关卡。 | 声音偏好、每日时长设置和周报（沿用当前行为）。 |
| 清除本机游戏数据 | 所有 `maze-*` 键。 | 浏览器的无关站点数据。 |

在实现前，由产品所有者确认是否真的需要第二种选项；儿童产品中应避免让孩子误触不可逆清除。

## 6. 日期一致性与测试要求

`GameCanvas.tsx` 的 `todayPlaytimeKey()` 已复用 `activity.ts` 的 `playtimeKeyFor()`，使每日游玩秒数与周报都按浏览器本地日期归档。后续需增加自动化测试覆盖本地 00:00、UTC 日界和夏令时地区；本项目主用户在中国时区，但代码不应假设所有用户都在中国。
