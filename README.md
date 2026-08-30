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

### 儿童逻辑游戏（10个）
1. **🎨 颜色配对** - 认识6种基本颜色
2. **⭐ 形状拼图** - 完成可爱动物拼图
3. **🎴 记忆翻牌** - 4x3卡片配对
4. **🎵 动物叫声** - 听声音猜动物
5. **🎨 涂鸦板** - Canvas自由绘画
6. **🔍 找不同** - 观察力训练
7. **🖼️ 看图识物** - 动物/水果/交通工具
8. **🔵 形状配对** - 匹配相同形状
9. **🔢 数字认知** - 学习1-10数字
10. **🔷 模式匹配** - 发现规律完成序列

### 经典游戏（2个）
11. **🐍 贪吃蛇** - 4种模式，3种速度
12. **🧱 水墨方块** - 中国风水墨俄罗斯方块

### 独立项目（1个）
13. **🧭 迷宫小小探险家** - 3D迷宫120关（React，见 `kids-maze-world/`，线上地址 kids-maze-world.pages.dev）

## 🚀 快速开始

### 方式1: 本地运行
```bash
cd games
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
games/
├── index.html              # 游戏中心入口
├── *.html                  # 各单文件游戏
├── classic-games/          # 贪吃蛇、水墨方块
├── kids-maze-world/        # 独立React迷宫游戏（Vite构建）
├── vercel.json             # Vercel 配置
├── .vercelignore           # Vercel 忽略文件
├── js/                     # JavaScript 模块
├── css/                    # 样式
├── backend/                # 后端（可选）
└── docs/                   # 设计文档与历史报告
```

## 🎯 年龄适配

| 游戏 | 3岁 | 4岁 | 5岁 | 6岁 |
|------|-----|-----|-----|-----|
| 颜色配对 | ⭐⭐⭐ | ⭐⭐ | ⭐ | |
| 形状拼图 | ⭐⭐⭐ | ⭐⭐ | ⭐ | |
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
