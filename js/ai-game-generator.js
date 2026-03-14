/**
 * AI 题目生成器模块
 *
 * 支持两种模式：
 * 1. API 模式：调用 BigModel API 生成题目
 * 2. 模拟模式：返回预设的游戏数据作为降级方案
 */

class AIGameGenerator {
  constructor() {
    this.cache = new Map()
    this.cacheEnabled = true
    this.apiMode = 'auto'
    this.bigModelClient = null

    // 初始化 BigModel 客户端（如果可用）
    if (typeof bigModelClient !== 'undefined') {
      this.bigModelClient = bigModelClient

      // 从配置初始化客户端
      if (typeof CONFIG !== 'undefined' && CONFIG.bigmodel) {
        this.bigModelClient.init(CONFIG.bigmodel)
      }

      // 从环境变量读取 API Key（如果可用）
      if (typeof getApiKey === 'function') {
        const apiKey = getApiKey()
        if (apiKey) {
          this.bigModelClient.apiKey = apiKey
        }
      }
    }
  }

  /**
   * 生成记忆翻牌游戏题目
   * @param {string} theme - 主题（水果、动物、交通工具等）
   * @param {string} ageGroup - 年龄组（3-4岁、4-5岁、5-6岁）
   * @param {string} difficulty - 难度（简单、中等、困难）
   * @returns {Promise<Object>} 游戏数据
   */
  async generateMemoryGame(theme, ageGroup = '4-5岁', difficulty = '中等') {
    const cacheKey = `memory_${theme}_${ageGroup}_${difficulty}`

    if (this.cacheEnabled && this.cache.has(cacheKey)) {
      console.log('✅ 使用缓存数据:', cacheKey)
      return this.cache.get(cacheKey)
    }

    console.log('🔄 生成新题目:', cacheKey)

    // 尝试调用 API（如果启用）
    let gameData = null

    if (this.apiMode !== 'mock' && this.bigModelClient && this.bigModelClient.isConfigured()) {
      try {
        gameData = await this._generateMemoryGameWithAPI(theme, ageGroup, difficulty)
        console.log('✅ API 生成成功')
      } catch (error) {
        console.warn('⚠️ API 生成失败，使用降级方案:', error.message)
        if (this.apiMode === 'api') {
          throw error
        }
      }
    }

    // 降级到模拟数据
    if (!gameData) {
      await this.simulateDelay(500, 1500)
      gameData = this.getMemoryGameData(theme, ageGroup, difficulty)
      gameData.fallback = true
    }

    if (this.cacheEnabled) {
      this.cache.set(cacheKey, gameData)
    }

    return gameData
  }

  /**
   * 使用 API 生成记忆游戏题目
   * @private
   */
  async _generateMemoryGameWithAPI(theme, ageGroup, difficulty) {
    const prompt = `你是一位儿童教育专家，需要为3-6岁儿童设计记忆翻牌游戏的题目。

### 要求
1. 生成6个emoji图标作为配对主题
2. 主题：${theme}
3. 年龄组：${ageGroup}
4. 难度：${difficulty}
5. 每个emoji必须清晰、适合儿童、易于识别
6. 必须返回严格的JSON格式

### 输出格式
{
  "theme": "主题名称（中文）",
  "emojis": ["🍎", "🍌", "🍇", "🍊", "🍓", "🍑"],
  "difficulty": "${difficulty}",
  "age_group": "${ageGroup}"
}

只返回JSON，不要包含其他文字。`

    const response = await this.bigModelClient.call(prompt)

    // 标记来源
    response.fromCache = false
    response.fallback = false

    return response
  }

