# AI 智能题目生成 - Prompt 模板

## 概述

本文档定义了用于 AI 生成儿童游戏题目的 Prompt 模板，适用于 BigModel API 等大语言模型。

---

## 1. 记忆游戏 Prompt 模板

### 1.1 基础模板

```
你是一位儿童教育专家，需要为3-6岁儿童设计记忆翻牌游戏的题目。

### 要求
1. 生成6个emoji图标作为配对主题
2. 主题分类：水果、动物、交通工具、运动、蔬菜、乐器等
3. 每个emoji必须清晰、适合儿童、易于识别
4. 返回JSON格式，包含主题名称和emoji列表

### 输出格式
{
  "theme": "主题名称（中文）",
  "emojis": ["🍎", "🍌", "🍇", "🍊", "🍓", "🍑"]
}

### 示例
输入：生成一个水果主题的记忆翻牌游戏
输出：
{
  "theme": "美味水果",
  "emojis": ["🍎", "🍌", "🍇", "🍊", "🍓", "🍑"]
}
```

### 1.2 进阶模板（带难度分级）

```
你是一位儿童教育专家，需要为3-6岁儿童设计记忆翻牌游戏的题目。

### 要求
1. 根据年龄生成适合难度的题目
2. 难度分级：
   - 简单（3-4岁）：常见物品，颜色鲜艳，形态独特
   - 中等（4-5岁）：常见物品，包含一些需要辨别的元素
   - 困难（5-6岁）：包含一些相似度较高的物品
3. 返回JSON格式，包含主题名称、emoji列表、难度等级

### 输出格式
{
  "theme": "主题名称（中文）",
  "emojis": ["🍎", "🍌", "🍇", "🍊", "🍓", "🍑"],
  "difficulty": "简单|中等|困难",
  "age_group": "3-4岁|4-5岁|5-6岁"
}

### 示例
输入：为4岁儿童生成一个中等难度的动物主题记忆翻牌游戏
输出：
{
  "theme": "可爱动物",
  "emojis": ["🐶", "🐱", "🐰", "🦊", "🐻", "🐼"],
  "difficulty": "中等",
  "age_group": "4-5岁"
}
```

---

## 2. 形状配对 Prompt 模板

### 2.1 基础模板

```
你是一位儿童教育专家，需要为3-6岁儿童设计形状配对游戏的题目。

### 要求
1. 生成8个基础形状emoji作为配对元素
2. 形状必须简单、清晰、易于识别
3. 颜色应该鲜艳、对比度高
4. 返回JSON格式，包含形状名称和emoji

### 输出格式
{
  "shapes": [
    {"name": "圆形", "emoji": "🔵"},
    {"name": "方形", "emoji": "🟦"}
  ]
}

### 示例
输入：生成形状配对游戏的形状集
输出：
{
  "shapes": [
    {"name": "圆形", "emoji": "🔵"},
    {"name": "方形", "emoji": "🟦"},
    {"name": "三角形", "emoji": "🔺"},
    {"name": "心形", "emoji": "❤️"},
    {"name": "星形", "emoji": "⭐"},
    {"name": "月亮", "emoji": "🌙"},
    {"name": "云朵", "emoji": "☁️"},
    {"name": "太阳", "emoji": "☀️"}
  ]
}
```

### 2.2 进阶模板（带颜色和难度）

```
你是一位儿童教育专家，需要为3-6岁儿童设计形状配对游戏的题目。

### 要求
1. 生成形状集，每个形状包含多种颜色变体
2. 颜色：红、蓝、绿、黄、紫、橙等鲜艳颜色
3. 难度分级：
   - 简单：形状差异大，颜色鲜艳
   - 中等：形状有一定相似性
   - 困难：形状相似度高，需要仔细观察
4. 返回JSON格式，包含形状信息

### 输出格式
{
  "shapes": [
    {
      "name": "圆形",
      "variants": [
        {"emoji": "🔵", "color": "蓝色"},
        {"emoji": "🔴", "color": "红色"},
        {"emoji": "🟢", "color": "绿色"}
      ]
    }
  ],
  "difficulty": "简单|中等|困难",
  "age_group": "3-4岁|4-5岁|5-6岁"
}
```

---

## 3. 声音配对 Prompt 模板

### 3.1 基础模板

```
你是一位儿童教育专家，需要为3-6岁儿童设计动物声音配对游戏的题目。

### 要求
1. 生成8个常见动物的emoji和声音描述
2. 动物必须常见、声音特征明显
3. 包含动物名称、emoji、声音文本描述、声音参数
4. 返回JSON格式

### 输出格式
{
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
  ]
}

### 音频参数说明
- freq: 基础频率（Hz）
- duration: 持续时间（秒）
- pattern: 声音模式（bark, meow, moo, oink, croak, roar, crow, quack）

### 示例
输入：生成动物声音配对游戏的动物集
输出：
{
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
    },
    {
      "emoji": "🐱",
      "name": "小猫",
      "sound_text": "喵喵喵",
      "audio_params": {
        "freq": 600,
        "duration": 0.4,
        "pattern": "meow"
      }
    }
  ]
}
```

### 3.2 进阶模板（带环境场景）

```
你是一位儿童教育专家，需要为3-6岁儿童设计动物声音配对游戏的题目。

### 要求
1. 按环境场景分类生成动物
2. 场景：农场、森林、水里、天空等
3. 每个场景4-6个动物
4. 返回JSON格式，包含场景和动物列表

### 输出格式
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
  "difficulty": "简单|中等|困难",
  "age_group": "3-4岁|4-5岁|5-6岁"
}
```

