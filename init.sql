-- 初始化数据库脚本

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    settings JSONB DEFAULT '{}'::jsonb
);

-- 创建进度表
CREATE TABLE IF NOT EXISTS progress (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    game_id VARCHAR(50) NOT NULL,
    current_level INTEGER DEFAULT 1,
    high_score INTEGER DEFAULT 0,
    completed_levels INTEGER[] DEFAULT '{}',
    last_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    play_count INTEGER DEFAULT 0,
    total_play_time INTEGER DEFAULT 0,  -- 总游戏时间（秒）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE(user_id, game_id)
);

-- 创建游戏记录表（用于统计分析）
CREATE TABLE IF NOT EXISTS game_records (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    game_id VARCHAR(50) NOT NULL,
    level INTEGER NOT NULL,
    score INTEGER NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    play_time INTEGER NOT NULL,  -- 本次游戏时间（秒）
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 创建成就表
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    achievement_type VARCHAR(50) NOT NULL,
    achievement_key VARCHAR(50) NOT NULL,
    achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data JSONB DEFAULT '{}'::jsonb,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE(user_id, achievement_key)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_progress_user_id ON progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_game_id ON progress(game_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_game ON progress(user_id, game_id);
CREATE INDEX IF NOT EXISTS idx_game_records_user_id ON game_records(user_id);
CREATE INDEX IF NOT EXISTS idx_game_records_game_id ON game_records(game_id);
CREATE INDEX IF NOT EXISTS idx_game_records_played_at ON game_records(played_at);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_progress_updated_at
    BEFORE UPDATE ON progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 插入示例数据（可选）
INSERT INTO users (user_id, username, settings)
VALUES ('user_1234567890', '测试用户', '{"theme": "default", "difficulty": "normal"}'::jsonb)
ON CONFLICT (user_id) DO NOTHING;