  /**
   * 生成形状配对游戏题目
   * @param {string} ageGroup - 年龄组
   * @param {string} difficulty - 难度
   * @returns {Promise<Object>} 游戏数据
   */
  async generateShapeGame(ageGroup = '4-5岁', difficulty = '中等') {
    const cacheKey = `shape_${ageGroup}_${difficulty}`

    if (this.cacheEnabled && this.cache.has(cacheKey)) {
      console.log('✅ 使用缓存数据:', cacheKey)
      return this.cache.get(cacheKey)
    }

    console.log('🔄 生成新题目:', cacheKey)

    let gameData = null

    if (this.apiMode !== 'mock' && this.bigModelClient && this.bigModelClient.isConfigured()) {
      try {
        gameData = await this._generateShapeGameWithAPI(ageGroup, difficulty)
        console.log('✅ API 生成成功')
      } catch (error) {
        console.warn('⚠️ API 生成失败，使用降级方案:', error.message)
        if (this.apiMode === 'api') {
          throw error
        }
      }
    }

    if (!gameData) {
      await this.simulateDelay(500, 1500)
      gameData = this.getShapeGameData(ageGroup, difficulty)
      gameData.fallback = true
    }

    if (this.cacheEnabled) {
      this.cache.set(cacheKey, gameData)
    }

    return gameData
  }

  /**
   * 使用 API 生成形状配对游戏题目
   * @private
   */
  async _generateShapeGameWithAPI(ageGroup, difficulty) {
    const prompt = `你是一位儿童教育专家，需要为3-6岁儿童设计形状配对游戏的题目。

### 要求
1. 生成8个基础形状emoji作为配对元素
2. 形状必须简单、清晰、易于识别
3. 颜色应该鲜艳、对比度高
4. 年龄组：${ageGroup}
5. 难度：${difficulty}
6. 必须返回严格的JSON格式

### 输出格式
{
  "shapes": [
    {"name": "圆形", "emoji": "🔵"},
    {"name": "方形", "emoji": "🟦"}
  ],
  "difficulty": "${difficulty}",
  "age_group": "${ageGroup}"
}

只返回JSON，不要包含其他文字。`

    const response = await this.bigModelClient.call(prompt)

    response.fromCache = false
    response.fallback = false

    return response
  }

  /**
   * 生成声音配对游戏题目
   * @param {string} scene - 场景（农场、森林、水里、天空）
   * @param {string} ageGroup - 年龄组
   * @param {string} difficulty - 难度
   * @returns {Promise<Object>} 游戏数据
   */
  async generateSoundGame(scene = '农场', ageGroup = '4-5岁', difficulty = '中等') {
    const cacheKey = `sound_${scene}_${ageGroup}_${difficulty}`

    if (this.cacheEnabled && this.cache.has(cacheKey)) {
      console.log('✅ 使用缓存数据:', cacheKey)
      return this.cache.get(cacheKey)
    }

    console.log('🔄 生成新题目:', cacheKey)

    let gameData = null

    if (this.apiMode !== 'mock' && this.bigModelClient && this.bigModelClient.isConfigured()) {
      try {
        gameData = await this._generateSoundGameWithAPI(scene, ageGroup, difficulty)
        console.log('✅ API 生成成功')
      } catch (error) {
        console.warn('⚠️ API 生成失败，使用降级方案:', error.message)
        if (this.apiMode === 'api') {
          throw error
        }
      }
    }

    if (!gameData) {
      await this.simulateDelay(500, 1500)
      gameData = this.getSoundGameData(scene, ageGroup, difficulty)
      gameData.fallback = true
    }

    if (this.cacheEnabled) {
      this.cache.set(cacheKey, gameData)
    }

    return gameData
  }

  /**
   * 使用 API 生成声音配对游戏题目
   * @private
   */
  async _generateSoundGameWithAPI(scene, ageGroup, difficulty) {
    const prompt = `你是一位儿童教育专家，需要为3-6岁儿童设计动物声音配对游戏的题目。

### 要求
1. 生成8个常见动物的emoji和声音描述
2. 场景：${scene}
3. 动物必须常见、声音特征明显
4. 年龄组：${ageGroup}
5. 难度：${difficulty}
6. 包含动物名称、emoji、声音文本描述、声音参数
7. 必须返回严格的JSON格式

### 输出格式
{
  "scene": "${scene}",
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
}

只返回JSON，不要包含其他文字。`

    const response = await this.bigModelClient.call(prompt)

    response.fromCache = false
    response.fallback = false

    return response
  }

