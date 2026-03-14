/**
 * 涂鸦板游戏模块
 * Canvas自由绘画，支持颜色选择和画笔大小
 */

export class DrawingBoardGame {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.canvas = null;
        this.ctx = null;
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        this.currentColor = '#FF5252';
        this.currentSize = 4;
        this.strokeCount = 0;
        this.TOOLBAR_HEIGHT = 120;
        
        this.colors = [
            { name: '红色', color: '#FF5252' },
            { name: '橙色', color: '#FF9800' },
            { name: '黄色', color: '#FFEB3B' },
            { name: '绿色', color: '#4CAF50' },
            { name: '蓝色', color: '#2196F3' },
            { name: '紫色', color: '#9C27B0' }
        ];
    }

    /**
     * 启动游戏
     */
    start(container, onComplete) {
        this.container = container;
        this.onComplete = onComplete;
        this.strokeCount = 0;
        this.isDrawing = false;
        
        this.render();
        this.initCanvas();
        this.bindEvents();
    }

    /**
     * 渲染游戏界面
     */
    render() {
        this.container.innerHTML = `
            <div class="drawing-board-game">
                <div class="drawing-stats">
                    已画: <span id="db-strokes">0</span> 笔
                </div>
                <div class="canvas-container">
                    <canvas id="db-canvas"></canvas>
                </div>
                <div class="toolbar" id="db-toolbar">
                    <div class="tool-group">
                        <span class="tool-label">颜色</span>
                        <div class="color-palette" id="db-colors">
                            ${this.colors.map((c, i) => `
                                <button class="color-btn ${i === 0 ? 'active' : ''}" 
                                        data-color="${c.color}" 
                                        style="background: ${c.color};"
                                        title="${c.name}"></button>
                            `).join('')}
                        </div>
                    </div>
                    <div class="tool-group">
                        <span class="tool-label">大小</span>
                        <div class="size-buttons">
                            <button class="size-btn size-small active" data-size="4">
                                <div class="dot"></div>
                            </button>
                            <button class="size-btn size-medium" data-size="10">
                                <div class="dot"></div>
                            </button>
                            <button class="size-btn size-large" data-size="18">
                                <div class="dot"></div>
                            </button>
                        </div>
                    </div>
                    <div class="tool-group action-buttons">
                        <button class="action-btn btn-clear" id="db-clear">🗑️ 清空</button>
                        <button class="action-btn btn-save" id="db-save">💾 保存</button>
                        <button class="action-btn btn-complete" id="db-complete">✅ 完成</button>
                    </div>
                </div>
                <div class="toast" id="db-toast"></div>
            </div>
        `;
    }

    /**
     * 初始化画布
     */
    initCanvas() {
        this.canvas = document.getElementById('db-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    /**
     * 调整画布大小
     */
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        // 保存当前内容
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        tempCtx.drawImage(this.canvas, 0, 0);
        
        // 调整大小
        this.canvas.width = rect.width;
        this.canvas.height = Math.max(300, window.innerHeight - this.TOOLBAR_HEIGHT - 150);
        
        // 恢复内容
        this.ctx.drawImage(tempCanvas, 0, 0);
        
        // 重设绘图属性
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineWidth = this.currentSize;
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 触控事件
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.startDrawing(touch.clientX - rect.left, touch.clientY - rect.top);
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.draw(touch.clientX - rect.left, touch.clientY - rect.top);
        }, { passive: false });

        this.canvas.addEventListener('touchend', () => this.stopDrawing());
        this.canvas.addEventListener('touchcancel', () => this.stopDrawing());

        // 鼠标事件（兼容桌面）
        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.startDrawing(e.clientX - rect.left, e.clientY - rect.top);
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.draw(e.clientX - rect.left, e.clientY - rect.top);
        });

        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseleave', () => this.stopDrawing());

        // 颜色选择
        document.querySelectorAll('#db-colors .color-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#db-colors .color-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentColor = btn.dataset.color;
                this.ctx.strokeStyle = this.currentColor;
            });
        });

        // 画笔大小
        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentSize = parseInt(btn.dataset.size);
                this.ctx.lineWidth = this.currentSize;
            });
        });

        // 清空
        document.getElementById('db-clear').addEventListener('click', () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.strokeCount = 0;
            document.getElementById('db-strokes').textContent = '0';
            this.showToast('🗑️ 已清空');
        });

        // 保存
        document.getElementById('db-save').addEventListener('click', () => {
            this.saveCanvas();
        });

        // 完成
        document.getElementById('db-complete').addEventListener('click', () => {
            this.completeDrawing();
        });
    }

    /**
     * 开始绘画
     */
    startDrawing(x, y) {
        this.isDrawing = true;
        this.lastX = x;
        this.lastY = y;
        
        // 绘制点（单击时）
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.currentSize / 2, 0, Math.PI * 2);
        this.ctx.fillStyle = this.currentColor;
        this.ctx.fill();
    }

    /**
     * 绘画中
     */
    draw(x, y) {
        if (!this.isDrawing) return;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(x, y);
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineWidth = this.currentSize;
        this.ctx.stroke();
        
        this.lastX = x;
        this.lastY = y;
    }

    /**
     * 结束绘画
     */
    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.strokeCount++;
            document.getElementById('db-strokes').textContent = this.strokeCount;
        }
    }

    /**
     * 保存画布
     */
    saveCanvas() {
        const link = document.createElement('a');
        const timestamp = new Date().toLocaleString('zh-CN').replace(/[/:]/g, '-');
        link.download = `涂鸦_${timestamp}.png`;
        link.href = this.canvas.toDataURL('image/png');
        link.click();
        this.showToast('💾 已保存');
    }

    /**
     * 完成绘画
     */
    completeDrawing() {
        const score = Math.min(50, 10 + this.strokeCount);
        this.gameManager.updateScore(score);
        this.gameManager.showCelebration();
        this.showToast(`🎉 完成！获得 ${score} 分`);
        
        if (this.onComplete) {
            setTimeout(() => {
                this.onComplete(score);
            }, 2000);
        }
    }

    /**
     * 显示提示
     */
    showToast(message) {
        const toast = document.getElementById('db-toast');
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 1500);
    }
}
