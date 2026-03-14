/**
 * BigModel API 客户端
 *
 * 负责与 BigModel API 的所有通信
 */

class BigModelClient {
  constructor() {
    this.endpoint = 'https://api.z.ai/api/coding/paas/v4/chat/completions'
    this.model = 'glm-5'
    this.apiKey = null
    this.timeout = 30000
    this.maxRetries = 2
    this.retryDelay = 1000
    this.temperature = 0.7
    this.maxTokens = 1000
    this.topP = 0.9
  }

  /**
   * 初始化客户端
   * @param {Object} config - 配置对象
   */
  init(config) {
    if (config.endpoint) this.endpoint = config.endpoint
    if (config.model) this.model = config.model
    if (config.apiKey) this.apiKey = config.apiKey
    if (config.timeout) this.timeout = config.timeout
    if (config.maxRetries) this.maxRetries = config.maxRetries
    if (config.retryDelay) this.retryDelay = config.retryDelay
    if (config.temperature !== undefined) this.temperature = config.temperature
    if (config.maxTokens) this.maxTokens = config.maxTokens
    if (config.topP !== undefined) this.topP = config.topP

    console.log('🚀 BigModel 客户端初始化完成')
  }

  /**
   * 调用 BigModel API
   * @param {string} prompt - 用户提示
   * @param {Object} options - 可选参数
   * @returns {Promise<Object>} API 响应
   */
  async call(prompt, options = {}) {
    if (!this.apiKey) {
      throw new Error('API Key 未配置')
    }

    const mergedOptions = {
      temperature: options.temperature || this.temperature,
      maxTokens: options.maxTokens || this.maxTokens,
      topP: options.topP || this.topP
    }

    let lastError = null

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`📡 调用 BigModel API (尝试 ${attempt + 1}/${this.maxRetries + 1})`)

        const response = await this._makeRequest(prompt, mergedOptions)

        if (response.ok && response.data) {
          console.log('✅ API 调用成功')
          return response.data
        } else {
          throw new Error(response.error || 'API 返回错误')
        }
      } catch (error) {
        lastError = error
        console.warn(`⚠️ API 调用失败 (尝试 ${attempt + 1}):`, error.message)

        // 检查是否应该重试
        if (attempt < this.maxRetries && this._shouldRetry(error)) {
          const delay = this.retryDelay * (attempt + 1)
          console.log(`⏳ ${delay}ms 后重试...`)
          await this._sleep(delay)
        } else {
          break
        }
      }
    }

    throw new Error(`API 调用失败: ${lastError.message}`)
  }

  /**
   * 发起 HTTP 请求
   * @private
   */
  async _makeRequest(prompt, options) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: options.temperature,
          max_tokens: options.maxTokens,
          top_p: options.topP
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          ok: false,
          error: `HTTP ${response.status}: ${errorData.error?.message || response.statusText}`
        }
      }

      const data = await response.json()

      if (data.choices && data.choices.length > 0) {
        const content = data.choices[0].message.content

        // 尝试解析 JSON 响应
        try {
          const jsonData = JSON.parse(content)
          return { ok: true, data: jsonData }
        } catch (parseError) {
          // 如果不是纯 JSON，返回原始文本
          return { ok: true, data: content }
        }
      } else {
        return {
          ok: false,
          error: 'API 返回格式错误'
        }
      }
    } catch (error) {
      clearTimeout(timeoutId)

      if (error.name === 'AbortError') {
        return {
          ok: false,
          error: '请求超时'
        }
      }

      return {
        ok: false,
        error: error.message
      }
    }
  }

  /**
   * 判断是否应该重试
   * @private
   */
  _shouldRetry(error) {
    const retryableErrors = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      '请求超时',
      'Network Error',
      'rate limit',
      'too many requests',
      '429'
    ]

    const errorLower = error.message.toLowerCase()
    return retryableErrors.some(msg => errorLower.includes(msg.toLowerCase()))
  }

  /**
   * 延迟函数
   * @private
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 检查 API Key 是否已配置
   * @returns {boolean}
   */
  isConfigured() {
    return this.apiKey && this.apiKey.length > 10
  }
}

const bigModelClient = new BigModelClient()

if (typeof CONFIG !== 'undefined' && CONFIG.bigmodel) {
  bigModelClient.init(CONFIG.bigmodel)
  console.log('✅ BigModel 客户端已从 CONFIG 自动初始化')
}

if (typeof window !== 'undefined') {
  window.BigModelClient = BigModelClient
  window.bigModelClient = bigModelClient
}
