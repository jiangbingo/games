const { Pool } = require('pg');

// PostgreSQL连接池
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 
        'postgresql://gamesuser:gamespass@localhost:5432/gamesdb',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// 查询函数
async function query(text, params) {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query', { text, duration, rows: res.rowCount });
        return res;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

// 获取客户端
function getClient() {
    return pool.connect();
}

module.exports = {
    query,
    getClient,
    pool
};