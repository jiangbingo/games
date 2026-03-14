# AI 智能题目生成 - API 架构设计

## 概述

本文档定义了 AI 智能题目生成系统的 API 架构，包括 BigModel API 调用、Supabase Edge Function 代理、缓存策略等。

---

## 1. 系统架构

### 1.1 整体架构图

```
┌─────────────┐
│  前端游戏   │
│  (HTML/JS)  │
└──────┬──────┘
       │
       │ 1. 请求题目
       ▼
┌─────────────────────────────────┐
│    Supabase Edge Function       │
│  ┌───────────────────────────┐  │
│  │  缓存检查                  │  │
│  │  (Redis 或 PostgreSQL)    │  │
│  └───────────┬───────────────┘  │
│              │                   │
│       缓存命中?                  │
│              ├─ 是 ─→ 返回缓存  │
│              │                   │
│              └─ 否 ─→ 调用 BigModel API
│                              ▼
│                   ┌──────────────────────┐
│                   │   BigModel API       │
│                   │  (GLM-4.7)           │
│                   └──────────┬───────────┘
│                              │
│                              ▼
│                        存入缓存并返回
└───────────────────────────────┘
```

### 1.2 技术栈

- **前端**: 原生 JavaScript (ES6+)
- **后端代理**: Supabase Edge Functions (Deno)
- **AI 模型**: BigModel GLM-4.7
- **缓存**: PostgreSQL (jsonb) 或 Redis
- **存储**: Supabase PostgreSQL

---

## 2. BigModel API 调用

### 2.1 API 端点

```
POST https://open.bigmodel.cn/api/paas/v4/chat/completions
```

### 2.2 请求格式

```javascript
{
  "model": "glm-4.7",
  "messages": [
    {
      "role": "system",
      "content": "你是一位儿童教育专家..."
    },
    {
      "role": "user",
      "content": "生成一个水果主题的记忆翻牌游戏"
    }
  ],
  "temperature": 0.7,
  "top_p": 0.9,
  "max_tokens": 2000
}
```

### 2.3 请求参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| model | string | 是 | 模型名称，固定为 "glm-4.7" |
| messages | array | 是 | 消息列表 |
| temperature | float | 否 | 采样温度，0-1，默认 0.7 |
| top_p | float | 否 | 核采样，0-1，默认 0.9 |
| max_tokens | int | 否 | 最大输出 token 数，默认 2000 |

### 2.4 响应格式

```javascript
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "glm-4.7",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "{\"theme\": \"美味水果\", \"emojis\": [\"🍎\", \"🍌\", \"🍇\", \"🍊\", \"🍓\", \"🍑\"]}"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 100,
    "completion_tokens": 50,
    "total_tokens": 150
  }
}
```

### 2.5 认证方式

使用 API Key 进行认证：

```javascript
headers: {
  "Authorization": "Bearer YOUR_API_KEY",
  "Content-Type": "application/json"
}
```

---

## 3. Supabase Edge Function 代理

### 3.1 目录结构

```
supabase/
└── functions/
    ├── generate-memory-game/
    │   └── index.ts
    ├── generate-shape-game/
    │   └── index.ts
    ├── generate-sound-game/
    │   └── index.ts
    └── shared/
        ├── cache.ts
        ├── bigmodel.ts
        └── types.ts
```

### 3.2 记忆游戏 Edge Function

```typescript
// supabase/functions/generate-memory-game/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../shared/cors.ts'
import { getCachedGame, setCachedGame } from '../shared/cache.ts'
import { callBigModelAPI } from '../shared/bigmodel.ts'

serve(async (req) => {
  // CORS 处理
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { theme, ageGroup, difficulty } = await req.json()

    // 验证参数
    if (!theme || !ageGroup || !difficulty) {
      throw new Error('缺少必要参数: theme, ageGroup, difficulty')
    }

    // 生成缓存键
    const cacheKey = `memory_game_${theme}_${ageGroup}_${difficulty}`

    // 检查缓存
    const cached = await getCachedGame(cacheKey)
    if (cached) {
      console.log('缓存命中:', cacheKey)
      return new Response(
        JSON.stringify({ data: cached, fromCache: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 构建提示词
    const prompt = buildMemoryGamePrompt(theme, ageGroup, difficulty)

    // 调用 BigModel API
    const aiResponse = await callBigModelAPI(prompt)

    // 解析 AI 响应
    const gameData = JSON.parse(aiResponse)

    // 验证数据格式
    validateMemoryGameData(gameData)

    // 存入缓存（7天）
    await setCachedGame(cacheKey, gameData, 7 * 24 * 60 * 60)

    return new Response(
      JSON.stringify({ data: gameData, fromCache: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('生成题目失败:', error)

    // 返回预设的默认题目
    const fallbackData = getFallbackMemoryGameData(theme)

    return new Response(
      JSON.stringify({ data: fallbackData, fallback: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function buildMemoryGamePrompt(theme: string, ageGroup: string, difficulty: string): string {
  return `你是一位儿童教育专家，需要为${ageGroup}儿童设计记忆翻牌游戏的题目。

