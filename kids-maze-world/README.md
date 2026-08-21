# 迷宫小小探险家

面向5岁儿童的互动迷宫游戏，包含120个主题关卡、触控与键盘操作、主题故事、贴纸奖励、家长面板和本地周报。

## 本地验证

项目需要 Node.js 22 与 pnpm：

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm build
```

## Cloudflare Pages 配置

在 Cloudflare Pages 导入 `jiangbingo/games` 后，将 **Root directory** 设为 `kids-maze-world`，构建命令设为 `pnpm build`，构建输出目录设为 `dist/public`。选择 Node.js 22 或与 `package.json` 的 `packageManager` 兼容的 pnpm 版本。

所有主题插画、图标和森林环境音已放入 `client/public/assets/`，部署不依赖 Manus 静态资源路径。该游戏不需要任何环境变量或密钥。
