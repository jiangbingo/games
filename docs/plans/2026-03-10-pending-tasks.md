# 游戏集成待办任务

**创建时间**: 2026-03-10
**状态**: 进行中

## 背景

将外部HTML游戏集成到主 `index.html` 中，作为内部游戏运行（无页面跳转）。

## 已完成 ✅

1. **HabitTracker** - 习惯养成游戏
2. **DrawingBoardGame** - 涂鸦板游戏

## 待完成 ⏳

### 1. MemoryCardsGame (记忆翻牌)
- **源文件**: `memory-cards.html` (447行)
- **核心功能**: 
  - 4x3卡片配对 (6对emoji)
  - 翻牌动画 (3D旋转)
  - 配对检测
  - 庆祝动画 (confetti)
- **难度**: 简单

### 2. ColorMatchingGame (颜色配对)
- **源文件**: `color-matching.html` (372行)
- **核心功能**:
  - 8种颜色认知
  - 显示颜色名称，选择对应颜色块
  - 正确/错误反馈动画
  - Web Audio音效
- **难度**: 简单

### 3. ShapeMatchingGame (形状配对)
- **源文件**: `shape-matching.html` (284行)
- **核心功能**:
  - 8种形状emoji配对
  - 匹配相同形状
  - 简单音效
- **难度**: 简单

### 4. NumberCountingGame (数字认知)
- **源文件**: `number-counting.html` (537行)
- **核心功能**:
  - 数物品数量 (1-10)
  - 3个难度级别 (1-3, 1-5, 1-10)
  - 随机物品emoji
  - 家长设置面板
- **难度**: 中等

### 5. PictureRecognitionGame (看图识物)
- **源文件**: `picture-recognition.html` (305行)
- **核心功能**:
  - 3个分类 (动物/水果/交通)
  - 显示emoji图片，选择对应emoji
  - 计分系统
- **难度**: 简单

### 6. AnimalSoundsGame (动物叫声)
- **源文件**: `animal-sounds.html` (745行)
- **核心功能**:
  - 8种动物叫声 (Web Audio合成)
  - 2种模式 (自由模式/猜一猜)
  - Web Speech API语音反馈
  - 复杂的音效生成逻辑
- **难度**: 较高 (音效逻辑复杂)

### 7. FindDifferencesGame (找不同)
- **源文件**: `find-differences.html` (785行)
- **核心功能**:
  - 5个关卡，不同主题 (农场/海洋/公园/太空/花园)
  - 找出左右两图差异
  - 提示系统 (3次)
  - 标记差异位置
- **难度**: 中等

### 8. ShapePuzzleGame (形状拼拼乐)
- **源文件**: `shape-puzzle.html` (914行)
- **核心功能**:
  - 2种模式 (预设/自由)
  - Canvas绘制形状
  - 拖拽形状到目标位置
  - 吸附检测
- **难度**: 较高 (Canvas + 拖拽逻辑)

### 9. PatternMatchGame (模式连连看)
- **源文件**: `pattern-match.html` (912行)
- **核心功能**:
  - 10个关卡
  - 模式识别 (ABAB, ABCABC, AAB, ABBA等)
  - 填空选择
  - 多种主题 (颜色/水果/动物/形状/交通)
- **难度**: 较高

## 集成模板

每个游戏类需要遵循以下结构:

```javascript
class GameNameGame {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.gameType = 'game-id';
        this.name = '游戏名称';
    }
    
    start() {
        const gameArea = document.getElementById('game-area');
        gameArea.innerHTML = `...`;
        this.setupEvents();
    }
    
    setupEvents() {
        // 事件监听
    }
    
    // 游戏核心方法
    
    addTouchFeedback(element) {
        // 复用 gameManager 的方法
    }
    
    playSound(type) {
        // Web Audio 音效
    }
    
    showCelebration() {
        // 庆祝动画
    }
}
```

## 文件位置

- **目标文件**: `js/games.js`
- **当前行数**: 3146行
- **预估增加**: 约2000-2500行 (9个游戏 × 200-300行)

## 下一步

1. 选择一个游戏开始集成
2. 阅读源HTML，提取核心逻辑
3. 创建简化版类 (移除HTML/CSS依赖)
4. 添加到 `js/games.js` 末尾
5. 在 `index.html` 中确保 `data-game="xxx"` 属性正确
6. 测试游戏功能

## 优先级建议

**简单优先** (建议顺序):
1. ShapeMatchingGame - 最简单，纯emoji配对
2. ColorMatchingGame - 简单，颜色配对
3. PictureRecognitionGame - 简单，看图选择
4. MemoryCardsGame - 中等，翻牌逻辑
5. NumberCountingGame - 中等，带设置面板
6. PatternMatchGame - 较高，模式识别
7. FindDifferencesGame - 较高，关卡系统
8. AnimalSoundsGame - 较高，音效复杂
9. ShapePuzzleGame - 较高，Canvas+拖拽

## 注意事项

1. **零依赖**: 不引入外部库 (htmx已移除)
2. **触摸优化**: 必须添加触摸反馈
3. **移动端适配**: 使用 clamp() 和响应式布局
4. **音效**: 使用 Web Audio API
5. **代码风格**: 2空格缩进，单引号，JSDoc中文注释
