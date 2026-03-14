# 快速参考指南 - 自适应难度系统

## 一分钟速览

这个系统会根据孩子的游戏表现自动调整难度，确保游戏既不太简单也不太难。

### 核心指标

| 指标 | 提升难度 | 降低难度 |
|-----|---------|---------|
| 正确率 | ≥ 80% | < 50% |
| 响应时间 | < 70%标准 | > 200%标准 |
| 连续成功 | ≥ 5次 | - |
| 连续失败 | - | ≥ 3次 |

---

## 如何测试

### 方式1: 浏览器可视化测试

```bash
cd /Users/jiangbin/Documents/workspace01/games/kids-logic-games
open test-difficulty.html
```

然后点击按钮选择场景：
- 🌟 天才儿童
- 👶 普通儿童
- 📉 困难儿童
- 📊 波动表现

### 方式2: 命令行测试

```bash
node test-difficulty.js
```

---

## 如何集成到游戏

### 步骤1: 在游戏开始时记录

```javascript
// 设置目标时间（例如记忆游戏：4000ms）
this.targetTime = 4000;

// 开始计时
this.roundStartTime = Date.now();
```

### 步骤2: 在游戏结束时记录表现

```javascript
// 计算响应时间
const responseTime = Date.now() - this.roundStartTime;

// 记录表现
this.recordPerformance(isCorrect);
```

### 步骤3: DifficultyManager会自动：

- 计算性能指标
- 决定是否调整难度
- 显示调整通知（如果需要）

---

## 数据存储位置

### localStorage Keys

```javascript
'kids_games_users'           // 用户数据
'kids_games_progress'         // 游戏进度
'kids_games_difficulty_stats' // 难度统计 ⭐ 新增
```

### 数据结构

```javascript
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
      recommendedLevel: 5
    }
  }
}
```

---

## 常见问题

### Q: 如何重置难度统计？

```javascript
const manager = new DifficultyManager();
manager.resetUserStats(userId, gameId);  // 重置特定游戏
// 或
manager.resetUserStats(userId);           // 重置所有游戏
```

### Q: 如何获取推荐关卡？

```javascript
const manager = new DifficultyManager();
const level = manager.getRecommendedLevel(userId, gameId);
```

### Q: 如何调整阈值？

```javascript
this.config = {
    thresholds: {
        increaseAccuracy: 0.75,  // 自定义
        decreaseAccuracy: 0.45   // 自定义
    }
};
```

### Q: 如何添加新游戏？

```javascript
this.config = {
    adjustmentFactors: {
        'new-game': {
            param1: value1,
            param2: value2
        }
    }
};
```

---

## 文件快速索引

| 文件 | 用途 |
|-----|------|
| `js/difficulty.js` | 核心算法实现 |
| `test-difficulty.html` | 可视化测试 |
| `test-difficulty.js` | 命令行测试 |
| `ADAPTIVE_DIFFICULTY_DESIGN.md` | 完整设计文档 |
| `TEST_RESULTS.md` | 测试结果报告 |
| `IMPLEMENTATION_SUMMARY.md` | 实现总结 |

---

## 性能指标参考

### 记忆游戏

| 关卡 | 卡片数 | 显示时间 | 难度系数 |
|-----|--------|---------|---------|
| 1-10 | 3张 | 6-4秒 | 1.0x |
| 11-25 | 4张 | 5-2.75秒 | 1.2x |
| 26-40 | 6张 | 4-2.5秒 | 1.5x |
| 41-50 | 8张 | 3-2秒 | 2.0x |

### 响应时间评估

| 实际用时 | 标准时间 | 比率 | 评估 |
|---------|---------|------|------|
| 2秒 | 4秒 | 0.5x | 很快 |
| 3.6秒 | 4秒 | 0.9x | 正常 |
| 8秒 | 4秒 | 2.0x | 慢 |
| 10秒 | 4秒 | 2.5x | 很慢 |

---

## 调试技巧

### 查看存储数据

```javascript
const manager = new DifficultyManager();
console.log(manager.stats);
```

### 查看性能摘要

```javascript
const summary = manager.getPerformanceSummary(userId, gameId);
console.log(summary);
// { totalGames: 10, accuracy: 0.8, avgResponseTime: 3000, ... }
```

### 手动模拟表现

```javascript
manager.recordPerformance(userId, gameId, {
    level: 5,
    isCorrect: true,
    responseTime: 2000,
    targetTime: 4000,
    score: 10
});
```

---

## 快速检查清单

- [x] 核心算法实现完成
- [x] 游戏集成完成
- [x] UI反馈组件完成
- [x] 测试系统完成
- [x] 文档编写完成
- [x] 所有测试通过

**状态**: ✅ 生产就绪

---

## 联系与支持

如有问题，请参考：
1. `ADAPTIVE_DIFFICULTY_DESIGN.md` - 完整设计文档
2. `TEST_RESULTS.md` - 测试结果分析
3. `IMPLEMENTATION_SUMMARY.md` - 实现总结

---

**版本**: v1.0
**更新日期**: 2026-02-15
**状态**: ✅ 完成并测试通过
