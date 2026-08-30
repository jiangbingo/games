# 自适应难度系统设计文档

## 概述

本系统为儿童逻辑游戏提供智能难度调整功能，根据孩子的实时表现动态调整游戏难度，确保游戏始终处于适当的挑战水平。

---

## 核心目标

1. **保持挑战性**：避免游戏过于简单或过于困难
2. **正向激励**：通过渐进式难度提升增强孩子信心
3. **个性化**：根据每个孩子的独特能力调整
4. **数据驱动**：基于量化指标而非直觉判断

---

## 数据架构

### 1. 游戏数据结构

```javascript
// 用户存储
{
  userId: 'user_1234567890_abc123',
  username: '小明',
  createdAt: '2026-02-15T10:00:00Z',
  lastLogin: '2026-02-15T10:00:00Z',
  settings: {
    soundEnabled: true,
    difficulty: 'normal',
    theme: 'default'
  }
}

// 进度存储
{
  currentLevel: 5,
  completedLevels: [1, 2, 3, 4],
  highScore: 120,
  lastPlayed: '2026-02-15T10:30:00Z'
}

// 难度统计存储
{
  games: {
    'memory-match': {
      records: [
        {
          timestamp: '2026-02-15T10:30:00Z',
          level: 5,
          isCorrect: true,
          responseTime: 2100,
          targetTime: 4000,
          score: 10
        }
      ],
      consecutiveSuccess: 3,
      consecutiveFail: 0,
      recommendedLevel: 5,
      lastUpdate: '2026-02-15T10:30:00Z'
    }
  },
  lastUpdate: '2026-02-15T10:30:00Z'
}
```

---

## 评估指标

### 1. 正确率 (Accuracy)

**定义**：最近N次游戏中正确回答的比例

**计算**：
```javascript
accuracy = correctCount / totalRecords
```

**阈值**：
- 提升难度：≥ 80%
- 降低难度：< 50%

---

### 2. 响应时间 (Response Time)

**定义**：从问题呈现到用户回答的时间间隔

**计算**：
```javascript
avgResponseTime = Σ(responseTime) / totalRecords
responseTimeRatio = avgResponseTime / avgTargetTime
```

**阈值**：
- 太快：< 70% 标准时间（可能太简单）
- 太慢：> 200% 标准时间（可能太难）

---

### 3. 连续表现 (Consecutive Performance)

**定义**：连续正确或连续错误的次数

**计数规则**：
- 正确答案：consecutiveSuccess++
- 错误答案：consecutiveFail++
- 错误重置consecutiveSuccess，正确重置consecutiveFail

**阈值**：
- 提升难度：连续成功 ≥ 5次
- 降低难度：连续失败 ≥ 3次

---

## 算法决策逻辑

### 决策流程图

```
开始
  ↓
收集最近5次表现
  ↓
计算指标（正确率、响应时间、连续次数）
  ↓
判断提升条件：
  ├─ 正确率 ≥ 80% ?
  ├─ 响应时间 < 70%标准 ?
  └─ 连续成功 ≥ 5次 ?
  ↓
判断降低条件：
  ├─ 正确率 < 50% ?
  ├─ 响应时间 > 200%标准 ?
  └─ 连续失败 ≥ 3次 ?
  ↓
执行调整（如需要）
  ↓
更新推荐关卡
  ↓
显示调整通知
  ↓
结束
```

### 优先级规则

1. **提升难度**：任一条件满足
2. **降低难度**：任一条件满足（优先于提升）
3. **维持难度**：以上条件均不满足

---

## 难度参数配置

### 记忆游戏

| 关卡范围 | 卡片数量 | 显示时间 | 分数倍数 |
|---------|---------|----------|---------|
| 1-10    | 3张     | 6000-4000ms | 1.0x    |
| 11-25   | 4张     | 5000-2750ms | 1.2x    |
| 26-40   | 6张     | 4000-2500ms | 1.5x    |
| 41-50   | 8张     | 3000-2000ms | 2.0x    |

**调整幅度**：
- 显示时间：每级 ± 500ms
- 卡片数量：每5级 +1张

---

### 字母配对

| 关卡范围 | 卡片数量 | 难度系数 |
|---------|---------|----------|
| 1-10    | 2-4张   | 0.5x     |
| 11-20   | 4-6张   | 0.75x    |
| 21-30   | 6-8张   | 1.0x     |
| 31-40   | 8-10张  | 1.25x    |
| 41-50   | 10-12张 | 1.5x     |

**调整幅度**：每10级 +1张卡片

---

## 评估窗口

### 滑动窗口机制

**原理**：只保留最近N次记录进行评估，忽略历史数据

**配置**：
```javascript
evaluationWindow: 5  // 评估最近5次游戏
```

**优势**：
- 快速适应当前能力变化
- 避免历史数据影响当前判断
- 减少存储需求

