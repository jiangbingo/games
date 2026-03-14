/**
 * 看图识物游戏模块
 * 展示图片，让孩子认识各种物品
 */

export class PictureRecognitionGame {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.score = 0;
        this.correctCount = 0;
        this.wrongCount = 0;
        this.currentTarget = null;
        this.canClick = true;
        this.currentCategory = 'animals';
        
        // 游戏数据
        this.categories = {
            animals: {
                name: '动物',
                emoji: '🐾',
                items: [
                    { emoji: '🐶', name: '小狗' },
                    { emoji: '🐱', name: '小猫' },
                    { emoji: '🐰', name: '兔子' },
                    { emoji: '🦊', name: '狐狸' },
                    { emoji: '🐻', name: '熊' },
                    { emoji: '🐼', name: '熊猫' },
                    { emoji: '🦁', name: '狮子' },
                    { emoji: '🐯', name: '老虎' }
                ]
            },
            fruits: {
                name: '水果',
                emoji: '🍎',
                items: [
                    { emoji: '🍎', name: '苹果' },
                    { emoji: '🍊', name: '橘子' },
                    { emoji: '🍋', name: '柠檬' },
                    { emoji: '🍇', name: '葡萄' },
                    { emoji: '🍓', name: '草莓' },
                    { emoji: '🍑', name: '桃子' },
                    { emoji: '🍌', name: '香蕉' },
                    { emoji: '🍉', name: '西瓜' }
                ]
            },
            vehicles: {
                name: '交通',
                emoji: '🚗',
                items: [
                    { emoji: '🚗', name: '汽车' },
                    { emoji: '🚌', name: '公交车' },
                    { emoji: '🚓', name: '警车' },
                    { emoji: '🚑', name: '救护车' },
                    { emoji: '🚒', name: '消防车' },
                    { emoji: '🚕', name: '出租车' },
                    { emoji: '✈️', name: '飞机' },
                    { emoji: '🚂', name: '火车' }
                ]
            }
        };
    }

    /**
     * 启动游戏
     */
    start(container, onComplete) {
        this.container = container;
        this.onComplete = onComplete;
        this.score = 0;
        this.correctCount = 0;
        this.wrongCount = 0;
        this.currentCategory = 'animals';
        
        this.render();
        this.nextRound();
    }

    /**
     * 渲染游戏界面
     */
    render() {
        const categoryButtons = Object.entries(this.categories).map(([key, cat]) => `
            <button class="cat-btn ${key === this.currentCategory ? 'active' : ''}" 
                    data-category="${key}">
                ${cat.emoji} ${cat.name}
            </button>
        `).join('');

        this.container.innerHTML = `
            <div class="picture-recognition-game">
                <div class="categories">
                    ${categoryButtons}
                </div>
                <div class="score-board">
                    <div class="score-item">
                        <div class="score-label">正确</div>
                        <div class="score-value correct" id="pr-correct">0</div>
                    </div>
                    <div class="score-item">
                        <div class="score-label">错误</div>
                        <div class="score-value wrong" id="pr-wrong">0</div>
                    </div>
                </div>
                <div class="target-area">
                    <div class="target-emoji" id="pr-target-emoji">🐶</div>
                    <div class="target-name" id="pr-target-name">小狗</div>
                </div>
                <div class="options" id="pr-options"></div>
                <div class="feedback" id="pr-feedback"></div>
            </div>
        `;

        // 绑定分类按钮事件
        this.container.querySelectorAll('.cat-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentCategory = btn.dataset.category;
                this.container.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.nextRound();
            });
        });
    }

    /**
     * 下一轮
     */
    nextRound() {
        this.canClick = true;
        document.getElementById('pr-feedback').textContent = '';
        
        const items = this.categories[this.currentCategory].items;
        
        // 随机选择目标
        this.currentTarget = items[Math.floor(Math.random() * items.length)];
        
        // 显示目标
        document.getElementById('pr-target-emoji').textContent = this.currentTarget.emoji;
        document.getElementById('pr-target-name').textContent = this.currentTarget.name;
        
        // 生成选项（1个正确 + 2个错误）
        const options = [this.currentTarget];
        const otherItems = items.filter(item => item !== this.currentTarget);
        
        // 随机选2个错误选项
        for (let i = 0; i < 2 && otherItems.length > 0; i++) {
            const idx = Math.floor(Math.random() * otherItems.length);
            options.push(otherItems.splice(idx, 1)[0]);
        }
        
        // 打乱顺序
        options.sort(() => Math.random() - 0.5);
        
        // 显示选项
        const optionsDiv = document.getElementById('pr-options');
        optionsDiv.innerHTML = options.map(item => `
            <button class="option-btn" data-emoji="${item.emoji}">
                ${item.emoji}
            </button>
        `).join('');
        
        // 绑定选项点击事件
        optionsDiv.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => this.checkAnswer(btn));
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.checkAnswer(btn);
            }, { passive: false });
        });
    }

    /**
     * 检查答案
     */
    checkAnswer(btn) {
        if (!this.canClick) return;
        this.canClick = false;
        
        const isCorrect = btn.dataset.emoji === this.currentTarget.emoji;
        
        if (isCorrect) {
            btn.classList.add('correct');
            this.correctCount++;
            document.getElementById('pr-correct').textContent = this.correctCount;
            document.getElementById('pr-feedback').textContent = '✅';
            
            this.score += 10;
            this.gameManager.updateScore(this.score);
            this.gameManager.showCelebration();
            
            // 1秒后下一轮
            setTimeout(() => this.nextRound(), 1000);
        } else {
            btn.classList.add('wrong');
            this.wrongCount++;
            document.getElementById('pr-wrong').textContent = this.wrongCount;
            document.getElementById('pr-feedback').textContent = '🤔';
            
            // 1.5秒后下一轮
            setTimeout(() => this.nextRound(), 1500);
        }
        
        // 检查是否完成（10轮后）
        if (this.correctCount >= 10) {
            this.completeGame();
        }
    }

    /**
     * 完成游戏
     */
    completeGame() {
        if (this.onComplete) {
            this.onComplete(this.score);
        }
    }
}
