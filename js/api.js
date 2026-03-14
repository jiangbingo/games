/**
 * API客户端
 * 用于与后端服务器通信
 */
class APIClient {
    constructor() {
        this.baseURL = window.API_BASE_URL || 'http://localhost:3000/api';
        this.timeout = 5000;
    }

    /**
     * 通用请求方法
     */
    async request(method, endpoint, data = null) {
        const url = `${this.baseURL}${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || `HTTP ${response.status}`);
            }

            return result;
        } catch (error) {
            console.error(`API Error [${method} ${endpoint}]:`, error);
            throw error;
        }
    }

    /**
     * GET请求
     */
    async get(endpoint, params = null) {
        let url = endpoint;
        if (params) {
            const query = new URLSearchParams(params).toString();
            url += `?${query}`;
        }
        return this.request('GET', url);
    }

    /**
     * POST请求
     */
    async post(endpoint, data) {
        return this.request('POST', endpoint, data);
    }

    /**
     * PUT请求
     */
    async put(endpoint, data) {
        return this.request('PUT', endpoint, data);
    }

    /**
     * DELETE请求
     */
    async delete(endpoint) {
        return this.request('DELETE', endpoint);
    }

    /**
     * 用户API
     */
    users = {
        getAll: () => this.get('/users'),
        getById: (userId) => this.get(`/users/${userId}`),
        create: (data) => this.post('/users', data),
        update: (userId, data) => this.put(`/users/${userId}`, data),
        delete: (userId) => this.delete(`/users/${userId}`),
    };

    /**
     * 进度API
     */
    progress = {
        getAll: (userId) => this.get(`/progress/${userId}`),
        get: (userId, gameId) => this.get(`/progress/${userId}/${gameId}`),
        createOrUpdate: (data) => this.post('/progress', data),
        updateHighScore: (userId, gameId, score) => 
            this.put(`/progress/${userId}/${gameId}/highscore`, { score }),
        recordLevel: (userId, gameId, level) => 
            this.put(`/progress/${userId}/${gameId}/level/${level}`),
        reset: (userId, gameId) => 
            this.delete(`/progress/${userId}/${gameId}`),
    };

    /**
     * 统计API
     */
    stats = {
        getUserStats: (userId) => this.get(`/stats/${userId}`),
        getLeaderboard: (gameId, limit = 10) => 
            this.get(`/leaderboard/${gameId}`, { limit }),
        recordGame: (data) => this.post('/stats/record', data),
        getHistory: (userId, params) => 
            this.get(`/history/${userId}`, params),
    };

    /**
     * 健康检查
     */
    async healthCheck() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            
            const response = await fetch(`${this.baseURL.replace('/api', '')}/health`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

/**
 * 云端存储管理器
 * 使用API客户端保存数据到统一数据库
 */
class CloudStorage {
    constructor() {
        this.api = new APIClient();
        this.localStorage = new LocalStorage();
        this.userStorage = this.localStorage.userStorage;
        this.progressStorage = this.localStorage.progressStorage;
        this.useCloud = false;
        this.cloudChecked = false;
    }

    async checkCloudAvailability() {
        if (this.cloudChecked) return this.useCloud;
        
        const hostname = window.location.hostname || '';
        const isLocalhost = hostname === 'localhost' || 
                           hostname === '127.0.0.1' ||
                           hostname.startsWith('192.168.') ||
                           hostname.startsWith('10.') ||
                           hostname === '';
        
        if (isLocalhost) {
            this.useCloud = false;
            this.cloudChecked = true;
            return false;
        }
        
        try {
            const isAvailable = await this.api.healthCheck();
            this.useCloud = isAvailable;
            this.cloudChecked = true;
        } catch (error) {
            this.useCloud = false;
            this.cloudChecked = true;
        }
        return this.useCloud;
    }

    /**
     * 创建用户
     */
    async createUser(username, settings = {}) {
        try {
            if (this.useCloud) {
                const result = await this.api.users.create({ username, settings });
                return result.data;
            } else {
                return this.localStorage.createUser(username);
            }
        } catch (error) {
            console.error('Cloud storage failed, falling back to local:', error);
            return this.localStorage.createUser(username);
        }
    }

    /**
     * 获取用户
     */
    async getUser(userId) {
        try {
            if (this.useCloud) {
                const result = await this.api.users.getById(userId);
                return result.data;
            } else {
                return this.localStorage.getUser(userId);
            }
        } catch (error) {
            console.error('Cloud storage failed, falling back to local:', error);
            return this.localStorage.getUser(userId);
        }
    }

    /**
     * 保存进度
     */
    async saveProgress(userId, gameId, progressData) {
        try {
            if (this.useCloud) {
                const data = { userId, gameId, ...progressData };
                await this.api.progress.createOrUpdate(data);
                return true;
            } else {
                return this.localStorage.saveProgress(userId, gameId, progressData);
            }
        } catch (error) {
            console.error('Cloud storage failed, falling back to local:', error);
            return this.localStorage.saveProgress(userId, gameId, progressData);
        }
    }

    /**
     * 获取进度
     */
    async getProgress(userId, gameId) {
        try {
            if (this.useCloud) {
                const result = await this.api.progress.get(userId, gameId);
                return result.data;
            } else {
                return this.localStorage.getProgress(userId, gameId);
            }
        } catch (error) {
            console.error('Cloud storage failed, falling back to local:', error);
            return this.localStorage.getProgress(userId, gameId);
        }
    }

    /**
     * 更新高分
     */
    async updateHighScore(userId, gameId, score) {
        try {
            if (this.useCloud) {
                const result = await this.api.progress.updateHighScore(userId, gameId, score);
                return result.data;
            } else {
                return this.localStorage.updateHighScore(userId, gameId, score);
            }
        } catch (error) {
            console.error('Cloud storage failed, falling back to local:', error);
            return this.localStorage.updateHighScore(userId, gameId, score);
        }
    }

    /**
     * 记录关卡完成
     */
    async recordLevelComplete(userId, gameId, level) {
        try {
            if (this.useCloud) {
                await this.api.progress.recordLevel(userId, gameId, level);
                return true;
            } else {
                return this.localStorage.recordLevelComplete(userId, gameId, level);
            }
        } catch (error) {
            console.error('Cloud storage failed, falling back to local:', error);
            return this.localStorage.recordLevelComplete(userId, gameId, level);
        }
    }
}

// 导出到全局
window.APIClient = APIClient;
window.CloudStorage = CloudStorage;