### 要求
1. 生成6个emoji图标作为配对主题
2. 主题：${theme}
3. 难度：${difficulty}
4. 每个emoji必须清晰、适合儿童、易于识别
5. 返回JSON格式，包含主题名称和emoji列表

### 输出格式
{
  "theme": "主题名称（中文）",
  "emojis": ["🍎", "🍌", "🍇", "🍊", "🍓", "🍑"],
  "difficulty": "${difficulty}",
  "age_group": "${ageGroup}"
}`;
}

function validateMemoryGameData(data: any): void {
  if (!data.theme || !Array.isArray(data.emojis) || data.emojis.length !== 6) {
    throw new Error('数据格式不正确')
  }

  // 验证每个 emoji
  data.emojis.forEach((emoji: string) => {
    if (typeof emoji !== 'string' || emoji.length === 0) {
      throw new Error('emoji 格式不正确')
    }
  })
}

function getFallbackMemoryGameData(theme: string): any {
  const fallbackThemes = {
    '水果': { theme: '美味水果', emojis: ['🍎', '🍌', '🍇', '🍊', '🍓', '🍑'] },
    '动物': { theme: '可爱动物', emojis: ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼'] },
    '交通工具': { theme: '交通工具', emojis: ['🚗', '🚌', '🚓', '🚑', '🚒', '🚕'] },
  }

  return fallbackThemes[theme] || fallbackThemes['水果']
}
```

### 3.3 形状配对 Edge Function

```typescript
// supabase/functions/generate-shape-game/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../shared/cors.ts'
import { getCachedGame, setCachedGame } from '../shared/cache.ts'
import { callBigModelAPI } from '../shared/bigmodel.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { ageGroup, difficulty } = await req.json()

    const cacheKey = `shape_match_${ageGroup}_${difficulty}`
    const cached = await getCachedGame(cacheKey)

    if (cached) {
      return new Response(
        JSON.stringify({ data: cached, fromCache: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const prompt = buildShapeGamePrompt(ageGroup, difficulty)
    const aiResponse = await callBigModelAPI(prompt)
    const gameData = JSON.parse(aiResponse)

    validateShapeGameData(gameData)
    await setCachedGame(cacheKey, gameData, 7 * 24 * 60 * 60)

    return new Response(
      JSON.stringify({ data: gameData, fromCache: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('生成形状题目失败:', error)
    const fallbackData = getFallbackShapeGameData()

    return new Response(
      JSON.stringify({ data: fallbackData, fallback: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function buildShapeGamePrompt(ageGroup: string, difficulty: string): string {
  return `你是一位儿童教育专家，需要为${ageGroup}儿童设计形状配对游戏的题目。

### 要求
1. 生成8个基础形状emoji作为配对元素
2. 难度：${difficulty}
3. 形状必须简单、清晰、易于识别
4. 返回JSON格式，包含形状名称和emoji

### 输出格式
{
  "shapes": [
    {"name": "圆形", "emoji": "🔵"},
    {"name": "方形", "emoji": "🟦"}
  ],
  "difficulty": "${difficulty}",
  "age_group": "${ageGroup}"
}`;
}

function validateShapeGameData(data: any): void {
  if (!Array.isArray(data.shapes) || data.shapes.length !== 8) {
    throw new Error('数据格式不正确')
  }
}

function getFallbackShapeGameData(): any {
  return {
    shapes: [
      { name: '圆形', emoji: '🔵' },
      { name: '方形', emoji: '🟦' },
      { name: '三角形', emoji: '🔺' },
      { name: '心形', emoji: '❤️' },
      { name: '星形', emoji: '⭐' },
      { name: '月亮', emoji: '🌙' },
      { name: '云朵', emoji: '☁️' },
      { name: '太阳', emoji: '☀️' }
    ],
    difficulty: '中等',
    age_group: '4-5岁'
  }
}
```

