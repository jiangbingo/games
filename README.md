# 儿童逻辑思维游戏 🎮

> 适合3-6岁儿童的趣味逻辑思维网页游戏集，完美适配iPhone/iPad等移动设备

![Version](https://img.shields.io/badge/version-v4.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-lightgrey)

## ✨ 核心特性

- **🎮 13个游戏**：覆盖3-6岁全年龄段
- **📊 69+关卡**：丰富的游戏内容
- **👤 用户系统**：多用户支持，独立进度保存
- **💾 双模式存储**：本地+云端
- **📱 完美适配**：响应式设计，触摸优化
- **🚀 Vercel 部署**：一键部署

## 🎮 游戏列表

### 原有游戏（6个）
1. **🎨 颜色配对** - 认识6种基本颜色
2. **⭐ 形状识别** - 学习6种基本形状
3. **🧩 简单拼图** - 完成可爱动物拼图
4. **🔢 数字认知** - 学习1-10数字
5. **🧠 记忆大师** - 50关记忆训练
6. **🔤 字母配对** - 26个英文字母

### 新增游戏（7个）✨
7. **🎴 记忆翻牌** - 4x3卡片配对
8. **🎨 简易涂鸦板** - Canvas自由绘画
9. **🖼️ 看图识物** - 动物/水果/交通工具
10. **🎵 动物叫声** - 听声音猜动物
11. **🔵 形状配对** - 匹配相同形状
12. **🌈 颜色配对** - 单文件版本
13. **🔢 数字认知** - 单文件版本

## 🚀 快速开始

### 方式1: 本地运行
```bash
cd /Users/jiangbin/Documents/workspace01/games/kids-logic-games
python3 -m http.server 8000
```

### 方式2: Vercel 部署
```bash
# 安装 Vercel CLI
npm install -g vercel

# 部署
vercel --prod
```

## 📁 项目结构

```
kids-logic-games/
├── index.html              # 主入口（原有6个游戏）
├── animal-sounds.html      # 动物叫声游戏
├── color-matching.html     # 颜色配对游戏
├── drawing-board.html      # 涂鸦板
├── memory-cards.html       # 记忆翻牌
├── number-counting.html    # 数字认知
├── picture-recognition.html # 看图识物
├── shape-matching.html     # 形状配对
├── vercel.json             # Vercel 配置
├── .vercelignore           # Vercel 忽略文件
├── js/                     # JavaScript 模块
├── css/                    # 样式
├── backend/                # 后端（可选）
└── docs/                   # 文档
```

## 🎯 年龄适配

| 游戏 | 3岁 | 4岁 | 5岁 | 6岁 |
|------|-----|-----|-----|-----|
| 颜色配对 | ⭐⭐⭐ | ⭐⭐ | ⭐ | |
| 形状识别 | ⭐⭐⭐ | ⭐⭐ | ⭐ | |
| 涂鸦板 | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐ |
| 看图识物 | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | |
| 动物叫声 | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | |
| 记忆翻牌 | | ⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| 数字认知 | ⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ |

## 📚 技术栈

- **前端**: HTML5 + CSS3 + JavaScript
- **存储**: localStorage + PostgreSQL（可选）
- **部署**: Vercel / EdgeOne
- **交互**: htmx（部分游戏）

## 📝 更新日志

### v4.0 (2026-02-14)
- ✅ 新增7个单文件游戏
- ✅ 添加 Vercel 部署支持
- ✅ 更新文档

### v3.1 (2026-01-17)
- ✅ 数据库统一保存
- ✅ 完整API服务

---

#儿童游戏 #教育 #iPad #Vercel
