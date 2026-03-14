/**
 * 记忆翻牌游戏模块
 * 经典的翻牌配对游戏，锻炼记忆力
 */

export class MemoryCardsGame {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.score = 0;
        this.moves = 0;
        this.matchedPairs = 0;
        this.flippedCards = [];
        this.isLocked = false;
        
        // 可用的emoji组合
        this.emojiSets = [
            ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼'],
            ['🍎', '🍊', '🍋', '🍇', '🍓', '🍑'],
            ['🚗', '🚌', '🚓', '🚑', '🚒', '🚕'],
            ['⚽', '🏀', '🏈', '⚾', '🎾', '🏉'],
            ['🌸', '🌺', '🌻', '🌷', '🌹', '🌼']
        ];
    }

    /**
     * 启动游戏
     */
    start(container, onComplete) {
        this.container = container;
        this.onComplete = onComplete;
        this.score = 0;
        this.moves = 0;
        this.matchedPairs = 0;
        this.flippedCards = [];
        this.isLocked = false;
        
        this.render();
        this.initCards();
    }

    /**
     * 渲染游戏界面
     */
    render() {
        this.container.innerHTML = `
            <div class="memory-cards-game">
                <div class="game-stats">
                    <div class="stat-item">步数: <span id="mc-moves">0</span></div>
                    <div class="stat-item">配对: <span id="mc-pairs">0</span>/6</div>
                </div>
                <div class="cards-grid" id="mc-grid"></div>
                <button class="replay-btn" id="mc-replay">🔄 重新开始</button>
            </div>
        `;
        
        // 绑定重新开始按钮
        document.getElementById('mc-replay').addEventListener('click', () => {
            this.start(this.container, this.onComplete);
        });
    }

    /**
     * 初始化卡片
     */
    initCards() {
        const grid = document.getElementById('mc-grid');
        grid.innerHTML = '';
        
        // 随机选择emoji集
        const emojiSet = this.emojiSets[Math.floor(Math.random() * this.emojiSets.length)];
        
        // 创建卡片对（6对 = 12张卡片）
        const cards = this.shuffle([...emojiSet, ...emojiSet]);
        
        cards.forEach((emoji, index) => {
            const card = this.createCard(emoji, index);
            grid.appendChild(card);
        });
    }

    /**
     * 创建单个卡片
     */
    createCard(emoji, index) {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.dataset.emoji = emoji;
        card.dataset.index = index;
        
        card.innerHTML = `
            <div class="card-inner">
                <div class="card-face card-back">🎴</div>
                <div class="card-face card-front">${emoji}</div>
            </div>
        `;
        
        card.addEventListener('click', () => this.flipCard(card));
        card.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.flipCard(card);
        }, { passive: false });
        
        return card;
    }

    /**
     * 翻转卡片
     */
    flipCard(card) {
        if (this.isLocked || 
            card.classList.contains('flipped') || 
            card.classList.contains('matched')) {
            return;
        }

        card.classList.add('flipped');
        this.flippedCards.push(card);

        if (this.flippedCards.length === 2) {
            this.moves++;
            document.getElementById('mc-moves').textContent = this.moves;
            this.checkMatch();
        }
    }

    /**
     * 检查是否匹配
     */
    checkMatch() {
        this.isLocked = true;
        const [card1, card2] = this.flippedCards;
        const isMatch = card1.dataset.emoji === card2.dataset.emoji;

        if (isMatch) {
            setTimeout(() => {
                card1.classList.add('matched');
                card2.classList.add('matched');
                this.matchedPairs++;
                document.getElementById('mc-pairs').textContent = this.matchedPairs;
                
                this.flippedCards = [];
                this.isLocked = false;
                
                // 计算分数
                this.score += Math.max(10, 30 - this.moves);
                this.gameManager.updateScore(this.score);

                // 检查是否完成
                if (this.matchedPairs === 6) {
                    this.showCelebration();
                }
            }, 300);
        } else {
            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
                this.flippedCards = [];
                this.isLocked = false;
            }, 1000);
        }
    }

    /**
     * 显示庆祝动画
     */
    showCelebration() {
        this.gameManager.showCelebration();
        
        if (this.onComplete) {
            setTimeout(() => {
                this.onComplete(this.score);
            }, 2000);
        }
    }

    /**
     * 洗牌算法
     */
    shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}
