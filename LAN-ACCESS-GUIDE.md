# 🎮 儿童游戏局域网访问指南

## 服务器状态
✅ 已启动（端口 8000）

---

## 📱 iPad 访问步骤

### 第一步：获取 Mac 的 IP 地址

**方法1：系统设置**
1. 点击左上角  图标
2. 系统设置 → 网络
3. 点击 Wi-Fi
4. 查看 IP 地址（如：192.168.1.xxx）

**方法2：终端命令**
```bash
ipconfig getifaddr en0
```

---

### 第二步：iPad Safari 访问

**主入口（推荐）**：
```
http://[你的IP]:8000
```

例如：`http://192.168.1.100:8000`

**直接访问游戏**：
```
http://[你的IP]:8000/animal-sounds.html      # 动物叫声
http://[你的IP]:8000/color-matching.html     # 颜色配对
http://[你的IP]:8000/drawing-board.html      # 涂鸦板
http://[你的IP]:8000/memory-cards.html       # 记忆翻牌
http://[你的IP]:8000/number-counting.html    # 数字认知
http://[你的IP]:8000/picture-recognition.html # 看图识物
http://[你的IP]:8000/shape-matching.html     # 形状配对
```

---

## 🎮 游戏列表

### 原有游戏（6个）
- 🎨 颜色配对
- ⭐ 形状识别
- 🧩 简单拼图
- 🔢 数字认知
- 🧠 记忆大师
- 🔤 字母配对

### 新增游戏（7个）
- 🎵 动物叫声
- 🎨 涂鸦板
- 🎴 记忆翻牌
- 🖼️ 看图识物
- 🔵 形状配对
- 🌈 颜色配对（新版）
- 🔢 数字认知（新版）

**总计：13个游戏**

---

## 🛠️ 故障排除

### 无法访问？
1. 确保 Mac 和 iPad 在同一 Wi-Fi 网络
2. 检查 Mac 防火墙是否允许入站连接
3. 尝试关闭 VPN
4. 确认服务器正在运行

### 服务器管理
**停止服务器**：
```bash
kill 17288
```

**重启服务器**：
```bash
cd /Users/jiangbin/Documents/workspace01/games/kids-logic-games
./start-lan-server.sh
```

---

## ✅ 测试完成后

告诉我测试结果，我会帮你部署到 Vercel！

---

#游戏测试 #局域网 #iPad