### 3.4 声音配对 Edge Function

```typescript
// supabase/functions/generate-sound-game/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../shared/cors.ts'
import { getCachedGame, setCachedGame } from '../shared/cache.ts'
import { callBigModelAPI } from '../shared/bigmodel.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { scene, ageGroup, difficulty } = await req.json()

    const cacheKey = `sound_match_${scene}_${ageGroup}_${difficulty}`
    const cached = await getCachedGame(cacheKey)

    if (cached) {
      return new Response(
        JSON.stringify({ data: cached, fromCache: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const prompt = buildSoundGamePrompt(scene, ageGroup, difficulty)
    const aiResponse = await callBigModelAPI(prompt)
    const gameData = JSON.parse(aiResponse)

    validateSoundGameData(gameData)
    await setCachedGame(cacheKey, gameData, 7 * 24 * 60 * 60)

    return new Response(
      JSON.stringify({ data: gameData, fromCache: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('生成声音题目失败:', error)
    const fallbackData = getFallbackSoundGameData(scene)

    return new Response(
      JSON.stringify({ data: fallbackData, fallback: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function buildSoundGamePrompt(scene: string, ageGroup: string, difficulty: string): string {
  return `你是一位儿童教育专家，需要为${ageGroup}儿童设计动物声音配对游戏的题目。

### 要求
1. 场景：${scene}
2. 难度：${difficulty}
3. 生成8个常见动物的emoji和声音描述
4. 包含动物名称、emoji、声音文本描述、声音参数
5. 返回JSON格式

### 输出格式
{
  "scene": "场景名称",
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
  "difficulty": "${difficulty}",
  "age_group": "${ageGroup}"
}`;
}

function validateSoundGameData(data: any): void {
  if (!data.scene || !Array.isArray(data.animals) || data.animals.length !== 8) {
    throw new Error('数据格式不正确')
  }

  data.animals.forEach((animal: any) => {
    if (!animal.emoji || !animal.name || !animal.sound_text || !animal.audio_params) {
      throw new Error('动物数据格式不正确')
    }
  })
}

function getFallbackSoundGameData(scene: string): any {
  return {
    scene: scene || '农场',
    animals: [
      { emoji: '🐶', name: '小狗', sound_text: '汪汪汪', audio_params: { freq: 400, duration: 0.3, pattern: 'bark' } },
      { emoji: '🐱', name: '小猫', sound_text: '喵喵喵', audio_params: { freq: 600, duration: 0.4, pattern: 'meow' } },
      { emoji: '🐮', name: '奶牛', sound_text: '哞哞', audio_params: { freq: 150, duration: 0.8, pattern: 'moo' } },
      { emoji: '🐷', name: '小猪', sound_text: '哼哼', audio_params: { freq: 300, duration: 0.5, pattern: 'oink' } },
      { emoji: '🐸', name: '青蛙', sound_text: '呱呱', audio_params: { freq: 200, duration: 0.2, pattern: 'croak' } },
      { emoji: '🦁', name: '狮子', sound_text: '嗷呜', audio_params: { freq: 120, duration: 1.0, pattern: 'roar' } },
      { emoji: '🐔', name: '公鸡', sound_text: '喔喔', audio_params: { freq: 500, duration: 0.6, pattern: 'crow' } },
      { emoji: '🦆', name: '鸭子', sound_text: '嘎嘎', audio_params: { freq: 350, duration: 0.35, pattern: 'quack' } }
    ],
    difficulty: '中等',
    age_group: '4-5岁'
  }
}
```

---

## 4. 共享模块

### 4.1 CORS 配置

```typescript
// supabase/functions/shared/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
}
```

### 4.2 缓存模块

```typescript
// supabase/functions/shared/cache.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

/**
 * 从缓存获取游戏数据
 */
export async function getCachedGame(cacheKey: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('game_cache')
      .select('data, expires_at')
      .eq('cache_key', cacheKey)
      .single()

    if (error) {
      console.error('缓存查询失败:', error)
      return null
    }

    // 检查是否过期
    if (!data || new Date(data.expires_at) < new Date()) {
      return null
    }

    return data.data
  } catch (error) {
    console.error('缓存读取错误:', error)
    return null
  }
}

/**
 * 存储游戏数据到缓存
 */
export async function setCachedGame(cacheKey: string, data: any, ttl: number): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + ttl * 1000)

    const { error } = await supabase
      .from('game_cache')
      .upsert({
        cache_key: cacheKey,
        data: data,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      }, {
        onConflict: 'cache_key'
      })

    if (error) {
      console.error('缓存存储失败:', error)
    }
  } catch (error) {
    console.error('缓存存储错误:', error)
  }
}
```

