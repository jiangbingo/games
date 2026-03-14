# BigModel API 集成使用指南

## 概述

AI 题目生成器已升级为支持真实的 BigModel API 调用，同时保留模拟数据作为降级方案。

## 📁 文件结构

```
kids-logic-games/
├── js/
│   ├── config.js              # API 配置文件
│   ├── bigmodel-client.js     # BigModel API 客户端
│   └── ai-game-generator.js  # AI 题目生成器（已升级）
└── ai-api-demo.html          # API 集成演示页面
```

## 🚀 快速开始

### 1. 配置 API Key

#### 方式一：通过代码配置

```javascript
// 在调用 API 前配置
aiGenerator.setApiKey('your-bigmodel-api-key-here')
```

#### 方式二：通过配置文件

编辑 `js/config.js`，找到 API Key 配置：

```javascript
const CONFIG = {
  bigmodel: {
    apiKey: 'YOUR_BIGMODEL_API_KEY_HERE',  // 在这里填写你的 API Key
    // ... 其他配置
  }
}
```

#### 方式三：通过演示页面

1. 打开 `ai-api-demo.html`
2. 在页面中输入你的 API Key
3. 点击"配置 API Key"

### 2. 选择 API 模式

```javascript
// Auto 模式（推荐）：优先使用 API，失败时降级到模拟数据
aiGenerator.setApiMode('auto')

// Mock 模式：仅使用模拟数据
aiGenerator.setApiMode('mock')

// API 模式：仅使用 API，失败时抛出异常
aiGenerator.setApiMode('api')
```

### 3. 生成游戏题目

#### 记忆翻牌游戏

```javascript
const gameData = await aiGenerator.generateMemoryGame(
  '水果',      // 主题：水果、动物、交通工具等
  '4-5岁',     // 年龄组
  '中等'        // 难度：简单、中等、困难
)

// 返回数据格式
{
  "theme": "美味水果",
  "emojis": ["🍎", "🍌", "🍇", "🍊", "🍓", "🍑"],
  "difficulty": "中等",
  "age_group": "4-5岁",
  "fromCache": false,
  "fallback": false
}
```

#### 形状配对游戏

```javascript
const gameData = await aiGenerator.generateShapeGame(
  '4-5岁',     // 年龄组
  '中等'        // 难度
)

// 返回数据格式
{
  "shapes": [
    {"name": "圆形", "emoji": "🔵"},
    {"name": "方形", "emoji": "🟦"}
  ],
  "difficulty": "中等",
  "age_group": "4-5岁",
  "fromCache": false,
  "fallback": false
}
```

#### 声音配对游戏

```javascript
const gameData = await aiGenerator.generateSoundGame(
  '农场',       // 场景：农场、森林、水里、天空
  '4-5岁',     // 年龄组
  '中等'        // 难度
)

// 返回数据格式
{
  "scene": "农场",
  "animals": [
    {
      "emoji": "🐶",
      "name": "小狗",
      "sound_text": "汪汪汪",
      "audio_params": {
        "freq": 400,
        "duration": 0.3,
        "pattern": "bark"
      }
    }
  ],
  "difficulty": "中等",
  "age_group": "4-5岁",
  "fromCache": false,
  "fallback": false
}
```

## 🔧 配置说明

### API 配置（config.js）

```javascript
const CONFIG = {
  bigmodel: {
    endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',  // API 端点
    model: 'zai/glm-5',      // 模型名称
    apiKey: 'YOUR_KEY',      // API Key
    timeout: 30000,           // 请求超时（毫秒）
    maxRetries: 2,           // 最大重试次数
    retryDelay: 1000,        // 重试延迟（毫秒）
    temperature: 0.7,        // 温度参数
    maxTokens: 1000,         // 最大 token 数
    topP: 0.9               // top-p 参数
  }
}
```

### API 模式说明

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| **auto** | 优先 API，失败降级 | 生产环境（推荐） |
| **mock** | 仅模拟数据 | 开发测试、离线环境 |
| **api** | 仅 API，失败抛异常 | 强制使用 API 的场景 |

## ⚡ 性能优化

### 缓存机制

系统会自动缓存生成的游戏数据，默认缓存 7 天：

