.PHONY: help start stop build deploy clean test

help:
	@echo "儿童逻辑思维游戏 - 可用命令:"
	@echo ""
	@echo "  make start    - 启动本地开发服务器"
	@echo "  make stop     - 停止本地开发服务器"
	@echo "  make test     - 运行代码测试"
	@echo "  make build    - 构建生产版本"
	@echo "  make deploy   - 部署到EdgeOne"
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
	@python3 -m http.server 8000 &
	@SERVER_PID=$$!
	@sleep 2
	@curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/ && echo "✅ HTML测试通过" || echo "❌ HTML测试失败"
	@kill $$SERVER_PID 2>/dev/null || true
	@echo "检查CSS文件..."
	@test -f css/styles.css && echo "✅ CSS文件存在" || echo "❌ CSS文件缺失"
	@echo "检查JavaScript文件..."
	@test -f js/games.js && echo "✅ games.js存在" || echo "❌ games.js缺失"
	@test -f js/app.js && echo "✅ app.js存在" || echo "❌ app.js缺失"
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