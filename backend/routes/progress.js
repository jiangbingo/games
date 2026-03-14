const express = require('express');
const Joi = require('joi');
const { query } = require('../db');
const router = express.Router();

// 进度验证schema
const progressSchema = Joi.object({
    userId: Joi.string().required(),
    gameId: Joi.string().required(),
    currentLevel: Joi.number().integer().min(1).default(1),
    highScore: Joi.number().integer().min(0).default(0),
    completedLevels: Joi.array().items(Joi.number().integer()).default([])
});

// 获取用户所有游戏进度
router.get('/:userId', async (req, res, next) => {
    try {
        const { userId } = req.params;
        const result = await query(
            'SELECT * FROM progress WHERE user_id = $1 ORDER BY last_played DESC',
            [userId]
        );
        
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        next(error);
    }
});

// 获取特定游戏进度
router.get('/:userId/:gameId', async (req, res, next) => {
    try {
        const { userId, gameId } = req.params;
        const result = await query(
            'SELECT * FROM progress WHERE user_id = $1 AND game_id = $2',
            [userId, gameId]
        );
        
        if (result.rows.length === 0) {
            return res.json({
                success: true,
                data: {
                    userId,
                    gameId,
                    currentLevel: 1,
                    highScore: 0,
                    completedLevels: []
                }
            });
        }
        
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
});

// 创建或更新进度
router.post('/', async (req, res, next) => {
    try {
        // 验证输入
        const { error, value } = progressSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: error.details[0].message
            });
        }

        const { userId, gameId, currentLevel, highScore, completedLevels } = value;

        // 检查是否已存在
        const existing = await query(
            'SELECT * FROM progress WHERE user_id = $1 AND game_id = $2',
            [userId, gameId]
        );

        if (existing.rows.length > 0) {
            // 更新进度
            const result = await query(
                `UPDATE progress 
                 SET current_level = GREATEST(current_level, $1),
                     high_score = GREATEST(high_score, $2),
                     completed_levels = progress.completed_levels || '{}'::integer[] || $3,
                     play_count = play_count + 1,
                     last_played = CURRENT_TIMESTAMP
                 WHERE user_id = $4 AND game_id = $5
                 RETURNING *`,
                [
                    currentLevel,
                    highScore,
                    JSON.stringify(completedLevels),
                    userId,
                    gameId
                ]
            );

            return res.json({
                success: true,
                data: result.rows[0]
            });
        }

        // 创建新进度
        const result = await query(
            `INSERT INTO progress (user_id, game_id, current_level, high_score, completed_levels, play_count)
             VALUES ($1, $2, $3, $4, $5, 1)
             RETURNING *`,
            [userId, gameId, currentLevel, highScore, JSON.stringify(completedLevels)]
        );

        res.status(201).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
});

// 更新高分
router.put('/:userId/:gameId/highscore', async (req, res, next) => {
    try {
        const { userId, gameId } = req.params;
        const { score } = req.body;

        if (typeof score !== 'number' || score < 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid score'
            });
        }

        const result = await query(
            `UPDATE progress 
             SET high_score = GREATEST(high_score, $1),
                 last_played = CURRENT_TIMESTAMP
             WHERE user_id = $2 AND game_id = $3
             RETURNING *`,
            [score, userId, gameId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Progress not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0],
            isNewHighScore: result.rows[0].high_score === score
        });
    } catch (error) {
        next(error);
    }
});

// 记录关卡完成
router.put('/:userId/:gameId/level/:level', async (req, res, next) => {
    try {
        const { userId, gameId, level } = req.params;

        const result = await query(
            `UPDATE progress 
             SET current_level = GREATEST(current_level, $1 + 1),
                 completed_levels = ARRAY_APPEND(
                     CASE WHEN $2 = ANY(completed_levels) 
                          THEN completed_levels 
                          ELSE completed_levels || $2 
                     END,
                     $2
                 ),
                 last_played = CURRENT_TIMESTAMP
             WHERE user_id = $3 AND game_id = $4
             RETURNING *`,
            [parseInt(level), parseInt(level), userId, gameId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Progress not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
});

// 重置游戏进度
router.delete('/:userId/:gameId', async (req, res, next) => {
    try {
        const { userId, gameId } = req.params;

        await query(
            'DELETE FROM progress WHERE user_id = $1 AND game_id = $2',
            [userId, gameId]
        );

        res.json({
            success: true,
            message: 'Progress reset successfully'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;