```javascript
// 检查缓存大小
console.log(aiGenerator.getCacheSize())

// 清除缓存
aiGenerator.clearCache()

// 禁用缓存
aiGenerator.setCacheEnabled(false)
```

### 重试机制

API 调用失败时会自动重试（最多 2 次），重试间隔会递增：

```
第一次失败 → 等待 1000ms → 第二次失败 → 等待 2000ms → 第三次失败 → 降级
```

## 🎯 错误处理

### API 调用失败

```javascript
try {
  const data = await aiGenerator.generateMemoryGame('水果', '4-5岁', '中等')
} catch (error) {
  console.error('生成失败:', error)

  if (aiGenerator.getApiMode() === 'auto') {
    // Auto 模式下，会自动降级到模拟数据
    console.log('已使用模拟数据降级')
  } else {
    // API 或 Mock 模式下，需要手动处理错误
  }
}
```

### 检查数据来源

```javascript
const data = await aiGenerator.generateMemoryGame('水果', '4-5岁', '中等')

if (data.fallback) {
  console.log('使用的是模拟数据（降级）')
} else if (data.fromCache) {
  console.log('使用的是缓存数据')
} else {
  console.log('使用的是 API 生成的新数据')
}
```

## 🔐 安全建议

1. **不要将 API Key 提交到 Git**：确保 `.gitignore` 包含 `js/config.js` 或使用环境变量
2. **使用环境变量**：在生产环境中，使用环境变量存储 API Key
3. **限制 API Key 权限**：为生产环境创建专用的 API Key，并设置适当的限制

## 📊 监控和调试

### 启用详细日志

```javascript
// 查看所有 API 调用日志
aiGenerator.setCacheEnabled(true)
aiGenerator.setApiMode('auto')
```

### 检查 API 配置

```javascript
// 检查 API Key 是否已配置
if (aiGenerator.isApiConfigured()) {
  console.log('API 已配置')
} else {
  console.log('API 未配置，将使用模拟数据')
}
```

## 🧪 测试

打开 `ai-api-demo.html` 进行测试：

1. 配置 API Key（可选）
2. 选择 API 模式
3. 点击不同的游戏生成按钮
4. 查看生成的结果和数据来源

## 📚 完整示例

```html
<!DOCTYPE html>
<html>
<head>
  <title>AI 游戏示例</title>
</head>
<body>
  <h1>记忆翻牌游戏</h1>
  <button onclick="generateGame()">生成新游戏</button>
  <div id="game"></div>

  <script src="js/config.js"></script>
  <script src="js/bigmodel-client.js"></script>
  <script src="js/ai-game-generator.js"></script>

  <script>
    // 配置 API Key
    aiGenerator.setApiKey('your-api-key-here')

    // 生成游戏
    async function generateGame() {
      try {
        const data = await aiGenerator.generateMemoryGame('水果', '4-5岁', '中等')

        // 显示卡片
        const gameDiv = document.getElementById('game')
        gameDiv.innerHTML = data.emojis.map(emoji =>
          `<div style="font-size: 48px; margin: 10px;">${emoji}</div>`
        ).join('')

      } catch (error) {
        console.error('生成失败:', error)
      }
    }
  </script>
</body>
</html>
```

## ❓ 常见问题

### Q: 如何获取 BigModel API Key？

A: 访问 [BigModel 开放平台](https://open.bigmodel.cn/) 注册账号并创建 API Key。

### Q: API 调用失败怎么办？

A: 系统会自动降级到模拟数据。你也可以：
- 检查网络连接
- 验证 API Key 是否正确
- 查看控制台错误信息

### Q: 如何禁用缓存？

A: 使用 `aiGenerator.setCacheEnabled(false)`。

### Q: 可以同时生成多个游戏吗？

A: 可以使用批量生成：

```javascript
const results = await aiGenerator.generateMultipleGames('memory', [
  { theme: '水果', ageGroup: '4-5岁', difficulty: '简单' },
  { theme: '动物', ageGroup: '4-5岁', difficulty: '中等' }
])
```

## 📝 更新日志

### v1.0 (2026-02-15)
- ✅ 集成 BigModel API 调用
- ✅ 添加配置管理系统
- ✅ 实现降级方案
- ✅ 添加缓存机制
- ✅ 支持多种 API 模式
- ✅ 创建演示页面
