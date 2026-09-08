-- 迁移：为已有 users 表添加 token 列（幂等）
-- 用于 Bearer token 认证；已有用户 token 为 NULL，需重新创建用户获取新 token

ALTER TABLE users ADD COLUMN IF NOT EXISTS token UUID;
