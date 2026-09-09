.PHONY: help start stop build deploy deploy-root deploy-cf build-cf clean test

help:
	@echo "儿童逻辑思维游戏 - 可用命令:"
	@echo ""
	@echo "  make start    - 启动本地开发服务器"
	@echo "  make stop     - 停止本地开发服务器"
	@echo "  make test     - 运行代码测试"
	@echo "  make build    - 构建生产版本"
	@echo "  make deploy   - 部署到EdgeOne"
	@echo "  make deploy-root - 注入SW版本号并部署根站到Vercel（游戏中心PWA）"
	@echo "  make build-cf - 组装 Cloudflare Pages 完整 dist/"
	@echo "  make deploy-cf - 注入SW版本号并部署根站到 Cloudflare Pages"
	@echo "  make clean    - 清理构建文件"
	@echo "  make status   - 查看服务状态"
	@echo ""

start:
	@echo "🚀 启动本地服务器..."
	@python3 -m http.server 8000

stop:
	@echo "🛑 停止服务器..."
	@pkill -f "python3 -m http.server 8000" || echo "服务器未运行"
	@echo "✅ 服务器已停止"

status:
	@echo "📊 检查服务器状态..."
	@ps aux | grep -E "python3 -m http.server 8000" | grep -v grep && echo "✅ 服务器正在运行 (端口 8000)" || echo "❌ 服务器未运行"

test:
	@echo "🧪 运行测试..."
	@echo "检查HTML文件..."
	@python3 -m http.server 8000 >/dev/null 2>&1 & SRV=$$!; sleep 2; CODE=$$(curl -m 5 -s -o /dev/null -w "%{http_code}" http://localhost:8000/ || echo 000); kill $$SRV 2>/dev/null; [ "$$CODE" = "200" ] && echo "✅ HTML测试通过 (200)" || echo "❌ HTML测试失败 ($$CODE)"
	@echo "检查CSS文件..."
	@test -f css/kids.css && echo "✅ kids.css存在" || echo "❌ kids.css缺失"
	@echo "检查JavaScript文件..."
	@test -f js/kids-ui.js && echo "✅ kids-ui.js存在" || echo "❌ kids-ui.js缺失"
	@test -f js/storage.js && echo "✅ storage.js存在" || echo "❌ storage.js缺失"
	@echo "🎉 测试完成"

build:
	@echo "🔨 构建生产版本..."
	@mkdir -p dist
	@cp -r css js index.html README.md dist/
	@echo "✅ 构建完成，输出到 dist/ 目录"
	@ls -la dist/

deploy:
	@echo "📦 准备部署到EdgeOne..."
	@echo ""
	@echo "部署方式："
	@echo "1. 腾讯云控制台："
	@echo "   - 登录 https://console.cloud.tencent.com/edgeone"
	@echo "   - 创建站点或选择已有站点"
	@echo "   - 将 dist/ 目录内容上传到静态网站托管"
	@echo ""
	@echo "2. 使用COS+CDN："
	@echo "   - 将 dist/ 目录上传到腾讯云COS存储桶"
	@echo "   - 配置静态网站托管"
	@echo "   - 在EdgeOne中添加CDN加速域名"
	@echo ""
	@echo "3. 使用EdgeOne CLI："
	@echo "   edgeone upload -s <站点ID> -d dist/"
	@echo ""
	@make build
	@echo "📁 构建文件已准备在 dist/ 目录"

deploy-root:
	@echo "📦 部署根站（游戏中心 PWA）到 Vercel..."
	@node tools/inject-sw-version.mjs
	-@vercel --prod || echo "⚠️  vercel 部署失败，sw.js 已还原，可重试"
	@node tools/inject-sw-version.mjs --restore
	@git diff --exit-code -- sw.js

CF_PROJECT_NAME ?= bingo-games-hub
# wrangler 执行方式：默认 pnpm dlx 瞬态（免全局安装/PATH 配置）；已全局安装可 make deploy-cf WRANGLER=wrangler
WRANGLER ?= pnpm dlx wrangler@latest

build-cf:
	@node tools/build-cf-pages.mjs

deploy-cf:
	@echo "📦 部署根站（游戏中心 PWA）到 Cloudflare Pages（项目：$(CF_PROJECT_NAME)）..."
	@node tools/inject-sw-version.mjs
	@node tools/build-cf-pages.mjs
	-@$(WRANGLER) pages deploy dist --project-name=$(CF_PROJECT_NAME) --commit-dirty=true || echo "⚠️  Cloudflare Pages 部署失败，sw.js 已还原，可重试"
	@node tools/inject-sw-version.mjs --restore
	@rm -rf dist
	@git diff --exit-code -- sw.js

set-sw-version:
	@node tools/inject-sw-version.mjs
	@echo "已注入本地 sw.js 版本号（联调用，勿提交）；还原：node tools/inject-sw-version.mjs --restore"

restore-sw-version:
	@node tools/inject-sw-version.mjs --restore

clean:
	@echo "🧹 清理构建文件..."
	@rm -rf dist/
	@echo "✅ 清理完成"

install:
	@echo "📥 安装依赖..."
	@echo "项目不需要额外依赖，使用原生HTML/CSS/JavaScript"
	@echo "✅ 无需安装"

dev: start

prod: build

all: clean build test