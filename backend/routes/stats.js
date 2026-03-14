const express = require('express');
const { query } = require('../db');
const router = express.Router();

// 获取用户总体统计
router.get('/:userId', async (req, res, next) => {
    try {
        const { userId } = req.params;

        // 获取总体进度统计
        const progressResult = await query(`
            SELECT 
                COUNT(*) as total_games,
                SUM(cardinality(completed_levels)) as total_completed_levels,
                SUM(high_score) as total_score,
                MAX(last_played) as last_played,
                SUM(play_count) as total_play_count
            FROM progress 
            WHERE user_id = $1
        `, [userId]);

        // 获取游戏记录统计
        const recordsResult = await query(`
            SELECT 
                game_id,
                COUNT(*) as play_count,
                AVG(score) as avg_score,
                MAX(score) as max_score,
                AVG(play_time) as avg_play_time,
                SUM(CASE WHEN completed = TRUE THEN 1 ELSE 0 END) as completed_count
            FROM game_records 
            WHERE user_id = $1
            GROUP BY game_id
            ORDER BY max_score DESC
        `, [userId]);

        // 获取每个游戏的详细进度
        const gameProgressResult = await query(`
            SELECT 
                game_id,
                current_level,
                high_score,
                cardinality(completed_levels) as completed_count,
                play_count,
                last_played
            FROM progress 
            WHERE user_id = $1
            ORDER BY last_played DESC
        `, [userId]);

        res.json({
            success: true,
            data: {
                overview: progressResult.rows[0] || {
                    total_games: 0,
                    total_completed_levels: 0,
                    total_score: 0,
                    last_played: null,
                    total_play_count: 0
                },
                byGame: gameProgressResult.rows,
                gameRecords: recordsResult.rows
            }
        });
    } catch (error) {
        next(error);
    }
});

// 获取排行榜
router.get('/leaderboard/:gameId', async (req, res, next) => {
    try {
        const { gameId } = req.params;
        const { limit = 10 } = req.query;

        const result = await query(`
            SELECT 
                u.username,
                u.user_id,
                p.high_score,
                p.current_level,
                cardinality(p.completed_levels) as completed_count
            FROM progress p
            JOIN users u ON p.user_id = u.user_id
            WHERE p.game_id = $1
            ORDER BY p.high_score DESC
            LIMIT $2
        `, [gameId, parseInt(limit)]);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        next(error);
    }
});

// 记录游戏
router.post('/record', async (req, res, next) => {
    try {
        const { userId, gameId, level, score, completed, playTime } = req.body;

        // 验证输入
        if (!userId || !gameId || !level || typeof score !== 'number') {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        const result = await query(
            `INSERT INTO game_records (user_id, game_id, level, score, completed, play_time)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [userId, gameId, parseInt(level), score, completed === true, parseInt(playTime) || 0]
        );

        res.status(201).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
});

// 获取用户游戏历史
router.get('/history/:userId', async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { gameId, limit = 20, offset = 0 } = req.query;

        let queryText = `
            SELECT * FROM game_records 
            WHERE user_id = $1
        `;
        const queryParams = [userId];

        if (gameId) {
            queryText += ' AND game_id = $2';
            queryParams.push(gameId);
        }

        queryText += ' ORDER BY played_at DESC LIMIT $' + (queryParams.length + 1) + ' OFFSET $' + (queryParams.length + 2);
        queryParams.push(parseInt(limit), parseInt(offset));

        const result = await query(queryText, queryParams);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;