**实现**：
```javascript
if (records.length > evaluationWindow) {
    records = records.slice(-evaluationWindow);
}
```

---

## UI反馈机制

### 难度调整通知

**触发时机**：关卡难度发生变化时

**显示样式**：
```
🚀 表现优秀！正确率85%，连续成功5次，已提升至第6关
或
📉 难度较大，正确率40%，已降低至第4关
```

**UI特性**：
- 渐变背景（紫色主题）
- 滑入滑出动画
- 自动消失（3秒）
- Emoji图标增强视觉反馈

---

## 技术实现

### 核心类

```javascript
class DifficultyManager {
    - loadStats()
    - saveStats()
    - recordPerformance(userId, gameId, performance)
    - evaluateAndRecommend(userId, gameId)
    - calculateMetrics(records)
    - determineAdjustment(metrics, gameStats, currentLevel)
    - getRecommendedLevel(userId, gameId)
    - generateAdjustmentMessage(adjustment)
}
```

### 集成点

1. **Games类初始化**：创建DifficultyManager实例
2. **游戏开始**：记录roundStartTime和targetTime
3. **游戏结束**：调用recordPerformance()
4. **调整触发**：显示调整通知

---

## 测试场景

### 场景1：天才儿童

**特征**：
- 正确率：90%
- 响应时间：< 50%标准时间
- 预期结果：快速提升难度

**模拟结果**：
```
第1关: ✅ 用时1.6s (0.40倍标准)
第2关: ✅ 用时1.5s (0.38倍标准)
...
🎯 🚀 表现优秀！正确率90%，已提升至第6关
```

---

### 场景2：普通儿童

**特征**：
- 正确率：70%
- 响应时间：90-150%标准时间
- 预期结果：维持当前难度

**模拟结果**：
```
第1关: ✅ 用时3.6s (0.90倍标准)
第2关: ❌ 用时6.0s (1.50倍标准)
第3关: ✅ 用时3.5s (0.88倍标准)
...
（维持当前难度，无调整）
```

---

### 场景3：困难儿童

**特征**：
- 正确率：40%
- 响应时间：> 200%标准时间
- 预期结果：降低难度

**模拟结果**：
```
第1关: ❌ 用时8.0s (2.00倍标准)
第2关: ❌ 用时9.0s (2.25倍标准)
...
🎯 📉 难度较大，正确率40%，已降低至第1关
```

---

### 场景4：波动表现

**特征**：
- 正确时：响应时间 < 50%标准
- 错误时：响应时间 > 200%标准
- 预期结果：波动调整，倾向于降低

**模拟结果**：
```
第1关: ✅ 用时2.0s (0.50倍标准)
第2关: ❌ 用时8.8s (2.20倍标准)
第3关: ✅ 用时1.9s (0.48倍标准)
...
🎯 📉 反应较慢，平均用时2.1倍标准时间，已降低至第2关
```

---

## 扩展性设计

### 支持新游戏

添加新游戏只需：

1. **定义难度参数**：
```javascript
adjustmentFactors: {
    'new-game': {
        param1: value1,
        param2: value2
    }
}
```

2. **记录表现**：
```javascript
this.difficultyManager.recordPerformance(userId, 'new-game', {
    level, isCorrect, responseTime, targetTime, score
});
```

---

### 自定义阈值

允许游戏覆盖默认阈值：

```javascript
customThresholds: {
    'memory-match': {
        increaseAccuracy: 0.75,  // 降低提升阈值
        fastResponse: 0.8         // 降低快速阈值
    }
}
```

---

## 性能优化

### 存储策略

1. **localStorage**：轻量级，持久化
2. **滑动窗口**：限制记录数量
3. **懒加载**：按需读取统计数据

### 计算优化

1. **增量计算**：避免每次重新计算所有指标
2. **缓存结果**：缓存最近一次的评估结果
3. **异步处理**：UI不阻塞计算

---

## 未来改进方向

1. **机器学习集成**：使用更复杂的预测模型
2. **多维度分析**：加入错误类型分析
3. **社交比较**：同年龄段孩子表现对比
4. **家长控制**：允许家长手动调整难度
5. **云端同步**：跨设备共享难度数据

---

## 附录

### 文件清单

- `js/difficulty.js` - 难度管理器核心实现
- `js/games.js` - 游戏集成点（响应时间追踪）
- `css/styles.css` - 难度通知UI样式
- `test-difficulty.html` - 测试和演示页面

### localStorage Key

- `kids_games_users` - 用户数据
- `kids_games_progress` - 游戏进度
- `kids_games_difficulty_stats` - 难度统计

---

## 总结

本自适应难度系统通过精确的量化指标、灵活的决策逻辑和友好的UI反馈，为儿童游戏提供了智能化的个性化体验。系统在保证挑战性的同时，始终维持正向激励机制，帮助孩子建立自信并持续进步。