---

## 4. 通用参数说明

### 4.1 年龄适配

| 年龄 | 题目特点 | emoji 要求 |
|------|---------|------------|
| 3-4岁 | 简单、直观、常见 | 颜色鲜艳、形态独特 |
| 4-5岁 | 中等难度 | 包含一些需要辨别的元素 |
| 5-6岁 | 困难 | 相似度较高的物品 |

### 4.2 输出约束

1. 必须是有效的 JSON 格式
2. emoji 必须是 Unicode 标准
3. 字段名使用小写+下划线
4. 所有文本使用中文

### 4.3 题目生成建议

1. **多样性**：每个主题至少生成10个变体
2. **安全性**：确保所有内容适合儿童
3. **教育性**：选择有教育意义的主题
4. **趣味性**：保持游戏趣味性

---

## 5. API 调用示例

### 5.1 记忆游戏

```javascript
const prompt = `你是一位儿童教育专家，需要为3-6岁儿童设计记忆翻牌游戏的题目。

### 要求
1. 生成6个emoji图标作为配对主题
2. 主题分类：水果、动物、交通工具、运动、蔬菜、乐器等
3. 每个emoji必须清晰、适合儿童、易于识别
4. 返回JSON格式，包含主题名称和emoji列表

### 输出格式
{
  "theme": "主题名称（中文）",
  "emojis": ["🍎", "🍌", "🍇", "🍊", "🍓", "🍑"]
}`;

// API 调用
const response = await callBigModelAPI(prompt);
const gameData = JSON.parse(response);
```

### 5.2 形状配对

```javascript
const prompt = `你是一位儿童教育专家，需要为3-6岁儿童设计形状配对游戏的题目。

### 要求
1. 生成8个基础形状emoji作为配对元素
2. 形状必须简单、清晰、易于识别
3. 颜色应该鲜艳、对比度高
4. 返回JSON格式，包含形状名称和emoji

### 输出格式
{
  "shapes": [
    {"name": "圆形", "emoji": "🔵"},
    {"name": "方形", "emoji": "🟦"}
  ]
}`;

// API 调用
const response = await callBigModelAPI(prompt);
const gameData = JSON.parse(response);
```

### 5.3 声音配对

```javascript
const prompt = `你是一位儿童教育专家，需要为3-6岁儿童设计动物声音配对游戏的题目。

### 要求
1. 生成8个常见动物的emoji和声音描述
2. 动物必须常见、声音特征明显
3. 包含动物名称、emoji、声音文本描述、声音参数
4. 返回JSON格式

### 输出格式
{
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
  ]
}`;

// API 调用
const response = await callBigModelAPI(prompt);
const gameData = JSON.parse(response);
```

---

## 6. 缓存策略

### 6.1 缓存规则

1. **主题级别缓存**：每个主题的题目生成后缓存
2. **时效性**：缓存7天，过期后重新生成
3. **本地优先**：优先使用本地缓存的题目
4. **按需生成**：用户首次访问主题时生成

### 6.2 缓存键设计

```
memory_game_{theme}_{age_group}_{difficulty}
shape_match_{age_group}_{difficulty}
sound_match_{scene}_{age_group}_{difficulty}
```

### 6.3 缓存示例

```javascript
// 缓存键
const cacheKey = `memory_game_水果_4-5岁_中等`;

// 检查缓存
let gameData = await getFromCache(cacheKey);

if (!gameData) {
  // 调用 API 生成
  gameData = await callBigModelAPI(prompt);
  // 存入缓存
  await saveToCache(cacheKey, gameData, 7 * 24 * 60 * 60); // 7天
}
```

---

## 7. 错误处理

### 7.1 API 调用失败

```javascript
try {
  const response = await callBigModelAPI(prompt);
  return JSON.parse(response);
} catch (error) {
  console.error('API 调用失败:', error);
  // 返回预设的默认题目
  return getFallbackGameData(gameType);
}
```

### 7.2 JSON 解析失败

```javascript
try {
  const gameData = JSON.parse(response);
  validateGameData(gameData); // 验证数据格式
  return gameData;
} catch (error) {
  console.error('JSON 解析失败:', error);
  return getFallbackGameData(gameType);
}
```

---

## 8. 测试用例

### 8.1 记忆游戏测试

```javascript
// 测试用例：生成水果主题
const prompt = `生成一个水果主题的记忆翻牌游戏`;
const expected = {
  "theme": "美味水果",
  "emojis": ["🍎", "🍌", "🍇", "🍊", "🍓", "🍑"]
};
```

### 8.2 形状配对测试

```javascript
// 测试用例：生成形状集
const prompt = `生成形状配对游戏的形状集`;
const expected = {
  "shapes": [
    {"name": "圆形", "emoji": "🔵"},
    {"name": "方形", "emoji": "🟦"}
  ]
};
```

### 8.3 声音配对测试

```javascript
// 测试用例：生成动物集
const prompt = `生成动物声音配对游戏的动物集`;
const expected = {
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
  ]
};
```

---

## 总结

本 Prompt 模板提供了三个游戏的完整 AI 生成方案：

1. **记忆游戏**：主题化 emoji 配对
2. **形状配对**：颜色形状识别
3. **声音配对**：动物声音映射

所有模板支持年龄适配和难度分级，确保生成的内容适合3-6岁儿童。
