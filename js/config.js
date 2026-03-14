/**
 * BigModel API 配置文件
 *
 * 包含 BigModel API 的所有配置参数
 * API Key 需要用户手动填写
 */

const CONFIG = {
  // BigModel API 配置
  bigmodel: {
    endpoint: 'https://api.z.ai/api/coding/paas/v4/chat/completions',
    model: 'glm-5',
    apiKey: '2b4a8eb0a43548169757f6f7fb895b9d.9LMtXZ9gr56x4CGl',

    // 请求配置
    timeout: 30000,        // 请求超时时间（毫秒）
    maxRetries: 2,         // 最大重试次数
    retryDelay: 1000,      // 重试延迟（毫秒）

    // 模型参数
    temperature: 0.7,      // 温度参数（0-1）
    maxTokens: 1000,       // 最大 token 数
    topP: 0.9,             // top-p 参数
  },

  // API 调用模式
  apiMode: 'auto',  // 'auto'（优先API，失败降级）, 'mock'（仅模拟）, 'api'（仅API）

  // 缓存配置
  cache: {
    enabled: true,
    ttl: 7 * 24 * 60 * 60 * 1000,  // 缓存7天（毫秒）
  },

  // 日志配置
  logging: {
    enabled: true,
    level: 'info',  // 'debug', 'info', 'warn', 'error'
  }
}

/**
 * 获取配置值
 * @param {string} path - 配置路径，如 'bigmodel.apiKey'
 * @returns {*} 配置值
 */
function getConfig(path) {
  const keys = path.split('.')
  let value = CONFIG

  for (const key of keys) {
    if (value && key in value) {
      value = value[key]
    } else {
      return undefined
    }
  }

  return value
}

/**
 * 设置配置值
 * @param {string} path - 配置路径
 * @param {*} value - 配置值
 */
function setConfig(path, value) {
  const keys = path.split('.')
  let target = CONFIG

  // 找到目标对象
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (!(key in target)) {
      target[key] = {}
    }
    target = target[key]
  }

  // 设置值
  target[keys[keys.length - 1]] = value

  if (CONFIG.logging.enabled && CONFIG.logging.level !== 'error') {
    console.log(`📝 配置更新: ${path} = ${value}`)
  }
}

/**
 * 检查 API Key 是否已配置
 * @returns {boolean} 是否已配置
 */
function hasApiKey() {
  const apiKey = CONFIG.bigmodel.apiKey
  return apiKey && apiKey !== 'YOUR_BIGMODEL_API_KEY_HERE' && apiKey.length > 10
}

/**
 * 获取 API Key
 * @returns {string|null} API Key，未配置返回 null
 */
function getApiKey() {
  if (!hasApiKey()) {
    console.warn('⚠️ API Key 未配置，将使用模拟数据')
    return null
  }
  return CONFIG.bigmodel.apiKey
}

/**
 * 设置 API Key
 * @param {string} apiKey - API Key
 */
function setApiKey(apiKey) {
  if (!apiKey || apiKey.length < 10) {
    throw new Error('API Key 无效，长度至少 10 个字符')
  }
  setConfig('bigmodel.apiKey', apiKey)
}

/**
 * 设置 API 模式
 * @param {string} mode - 模式：'auto', 'mock', 'api'
 */
function setApiMode(mode) {
  if (!['auto', 'mock', 'api'].includes(mode)) {
    throw new Error('无效的 API 模式，必须是 auto/mock/api 之一')
  }
  setConfig('apiMode', mode)
}

/**
 * 获取 API 模式
 * @returns {string} 当前模式
 */
function getApiMode() {
  return CONFIG.apiMode
}

// 如果在浏览器环境中，挂载到 window 对象
if (typeof window !== 'undefined') {
  window.GameConfig = CONFIG
  window.getConfig = getConfig
  window.setConfig = setConfig
  window.hasApiKey = hasApiKey
  window.getApiKey = getApiKey
  window.setApiKey = setApiKey
  window.setApiMode = setApiMode
  window.getApiMode = getApiMode
}