### 4.3 BigModel API 模块

```typescript
// supabase/functions/shared/bigmodel.ts
const API_KEY = Deno.env.get('BIGMODEL_API_KEY') ?? ''
const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface BigModelRequest {
  model: string
  messages: Message[]
  temperature?: number
  top_p?: number
  max_tokens?: number
}

interface BigModelResponse {
  choices: Array<{
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

/**
 * 调用 BigModel API
 */
export async function callBigModelAPI(prompt: string): Promise<string> {
  const messages: Message[] = [
    {
      role: 'system',
      content: '你是一位儿童教育专家，专门为3-6岁儿童设计游戏题目。'
    },
    {
      role: 'user',
      content: prompt
    }
  ]

  const requestBody: BigModelRequest = {
    model: 'glm-4.7',
    messages: messages,
    temperature: 0.7,
    top_p: 0.9,
    max_tokens: 2000
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status} ${response.statusText}`)
    }

    const data: BigModelResponse = await response.json()

    if (!data.choices || data.choices.length === 0) {
      throw new Error('API 返回数据格式不正确')
    }

    const content = data.choices[0].message.content

    console.log('API 调用成功:', {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens
    })

    return content
  } catch (error) {
    console.error('BigModel API 调用错误:', error)
    throw error
  }
}
```

---

## 5. 数据库表设计

### 5.1 game_cache 表

```sql
CREATE TABLE game_cache (
  id BIGSERIAL PRIMARY KEY,
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_game_cache_key ON game_cache(cache_key);
CREATE INDEX idx_game_cache_expires ON game_cache(expires_at);

-- 创建自动清理过期缓存的函数
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM game_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 每天执行一次
SELECT cron.schedule('clean-cache', '0 0 * * *', 'SELECT clean_expired_cache()');
```

---

## 6. 前端调用示例

### 6.1 记忆游戏调用

```javascript
async function generateMemoryGame(theme, ageGroup, difficulty) {
  const supabaseUrl = 'https://your-project.supabase.co'
  const supabaseKey = 'your-anon-key'
  const functionName = 'generate-memory-game'

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        theme: theme,
        ageGroup: ageGroup,
        difficulty: difficulty
      })
    })

    const result = await response.json()

    if (result.fromCache) {
      console.log('使用缓存数据')
    } else if (result.fallback) {
      console.log('使用预设数据')
    } else {
      console.log('AI 生成新数据')
    }

    return result.data
  } catch (error) {
    console.error('生成题目失败:', error)
    return null
  }
}

// 使用示例
const gameData = await generateMemoryGame('水果', '4-5岁', '中等')
console.log(gameData.theme)    // "美味水果"
console.log(gameData.emojis)    // ["🍎", "🍌", "🍇", "🍊", "🍓", "🍑"]
```

### 6.2 形状配对调用

```javascript
async function generateShapeGame(ageGroup, difficulty) {
  const supabaseUrl = 'https://your-project.supabase.co'
  const supabaseKey = 'your-anon-key'
  const functionName = 'generate-shape-game'

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ageGroup: ageGroup,
        difficulty: difficulty
      })
    })

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('生成形状题目失败:', error)
    return null
  }
}

// 使用示例
const gameData = await generateShapeGame('4-5岁', '中等')
console.log(gameData.shapes)   // 形状数组
```

### 6.3 声音配对调用

```javascript
async function generateSoundGame(scene, ageGroup, difficulty) {
  const supabaseUrl = 'https://your-project.supabase.co'
  const supabaseKey = 'your-anon-key'
  const functionName = 'generate-sound-game'

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        scene: scene,
        ageGroup: ageGroup,
        difficulty: difficulty
      })
    })

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('生成声音题目失败:', error)
    return null
  }
}