  /**
   * 模拟 API 延迟
   * @param {number} min - 最小延迟（毫秒）
   * @param {number} max - 最大延迟（毫秒）
   * @returns {Promise<void>}
   */
  simulateDelay(min, max) {
    const delay = Math.random() * (max - min) + min
    return new Promise(resolve => setTimeout(resolve, delay))
  }

  /**
   * 获取记忆游戏数据
   */
  getMemoryGameData(theme, ageGroup, difficulty) {
    const themeData = {
      '水果': {
        theme: '美味水果',
        emojis: ['🍎', '🍌', '🍇', '🍊', '🍓', '🍑']
      },
      '动物': {
        theme: '可爱动物',
        emojis: ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼']
      },
      '交通工具': {
        theme: '交通工具',
        emojis: ['🚗', '🚌', '🚓', '🚑', '🚒', '🚕']
      },
      '运动': {
        theme: '体育运动',
        emojis: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏉']
      },
      '蔬菜': {
        theme: '新鲜蔬菜',
        emojis: ['🥕', '🥦', '🍆', '🌽', '🥒', '🍅']
      },
      '乐器': {
        theme: '音乐乐器',
        emojis: ['🎸', '🎹', '🎻', '🎺', '🥁', '🎤']
      },
      '花卉': {
        theme: '美丽花卉',
        emojis: ['🌸', '🌺', '🌻', '🌷', '🌹', '🌼']
      },
      '海洋生物': {
        theme: '海洋生物',
        emojis: ['🐠', '🐡', '🐙', '🦀', '🐚', '🦑']
      },
      '天气': {
        theme: '天气现象',
        emojis: ['☀️', '🌙', '⭐', '☁️', '⚡', '❄️']
      },
      '食物': {
        theme: '美味食物',
        emojis: ['🍕', '🍔', '🍟', '🌭', '🍿', '🍩']
      }
    }

    // 根据主题返回数据，如果主题不存在则随机返回一个
    let data = themeData[theme]

    if (!data) {
      const themes = Object.keys(themeData)
      const randomTheme = themes[Math.floor(Math.random() * themes.length)]
      data = themeData[randomTheme]
      console.log(`⚠️ 主题 "${theme}" 不存在，使用 "${randomTheme}" 代替`)
    }

    return {
      theme: data.theme,
      emojis: data.emojis,
      difficulty: difficulty,
      age_group: ageGroup,
      fromCache: false,
      fallback: false
    }
  }

  /**
   * 获取形状配对游戏数据
   */
  getShapeGameData(ageGroup, difficulty) {
    const shapes = [
      { name: '圆形', emoji: '🔵' },
      { name: '方形', emoji: '🟦' },
      { name: '三角形', emoji: '🔺' },
      { name: '心形', emoji: '❤️' },
      { name: '星形', emoji: '⭐' },
      { name: '月亮', emoji: '🌙' },
      { name: '云朵', emoji: '☁️' },
      { name: '太阳', emoji: '☀️' }
    ]

    // 根据难度调整
    if (difficulty === '困难') {
      // 困难模式：添加相似形状
      shapes.push(
        { name: '椭圆', emoji: '🥚' },
        { name: '菱形', emoji: '💎' }
      )
    }

    return {
      shapes: shapes.slice(0, 8),
      difficulty: difficulty,
      age_group: ageGroup,
      fromCache: false,
      fallback: false
    }
  }

