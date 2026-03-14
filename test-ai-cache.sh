#!/bin/bash

echo "🧪 AI 题目缓存功能测试"
echo "========================="
echo ""

if ! curl -s http://localhost:8000/ > /dev/null; then
    echo "❌ 服务器未运行,请先启动服务器"
    exit 1
fi

echo "✅ 服务器运行正常"
echo ""

echo "📝 测试 1: 检查 AIGameCache 类"
if grep -q "class AIGameCache" js/storage.js; then
    echo "✅ AIGameCache 类存在"
else
    echo "❌ AIGameCache 类不存在"
    exit 1
fi
echo ""

echo "📝 测试 2: 检查 ai-game-demo.html 引入"
if grep -q 'src="js/storage.js"' ai-game-demo.html; then
    echo "✅ ai-game-demo.html 已引入 storage.js"
else
    echo "❌ ai-game-demo.html 未引入 storage.js"
    exit 1
fi
echo ""

echo "📝 测试 3: 检查保存逻辑"
if grep -q "aiCache.saveGame" ai-game-demo.html; then
    echo "✅ ai-game-demo.html 包含保存逻辑"
else
    echo "❌ ai-game-demo.html 不包含保存逻辑"
    exit 1
fi
echo ""

echo "📝 测试 4: 检查 games.js 缓存实例"
if grep -q "this.aiCache = new AIGameCache()" js/games.js; then
    echo "✅ games.js 包含 aiCache 实例"
else
    echo "❌ games.js 不包含 aiCache 实例"
    exit 1
fi
echo ""

echo "📝 测试 5: 检查读取缓存逻辑"
if grep -q "this.aiCache.getLatestGame" js/games.js; then
    echo "✅ games.js 包含读取缓存逻辑"
else
    echo "❌ games.js 不包含读取缓存逻辑"
    exit 1
fi
echo ""

echo "📝 测试 6: 检查 memory-cards.html 支持"
if grep -q 'src="js/storage.js"' memory-cards.html && grep -q "AIGameCache" memory-cards.html; then
    echo "✅ memory-cards.html 支持 AI 缓存"
else
    echo "❌ memory-cards.html 不支持 AI 缓存"
    exit 1
fi
echo ""

echo "========================="
echo "🎉 所有测试通过!"
echo ""
echo "📋 下一步:"
echo "1. 访问 http://localhost:8000/ai-game-demo.html"
echo "2. 生成一些题目"
echo "3. 返回主页 http://localhost:8000/"
echo "4. 启动游戏验证是否使用新生成的题目"
echo ""
echo "🧪 访问测试页面: http://localhost:8000/test-ai-cache.html"
