#!/bin/bash
# 启动局域网游戏服务器

echo "🎮 启动儿童游戏服务器..."
echo ""
echo "📱 iPad 访问方式："
echo ""
echo "1. 查看 Mac 的 IP 地址："
echo "   - 系统偏好设置 → 网络"
echo "   - 或运行: ipconfig getifaddr en0"
echo ""
echo "2. iPad Safari 访问："
echo "   http://[你的IP]:8000"
echo ""
echo "3. 可用游戏："
echo "   - index.html (主入口，6个游戏)"
echo "   - animal-sounds.html (动物叫声)"
echo "   - color-matching.html (颜色配对)"
echo "   - drawing-board.html (涂鸦板)"
echo "   - memory-cards.html (记忆翻牌)"
echo "   - number-counting.html (数字认知)"
echo "   - picture-recognition.html (看图识物)"
echo "   - shape-matching.html (形状配对)"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

python3 -m http.server 8000