  /**
   * 获取声音配对游戏数据
   */
  getSoundGameData(scene, ageGroup, difficulty) {
    const sceneData = {
      '农场': {
        scene: '农场',
        animals: [
          { emoji: '🐶', name: '小狗', sound_text: '汪汪汪', audio_params: { freq: 400, duration: 0.3, pattern: 'bark' } },
          { emoji: '🐱', name: '小猫', sound_text: '喵喵喵', audio_params: { freq: 600, duration: 0.4, pattern: 'meow' } },
          { emoji: '🐮', name: '奶牛', sound_text: '哞哞', audio_params: { freq: 150, duration: 0.8, pattern: 'moo' } },
          { emoji: '🐷', name: '小猪', sound_text: '哼哼', audio_params: { freq: 300, duration: 0.5, pattern: 'oink' } },
          { emoji: '🐔', name: '公鸡', sound_text: '喔喔', audio_params: { freq: 500, duration: 0.6, pattern: 'crow' } },
          { emoji: '🦆', name: '鸭子', sound_text: '嘎嘎', audio_params: { freq: 350, duration: 0.35, pattern: 'quack' } },
          { emoji: '🐴', name: '小马', sound_text: '嘶嘶', audio_params: { freq: 280, duration: 0.7, pattern: 'neigh' } },
          { emoji: '🐑', name: '小羊', sound_text: '咩咩', audio_params: { flock: 450, duration: 0.5, pattern: 'baa' } }
        ]
      },
      '森林': {
        scene: '森林',
        animals: [
          { emoji: '🐻', name: '大熊', sound_text: '嗷呜', audio_params: { freq: 120, duration: 1.0, pattern: 'roar' } },
          { emoji: '🦊', name: '狐狸', sound_text: '咯咯', audio_params: { freq: 380, duration: 0.4, pattern: 'bark' } },
          { emoji: '🦌', name: '小鹿', sound_text: '呃呃', audio_params: { freq: 320, duration: 0.6, pattern: 'bark' } },
          { emoji: '🦉', name: '猫头鹰', sound_text: '咕咕', audio_params: { freq: 420, duration: 0.7, pattern: 'hoot' } },
          { emoji: '🐿️', name: '松鼠', sound_text: '吱吱', audio_params: { freq: 800, duration: 0.2, pattern: 'chirp' } },
          { emoji: '🐺', name: '小狼', sound_text: '嗷嗷', audio_params: { freq: 200, duration: 0.9, pattern: 'howl' } },
          { emoji: '🦡', name: '小獾', sound_text: '哼哼', audio_params: { freq: 250, duration: 0.5, pattern: 'grunt' } },
          { emoji: '🐗', name: '野猪', sound_text: '哼哧', audio_params: { freq: 180, duration: 0.8, pattern: 'oink' } }
        ]
      },
      '水里': {
        scene: '水里',
        animals: [
          { emoji: '🐠', name: '小鱼', sound_text: '咕噜', audio_params: { freq: 700, duration: 0.3, pattern: 'bubble' } },
          { emoji: '🐡', name: '河豚', sound_text: '噗噗', audio_params: { freq: 650, duration: 0.4, pattern: 'bubble' } },
          { emoji: '🐙', name: '章鱼', sound_text: '咕咕', audio_params: { freq: 500, duration: 0.5, pattern: 'gurgle' } },
          { emoji: '🦀', name: '螃蟹', sound_text: '咔咔', audio_params: { freq: 450, duration: 0.3, pattern: 'click' } },
          { emoji: '🐚', name: '贝壳', sound_text: '沙沙', audio_params: { freq: 600, duration: 0.2, pattern: 'rustle' } },
          { emoji: '🦑', name: '乌贼', sound_text: '咕嘟', audio_params: { freq: 550, duration: 0.4, pattern: 'squirt' } },
          { emoji: '🐬', name: '海豚', sound_text: '吱吱', audio_params: { freq: 750, duration: 0.5, pattern: 'click' } },
          { emoji: '🦈', name: '鲨鱼', sound_text: '呼呼', audio_params: { freq: 100, duration: 1.2, pattern: 'breath' } }
        ]
      },
      '天空': {
        scene: '天空',
        animals: [
          { emoji: '🦅', name: '老鹰', sound_text: '嗖嗖', audio_params: { freq: 300, duration: 0.6, pattern: 'screech' } },
          { emoji: '🦆', name: '鸭子', sound_text: '嘎嘎', audio_params: { freq: 350, duration: 0.35, pattern: 'quack' } },
          { emoji: '🦢', name: '天鹅', sound_text: '嘎嘎', audio_params: { freq: 380, duration: 0.4, pattern: 'honk' } },
          { emoji: '🦜', name: '鹦鹉', sound_text: '啾啾', audio_params: { freq: 850, duration: 0.3, pattern: 'squawk' } },
          { emoji: '🐦', name: '小鸟', sound_text: '叽叽', audio_params: { freq: 900, duration: 0.2, pattern: 'chirp' } },
          { emoji: '🦉', name: '猫头鹰', sound_text: '咕咕', audio_params: { freq: 420, duration: 0.7, pattern: 'hoot' } },
          { emoji: '🦩', name: '孔雀', sound_text: '咯咯', audio_params: { freq: 520, duration: 0.5, pattern: 'call' } },
          { emoji: '🐓', name: '公鸡', sound_text: '喔喔', audio_params: { freq: 500, duration: 0.6, pattern: 'crow' } }
        ]
      }
    }

    // 根据场景返回数据
    let data = sceneData[scene]

    if (!data) {
      const scenes = Object.keys(sceneData)
      const randomScene = scenes[Math.floor(Math.random() * scenes.length)]
      data = sceneData[randomScene]
      console.log(`⚠️ 场景 "${scene}" 不存在，使用 "${randomScene}" 代替`)
    }

    return {
      scene: data.scene,
      animals: data.animals,
      difficulty: difficulty,
      age_group: ageGroup,
      fromCache: false,
      fallback: false
    }
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear()
    console.log('🗑️ 缓存已清除')
  }

