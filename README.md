# Bingo 游戏中心 🎮

> 适合3-6岁儿童的趣味逻辑思维网页游戏集，完美适配iPhone/iPad等移动设备

![Version](https://img.shields.io/badge/version-v5.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-lightgrey)

## ✨ 核心特性

- **🎮 14个游戏**：覆盖3-6岁全年龄段
- **🧠 6大能力维度**：逻辑思维、观察记忆、美术绘画、认知启蒙、空间探索、经典游戏
- **📊 189+关卡**：丰富的游戏内容
- **👤 用户系统**：多用户支持，独立进度保存
- **💾 双模式存储**：本地+云端
- **📱 完美适配**：响应式设计，触摸优化
- **🚀 Cloudflare Pages 部署**：[bingo-games-hub.pages.dev](https://bingo-games-hub.pages.dev)

## 🎮 游戏列表

### 🧠 逻辑思维
1. **⭐ 形状拼图** - 把形状碎片拼回完整图案（4-5岁）
2. **🔷 形状配对** - 找到和它一样的形状（3-5岁）
3. **🔶 模式匹配** - 发现规律，补上问号那一格（4-6岁）

### 👀 观察记忆
4. **🔍 找不同** - 观察两幅图，找出藏着的不同（4-6岁）
5. **🧠 记忆翻牌** - 翻开卡片，找出相同的一对（4-6岁）

### 🎨 美术绘画
6. **✏️ 涂鸦板** - 自由画画，发挥创意（3-6岁）
7. **🖍️ 涂色画工坊** - 把彩色图片变成线稿，打印或涂色（3-6岁）

### 🌈 认知启蒙
8. **🎨 颜色配对** - 认识6种基本颜色（3-4岁）
9. **🔢 数字认知** - 数一数，认识1-10的数字（3-5岁）
10. **🖼️ 看图识物** - 认识动物、水果、交通工具（3-4岁）
11. **🐮 动物叫声** - 听声音猜动物，认识各种小动物（3-4岁）

### 🧭 空间探索
12. **🧭 迷宫小小探险家** - 森林邮局主题3D迷宫，120个关卡（4-6岁）

### 🎯 经典游戏
13. **🐍 贪吃蛇** - 经典贪吃蛇，4种模式3种速度（全年龄）
14. **🧱 水墨方块** - 中国风水墨俄罗斯方块（全年龄）

## 🚀 快速开始

### 方式1: 本地运行
```bash
cd games
python3 -m http.server 8000
```

### 方式2: Cloudflare Pages 部署
```bash
# 登录（一次性，浏览器 OAuth）
pnpm dlx wrangler@latest login

# 部署（注入 SW 版本 → 组装 dist/ → 上传 → 还原）
make deploy-cf
```

> 回滚兜底：Vercel 站（games-six-omega.vercel.app）保持在线，`make deploy-root` 仍可用。

## 📁 项目结构

```
games/
├── index.html              # 游戏中心入口（6区分类）
├── *.html                  # 各单文件游戏
├── classic-games/          # 贪吃蛇、水墨方块
├── kids-maze-world/        # 独立React迷宫游戏（Vite构建）
├── js/
│   ├── kids-ui.js          # 共享UI库（SFX/进度/TTS/头部/庆祝/触控）
│   ├── api.js              # API客户端
│   └── storage.js          # 存储管理
├── css/
│   └── kids.css            # 共享样式（kui- 设计系统）
├── icons/
│   └── wechat-qrcode.webp  # 微信二维码
├── backend/                # 后端（可选）
├── tools/                  # 部署工具
├── _headers                # Cloudflare Pages 响应头
├── _redirects              # Cloudflare Pages 重写规则
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

- **前端**: HTML5 + CSS3 + JavaScript（自包含HTML + 共享层 kids-ui.js/kids.css）
- **存储**: localStorage + PostgreSQL（可选）
- **部署**: Cloudflare Pages（主站）/ Vercel（回滚）
- **交互**: 触摸优化、Service Worker 离线支持

## 📝 更新日志

### v5.0 (2026-09-09)
- ✅ 游戏分类重组：从2区扩展为6区（逻辑思维/观察记忆/美术绘画/认知启蒙/空间探索/经典游戏）
- ✅ 架构重构：单体 js/games.js 拆分为自包含 HTML + 共享层（kids-ui.js/kids.css）
- ✅ 安全修复：SQL去重、token鉴权、XSS防护
- ✅ 新增页脚：个人主页链接 + 微信二维码
- ✅ 品牌更新：Bingo 游戏中心
- ✅ 部署迁移：bingo-games-hub.pages.dev

### v4.1 (2026-09-03)
- ✅ 贪吃蛇增强：双皮肤、手指跟随、吃食动效、速度爬升
- ✅ 水墨方块增强：字体/图标本地化、触摸手势、墨晕与连击动效
- ✅ PWA 直链离线修复、关卡口径统一（189+）

### v4.0 (2026-02-14)
- ✅ 新增7个单文件游戏
- ✅ 添加 Vercel 部署支持
- ✅ 更新文档

### v3.1 (2026-01-17)
- ✅ 数据库统一保存
- ✅ 完整API服务

---

## 🔗 相关链接

- [个人主页](https://jiangbin-ai.pages.dev)
- [GitHub](https://github.com/jiangbingo/games)
- [微信二维码](https://bingo-games-hub.pages.dev/icons/wechat-qrcode.webp)

#儿童游戏 #教育 #iPad #Bingo