// 使用示例
const gameData = await generateSoundGame('农场', '4-5岁', '中等')
console.log(gameData.animals)  // 动物数组
```

---

## 7. 缓存策略

### 7.1 缓存层级

1. **浏览器缓存**：localStorage 存储常用题目
2. **服务端缓存**：PostgreSQL 存储生成的题目
3. **CDN 缓存**：Edge Function 响应缓存（如果使用）

### 7.2 缓存时效

| 游戏类型 | 缓存时长 | 说明 |
|---------|---------|------|
| 记忆游戏 | 7天 | 主题内容相对稳定 |
| 形状配对 | 30天 | 形状基本不变 |
| 声音配对 | 7天 | 动物声音描述相对稳定 |

### 7.3 缓存更新策略

- **手动更新**：通过管理界面清除缓存
- **定时更新**：每天清理过期缓存
- **按需更新**：检测到内容更新时清除相关缓存

---

## 8. 错误处理

### 8.1 API 调用失败处理

```typescript
try {
  const aiResponse = await callBigModelAPI(prompt)
  const gameData = JSON.parse(aiResponse)
  return gameData
} catch (error) {
  console.error('AI 生成失败，使用预设数据:', error)
  return getFallbackGameData()
}
```

### 8.2 数据格式验证

```typescript
function validateGameData(data: any): boolean {
  try {
    // 验证必需字段
    if (!data.theme || !Array.isArray(data.emojis)) {
      return false
    }

    // 验证数组长度
    if (data.emojis.length !== 6) {
      return false
    }

    // 验证每个 emoji
    return data.emojis.every((emoji: string) => typeof emoji === 'string' && emoji.length > 0)
  } catch {
    return false
  }
}
```

### 8.3 超时处理

```typescript
const TIMEOUT = 30000 // 30秒

const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), TIMEOUT)

try {
  const response = await fetch(API_URL, {
    signal: controller.signal,
    // ...其他参数
  })
  clearTimeout(timeoutId)
  // 处理响应
} catch (error) {
  if (error.name === 'AbortError') {
    console.error('API 调用超时')
  }
  throw error
}
```

---

## 9. 性能优化

### 9.1 并发请求

```javascript
// 并发生成多个主题的题目
const themes = ['水果', '动物', '交通工具']
const requests = themes.map(theme =>
  generateMemoryGame(theme, '4-5岁', '中等')
)

const results = await Promise.all(requests)
console.log(results)
```

### 9.2 请求节流

```javascript
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 1000 // 1秒

async function throttledGenerate(gameType, params) {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve =>
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    )
  }

  lastRequestTime = Date.now()
  return generateGame(gameType, params)
}
```

### 9.3 批量预加载

```javascript
// 游戏启动时预加载常用题目
async function preloadCommonGames() {
  const commonConfigs = [
    { type: 'memory', theme: '水果', ageGroup: '4-5岁', difficulty: '中等' },
    { type: 'memory', theme: '动物', ageGroup: '4-5岁', difficulty: '中等' },
    { type: 'shape', ageGroup: '4-5岁', difficulty: '中等' },
    { type: 'sound', scene: '农场', ageGroup: '4-5岁', difficulty: '中等' }
  ]

  await Promise.all(commonConfigs.map(config => generateGame(config.type, config)))
}
```

---

## 10. 监控和日志

### 10.1 API 调用日志

```typescript
interface APICallLog {
  timestamp: string
  gameType: string
  params: any
  success: boolean
  fromCache: boolean
  responseTime: number
  tokens?: {
    prompt: number
    completion: number
    total: number
  }
}

async function logAPICall(log: APICallLog) {
  await supabase
    .from('api_call_logs')
    .insert({
      ...log,
      created_at: new Date().toISOString()
    })
}
```

### 10.2 性能监控

```typescript
async function generateWithMetrics(gameType, params) {
  const startTime = Date.now()

  try {
    const result = await generateGame(gameType, params)
    const responseTime = Date.now() - startTime

    // 记录成功日志
    await logAPICall({
      timestamp: new Date().toISOString(),
      gameType,
      params,
      success: true,
      fromCache: result.fromCache,
      responseTime
    })

    return result
  } catch (error) {
    const responseTime = Date.now() - startTime

    // 记录失败日志
    await logAPICall({
      timestamp: new Date().toISOString(),
      gameType,
      params,
      success: false,
      fromCache: false,
      responseTime
    })

    throw error
  }
}
```

---

## 总结

本 API 架构设计提供了：

1. **完整的 API 调用方案**：BigModel API 集成、Supabase Edge Function 代理
2. **灵活的缓存策略**：多级缓存、自动过期、手动更新
3. **健壮的错误处理**：API 失败降级、数据验证、超时处理
4. **性能优化**：并发请求、节流、预加载
5. **监控和日志**：API 调用日志、性能监控

通过这个架构，可以实现一次生成、多次使用的智能题目生成系统。