  /**
   * 获取缓存大小
   */
  getCacheSize() {
    return this.cache.size
  }

  /**
   * 启用/禁用缓存
   */
  setCacheEnabled(enabled) {
    this.cacheEnabled = enabled
    console.log(`📦 缓存已${enabled ? '启用' : '禁用'}`)
  }

  /**
   * 设置 API 模式
   * @param {string} mode - 模式：'auto'（优先API，失败降级）、'mock'（仅模拟）、'api'（仅API）
   */
  setApiMode(mode) {
    if (!['auto', 'mock', 'api'].includes(mode)) {
      throw new Error('无效的 API 模式，必须是 auto/mock/api 之一')
    }
    this.apiMode = mode
    console.log(`🔧 API 模式已设置为: ${mode}`)
  }

  /**
   * 获取 API 模式
   * @returns {string} 当前模式
   */
  getApiMode() {
    return this.apiMode
  }

  /**
   * 设置 BigModel API Key
   * @param {string} apiKey - API Key
   */
  setApiKey(apiKey) {
    if (this.bigModelClient) {
      this.bigModelClient.apiKey = apiKey
      console.log('🔑 API Key 已更新')
    } else {
      console.warn('⚠️ BigModel 客户端未初始化')
    }
  }

  /**
   * 检查 API 是否已配置
   * @returns {boolean}
   */
  isApiConfigured() {
    return this.bigModelClient && this.bigModelClient.isConfigured()
  }

  /**
   * 获取所有可用的主题
   */
  getAvailableThemes() {
    return ['水果', '动物', '交通工具', '运动', '蔬菜', '乐器', '花卉', '海洋生物', '天气', '食物']
  }

  /**
   * 获取所有可用的场景
   */
  getAvailableScenes() {
    return ['农场', '森林', '水里', '天空']
  }

  /**
   * 随机生成一个主题
   */
  getRandomTheme() {
    const themes = this.getAvailableThemes()
    return themes[Math.floor(Math.random() * themes.length)]
  }

  /**
   * 随机生成一个场景
   */
  getRandomScene() {
    const scenes = this.getAvailableScenes()
    return scenes[Math.floor(Math.random() * scenes.length)]
  }

  /**
   * 批量生成多个游戏
   */
  async generateMultipleGames(gameType, configs) {
    const promises = configs.map(config => {
      if (gameType === 'memory') {
        return this.generateMemoryGame(config.theme, config.ageGroup, config.difficulty)
      } else if (gameType === 'shape') {
        return this.generateShapeGame(config.ageGroup, config.difficulty)
      } else if (gameType === 'sound') {
        return this.generateSoundGame(config.scene, config.ageGroup, config.difficulty)
      }
    })

    return Promise.all(promises)
  }
}

// 导出单例
const aiGenerator = new AIGameGenerator()

// 如果在浏览器环境中，挂载到 window 对象
if (typeof window !== 'undefined') {
  window.AIGameGenerator = AIGameGenerator
  window.aiGenerator = aiGenerator
}
