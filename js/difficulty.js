/**
 * 自适应难度管理器
 * 根据孩子的游戏表现动态调整难度
 */
class DifficultyManager {
    constructor() {
        this.storageKey = 'kids_games_difficulty_stats';
        this.stats = this.loadStats();

        this.config = {
            evaluationWindow: 5,
            thresholds: {
                increaseAccuracy: 0.80,
                decreaseAccuracy: 0.50,
                fastResponse: 0.7,
                slowResponse: 2.0,
                consecutiveSuccess: 5,
                consecutiveFail: 3
            },
            levelBounds: {
                minLevel: 1,
                maxLevel: 50
            },
            adjustmentFactors: {
                memoryMatch: {
                    displayTime: 500,
                    cardCount: 1
                },
                letterMatch: {
                    cardCount: 1
                }
            }
        };
    }

    /**
     * 加载难度统计数据
     */
    loadStats() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('加载难度统计失败:', error);
            return {};
        }
    }

    /**
     * 保存难度统计数据
     */
    saveStats() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.stats));
            return true;
        } catch (error) {
            console.error('保存难度统计失败:', error);
            return false;
        }
    }

    /**
     * 获取用户的难度统计数据
     */
    getUserStats(userId) {
        if (!this.stats[userId]) {
            this.stats[userId] = {
                games: {},
                lastUpdate: new Date().toISOString()
            };
            this.saveStats();
        }
        return this.stats[userId];
    }

    /**
     * 记录游戏表现
     * @param {string} userId - 用户ID
     * @param {string} gameId - 游戏ID
     * @param {object} performance - 表现数据
     */
    recordPerformance(userId, gameId, performance) {
        const userStats = this.getUserStats(userId);

        if (!userStats.games[gameId]) {
            userStats.games[gameId] = {
                records: [],
                consecutiveSuccess: 0,
                consecutiveFail: 0,
                recommendedLevel: 1
            };
        }

        const gameStats = userStats.games[gameId];

        // 记录本次表现
        const record = {
            timestamp: new Date().toISOString(),
            level: performance.level,
            isCorrect: performance.isCorrect,
            responseTime: performance.responseTime,  // 毫秒
            targetTime: performance.targetTime,    // 目标时间（毫秒）
            score: performance.score || 0
        };

        gameStats.records.push(record);

        // 更新连续成功/失败计数
        if (performance.isCorrect) {
            gameStats.consecutiveSuccess++;
            gameStats.consecutiveFail = 0;
        } else {
            gameStats.consecutiveFail++;
            gameStats.consecutiveSuccess = 0;
        }

        // 只保留最近的N次记录
        const windowSize = this.config.evaluationWindow;
        if (gameStats.records.length > windowSize) {
            gameStats.records = gameStats.records.slice(-windowSize);
        }

        gameStats.lastUpdate = new Date().toISOString();
        this.saveStats();

        // 自动评估并推荐难度
        return this.evaluateAndRecommend(userId, gameId);
    }

    /**
     * 评估表现并推荐难度
     */
    evaluateAndRecommend(userId, gameId) {
        const userStats = this.getUserStats(userId);
        const gameStats = userStats.games[gameId];

        if (!gameStats || gameStats.records.length < 3) {
            // 记录太少，无法评估
            return {
                shouldAdjust: false,
                reason: '记录不足，继续观察',
                recommendation: 'maintain'
            };
        }

        const records = gameStats.records;
        const currentLevel = records[records.length - 1].level;

        // 计算各项指标
        const metrics = this.calculateMetrics(records);

        // 判断是否需要调整
        const adjustment = this.determineAdjustment(metrics, gameStats, currentLevel);

        // 更新推荐等级
        if (adjustment.shouldAdjust) {
            gameStats.recommendedLevel = adjustment.newLevel;
            this.saveStats();
        }

        return adjustment;
    }

    /**
     * 计算性能指标
     */
    calculateMetrics(records) {
        // 正确率
        const correctCount = records.filter(r => r.isCorrect).length;
        const accuracy = correctCount / records.length;

        // 平均响应时间
        const avgResponseTime = records.reduce((sum, r) => sum + r.responseTime, 0) / records.length;

        // 平均目标时间
        const avgTargetTime = records.reduce((sum, r) => sum + r.targetTime, 0) / records.length;

        // 响应时间比率（实际/目标）
        const responseTimeRatio = avgResponseTime / avgTargetTime;

        // 总得分
        const totalScore = records.reduce((sum, r) => sum + r.score, 0);

        return {
            accuracy,
            avgResponseTime,
            avgTargetTime,
            responseTimeRatio,
            totalScore,
            recordCount: records.length
        };
    }

    /**
     * 判断是否需要调整难度
     */
    determineAdjustment(metrics, gameStats, currentLevel) {
        const thresholds = this.config.thresholds;
        const bounds = this.config.levelBounds;

        // 策略1: 基于正确率
        let reason = '';
        let newLevel = currentLevel;
        let shouldAdjust = false;

        // 检查是否应该提升难度
        if (metrics.accuracy >= thresholds.increaseAccuracy &&
            metrics.responseTimeRatio < thresholds.slowResponse &&
            currentLevel < bounds.maxLevel) {

            // 检查连续成功次数
            if (gameStats.consecutiveSuccess >= thresholds.consecutiveSuccess) {
                newLevel = Math.min(currentLevel + 1, bounds.maxLevel);
                reason = `表现优秀！正确率${(metrics.accuracy * 100).toFixed(0)}%，连续成功${gameStats.consecutiveSuccess}次`;
                shouldAdjust = true;
            } else if (metrics.responseTimeRatio < thresholds.fastResponse) {
                newLevel = Math.min(currentLevel + 1, bounds.maxLevel);
                reason = `反应很快！平均用时${metrics.responseTimeRatio.toFixed(1)}倍标准时间`;
                shouldAdjust = true;
            }
        }

        // 检查是否应该降低难度
        if (!shouldAdjust && currentLevel > bounds.minLevel) {
            if (metrics.accuracy < thresholds.decreaseAccuracy) {
                newLevel = Math.max(currentLevel - 1, bounds.minLevel);
                reason = `难度较大，正确率${(metrics.accuracy * 100).toFixed(0)}%`;
                shouldAdjust = true;
            } else if (metrics.responseTimeRatio > thresholds.slowResponse) {
                newLevel = Math.max(currentLevel - 1, bounds.minLevel);
                reason = `反应较慢，平均用时${metrics.responseTimeRatio.toFixed(1)}倍标准时间`;
                shouldAdjust = true;
            } else if (gameStats.consecutiveFail >= thresholds.consecutiveFail) {
                newLevel = Math.max(currentLevel - 1, bounds.minLevel);
                reason = `连续失败${gameStats.consecutiveFail}次，降低难度`;
                shouldAdjust = true;
            }
        }

        return {
            shouldAdjust,
            reason,
            newLevel,
            recommendation: shouldAdjust ? (newLevel > currentLevel ? 'increase' : 'decrease') : 'maintain',
            metrics
        };
    }

    /**
     * 获取推荐关卡
     */
    getRecommendedLevel(userId, gameId) {
        const userStats = this.getUserStats(userId);
        const gameStats = userStats.games[gameId];
        return gameStats ? gameStats.recommendedLevel : 1;
    }

    /**
     * 获取性能摘要
     */
    getPerformanceSummary(userId, gameId) {
        const userStats = this.getUserStats(userId);
        const gameStats = userStats.games[gameId];

        if (!gameStats || gameStats.records.length === 0) {
            return {
                totalGames: 0,
                accuracy: 0,
                avgResponseTime: 0,
                recommendedLevel: 1
            };
        }

        const metrics = this.calculateMetrics(gameStats.records);

        return {
            totalGames: gameStats.records.length,
            accuracy: metrics.accuracy,
            avgResponseTime: metrics.avgResponseTime,
            recommendedLevel: gameStats.recommendedLevel,
            consecutiveSuccess: gameStats.consecutiveSuccess,
            consecutiveFail: gameStats.consecutiveFail
        };
    }

    /**
     * 重置用户难度统计数据
     */
    resetUserStats(userId, gameId = null) {
        const userStats = this.getUserStats(userId);

        if (gameId) {
            // 重置特定游戏
            if (userStats.games[gameId]) {
                userStats.games[gameId] = {
                    records: [],
                    consecutiveSuccess: 0,
                    consecutiveFail: 0,
                    recommendedLevel: 1
                };
            }
        } else {
            // 重置所有游戏
            userStats.games = {};
        }

        userStats.lastUpdate = new Date().toISOString();
        this.saveStats();
    }

    /**
     * 清空所有统计数据（用于测试）
     */
    clearAll() {
        this.stats = {};
        localStorage.removeItem(this.storageKey);
    }

    /**
     * 生成难度调整建议消息
     */
    generateAdjustmentMessage(adjustment) {
        if (!adjustment.shouldAdjust) {
            return null;
        }

        const emoji = adjustment.recommendation === 'increase' ? '🚀' : '📉';
        const action = adjustment.recommendation === 'increase' ? '提升' : '降低';
        const levelText = adjustment.recommendation === 'increase' ? '升级' : '降级';

        return {
            message: `${emoji} ${adjustment.reason}，已${action}至第${adjustment.newLevel}关`,
            levelText: `${levelText}至 ${adjustment.newLevel}关`,
            emoji,
            recommendation: adjustment.recommendation
        };
    }
}

// 导出到全局
window.DifficultyManager = DifficultyManager;
