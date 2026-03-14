/**
 * 自适应难度系统测试脚本
 * 在Node.js环境中模拟各种表现场景并生成测试结果
 */

class DifficultyManager {
    constructor() {
        this.stats = {};

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
            }
        };
    }

    loadStats() {
        return this.stats;
    }

    saveStats() {
        return true;
    }

    getUserStats(userId) {
        if (!this.stats[userId]) {
            this.stats[userId] = {
                games: {},
                lastUpdate: new Date().toISOString()
            };
        }
        return this.stats[userId];
    }

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

        const record = {
            timestamp: new Date().toISOString(),
            level: performance.level,
            isCorrect: performance.isCorrect,
            responseTime: performance.responseTime,
            targetTime: performance.targetTime,
            score: performance.score || 0
        };

        gameStats.records.push(record);

        if (performance.isCorrect) {
            gameStats.consecutiveSuccess++;
            gameStats.consecutiveFail = 0;
        } else {
            gameStats.consecutiveFail++;
            gameStats.consecutiveSuccess = 0;
        }

        const windowSize = this.config.evaluationWindow;
        if (gameStats.records.length > windowSize) {
            gameStats.records = gameStats.records.slice(-windowSize);
        }

        return this.evaluateAndRecommend(userId, gameId);
    }

    evaluateAndRecommend(userId, gameId) {
        const userStats = this.getUserStats(userId);
        const gameStats = userStats.games[gameId];

        if (!gameStats || gameStats.records.length < 3) {
            return {
                shouldAdjust: false,
                reason: '记录不足，继续观察',
                recommendation: 'maintain'
            };
        }

        const records = gameStats.records;
        const currentLevel = records[records.length - 1].level;

        const metrics = this.calculateMetrics(records);
        const adjustment = this.determineAdjustment(metrics, gameStats, currentLevel);

        if (adjustment.shouldAdjust) {
            gameStats.recommendedLevel = adjustment.newLevel;
        }

        return adjustment;
    }

    calculateMetrics(records) {
        const correctCount = records.filter(r => r.isCorrect).length;
        const accuracy = correctCount / records.length;

        const avgResponseTime = records.reduce((sum, r) => sum + r.responseTime, 0) / records.length;
        const avgTargetTime = records.reduce((sum, r) => sum + r.targetTime, 0) / records.length;
        const responseTimeRatio = avgResponseTime / avgTargetTime;

        return {
            accuracy,
            avgResponseTime,
            avgTargetTime,
            responseTimeRatio,
            totalScore: records.reduce((sum, r) => sum + r.score, 0),
            recordCount: records.length
        };
    }

    determineAdjustment(metrics, gameStats, currentLevel) {
        const thresholds = this.config.thresholds;
        const bounds = this.config.levelBounds;

        let reason = '';
        let newLevel = currentLevel;
        let shouldAdjust = false;

        if (metrics.accuracy >= thresholds.increaseAccuracy &&
            metrics.responseTimeRatio < thresholds.slowResponse &&
            currentLevel < bounds.maxLevel) {

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

    resetUserStats(userId, gameId = null) {
        const userStats = this.getUserStats(userId);

        if (gameId) {
            if (userStats.games[gameId]) {
                userStats.games[gameId] = {
                    records: [],
                    consecutiveSuccess: 0,
                    consecutiveFail: 0,
                    recommendedLevel: 1
                };
            }
        } else {
            userStats.games = {};
        }
    }

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

const userId = 'test_user_sim';
const gameId = 'memory-match';
let adjustmentCount = 0;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function simulateGame(manager, level, isCorrect, responseTime, targetTime) {
    const result = manager.recordPerformance(userId, gameId, {
        level,
        isCorrect,
        responseTime,
        targetTime,
        score: isCorrect ? 10 : 0
    });

    const summary = manager.getPerformanceSummary(userId, gameId);

    const statusIcon = isCorrect ? '✅' : '❌';
    const timeRatio = (responseTime / targetTime).toFixed(2);
    console.log(`第${summary.totalGames}关: ${statusIcon} 用时${(responseTime/1000).toFixed(1)}s (${timeRatio}倍标准)`);

    if (result.shouldAdjust) {
        const message = manager.generateAdjustmentMessage(result);
        adjustmentCount++;
        console.log(`🎯 ${message.message}`);
        console.log('');
    }

    return result;
}

async function runScenario(scenarioName) {
    console.log('\n' + '='.repeat(60));
    console.log(`🎬 开始测试场景: ${scenarioName}`);
    console.log('='.repeat(60) + '\n');

    const manager = new DifficultyManager();
    manager.resetUserStats(userId, gameId);
    adjustmentCount = 0;

    let level = 1;

    switch (scenarioName) {
        case '天才儿童':
            await runGeniusScenario(manager, level);
            break;
        case '普通儿童':
            await runNormalScenario(manager, level);
            break;
        case '困难儿童':
            await runStrugglingScenario(manager, level);
            break;
        case '波动表现':
            await runFluctuatingScenario(manager, level);
            break;
    }

    console.log('\n' + '='.repeat(60));
    console.log(`📊 场景总结: ${scenarioName}`);
    console.log('='.repeat(60));

    const summary = manager.getPerformanceSummary(userId, gameId);
    console.log(`总游戏次数: ${summary.totalGames}`);
    console.log(`正确率: ${(summary.accuracy * 100).toFixed(0)}%`);
    console.log(`平均响应时间: ${(summary.avgResponseTime / 1000).toFixed(1)}s`);
    console.log(`当前关卡: ${level}`);
    console.log(`推荐关卡: ${summary.recommendedLevel}`);
    console.log(`难度调整次数: ${adjustmentCount}`);
    console.log(`连续成功: ${summary.consecutiveSuccess}`);
    console.log(`连续失败: ${summary.consecutiveFail}`);
    console.log('='.repeat(60) + '\n');
}

async function runGeniusScenario(manager, level) {
    const baseTargetTime = 4000;

    for (let i = 0; i < 15; i++) {
        const targetTime = Math.max(2000, baseTargetTime - (level * 50));
        const result = await simulateGame(manager, level, true, targetTime * 0.4, targetTime);

        if (result.recommendation === 'increase') {
            level = result.newLevel;
        }
    }
}

async function runNormalScenario(manager, level) {
    const baseTargetTime = 4000;

    for (let i = 0; i < 15; i++) {
        const targetTime = Math.max(2000, baseTargetTime - (level * 50));
        const isCorrect = Math.random() > 0.3;
        const responseTime = targetTime * (isCorrect ? 0.9 : 1.5);

        await simulateGame(manager, level, isCorrect, responseTime, targetTime);

        if (level > 5) {
            level = Math.max(1, level - 1);
        }
    }
}

async function runStrugglingScenario(manager, level) {
    const baseTargetTime = 4000;

    for (let i = 0; i < 15; i++) {
        const targetTime = Math.max(2000, baseTargetTime - (level * 50));
        const isCorrect = Math.random() > 0.6;
        const responseTime = targetTime * (isCorrect ? 1.8 : 2.5);

        await simulateGame(manager, level, isCorrect, responseTime, targetTime);
    }
}

async function runFluctuatingScenario(manager, level) {
    const baseTargetTime = 4000;

    for (let i = 0; i < 15; i++) {
        const targetTime = Math.max(2000, baseTargetTime - (level * 50));

        if (i % 2 === 0) {
            await simulateGame(manager, level, true, targetTime * 0.5, targetTime);
        } else {
            await simulateGame(manager, level, false, targetTime * 2.2, targetTime);
        }
    }
}

async function runAllTests() {
    await runScenario('天才儿童');
    await sleep(500);

    await runScenario('普通儿童');
    await sleep(500);

    await runScenario('困难儿童');
    await sleep(500);

    await runScenario('波动表现');
}

console.log('\n🧠 自适应难度系统测试\n');
console.log('正在运行所有测试场景...\n');
runAllTests().then(() => {
    console.log('✅ 所有测试完成！\n');
});
