const express = require('express');
const Joi = require('joi');
const { query } = require('../db');
const router = express.Router();

// 用户验证schema
const userSchema = Joi.object({
    username: Joi.string().min(1).max(10).required(),
    settings: Joi.object().optional()
});

// 获取所有用户
router.get('/', async (req, res, next) => {
    try {
        const result = await query(
            'SELECT user_id, username, created_at, last_login, settings FROM users ORDER BY created_at DESC'
        );
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        next(error);
    }
});

// 获取单个用户
router.get('/:userId', async (req, res, next) => {
    try {
        const { userId } = req.params;
        const result = await query(
            'SELECT user_id, username, created_at, last_login, settings FROM users WHERE user_id = $1',
            [userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
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

// 创建用户
router.post('/', async (req, res, next) => {
    try {
        // 验证输入
        const { error, value } = userSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: error.details[0].message
            });
        }

        const { username, settings } = value;
        const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // 检查用户名是否已存在
        const existingUser = await query(
            'SELECT user_id FROM users WHERE username = $1',
            [username]
        );
        
        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Username already exists'
            });
        }

        // 创建用户
        const result = await query(
            'INSERT INTO users (user_id, username, settings) VALUES ($1, $2, $3) RETURNING *',
            [userId, username, JSON.stringify(settings || {})]
        );

        res.status(201).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
});

// 更新用户
router.put('/:userId', async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { username, settings } = req.body;

        // 验证用户是否存在
        const existingUser = await query(
            'SELECT user_id FROM users WHERE user_id = $1',
            [userId]
        );
        
        if (existingUser.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // 更新用户
        const result = await query(
            'UPDATE users SET username = COALESCE($1, username), settings = COALESCE($2, settings), last_login = CURRENT_TIMESTAMP WHERE user_id = $3 RETURNING *',
            [username, JSON.stringify(settings), userId]
        );

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
});

// 删除用户
router.delete('/:userId', async (req, res, next) => {
    try {
        const { userId } = req.params;

        // 删除用户（级联删除相关数据）
        const result = await query(
            'DELETE FROM users WHERE user_id = $1 RETURNING user_id',
            [userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;