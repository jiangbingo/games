const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

// 路由
const userRoutes = require('./routes/users');
const progressRoutes = require('./routes/progress');
const statsRoutes = require('./routes/stats');

// 配置
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// 速率限制
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100 // 每个IP最多100个请求
});
app.use('/api/', limiter);

// 健康检查
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: require('./package.json').version
    });
});

// API路由
app.use('/api/users', userRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/stats', statsRoutes);

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            details: err.details
        });
    }
    
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 404处理
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        path: req.path
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║     Kids Logic Games Backend API                             ║
╚═══════════════════════════════════════════════════════════╝

🚀 服务器运行中
   端口: ${PORT}
   环境: ${process.env.NODE_ENV || 'development'}
   时间: ${new Date().toISOString()}

📊 API端点
   GET    /health
   GET    /api/users
   POST   /api/users
   GET    /api/users/:id
   DELETE /api/users/:id
   GET    /api/progress/:userId/:gameId
   POST   /api/progress
   PUT    /api/progress/:userId/:gameId
   GET    /api/stats/:userId

📝 数据库连接
   PostgreSQL: ${process.env.DATABASE_URL || '未配置'}
   Redis: ${process.env.REDIS_URL || '未配置'}

    `);
});

module.exports = app;