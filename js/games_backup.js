class Games {
    constructor() {
        this.score = 0;
        this.currentGame = null;
        this.currentLevel = 1;
        this.gameManager = null;
        
        // 记忆游戏主题（10种）
        this.memoryThemes = [
            { name: '水果', items: ['🍎', '🍌', '🍇', '🍊', '🍋', '🍓', '🍑', '🍍', '🥝', '🍒'] },
            { name: '蔬菜', items: ['🥕', '🥦', '🍆', '🥒', '🌽', '🥬', '🍅', '🌶️', '🥔', '🧄'] },
            { name: '车辆', items: ['🚗', '🚕', '🚙', '🚌', '🚎', '🚓', '🚑', '🚒', '🏎️', '🛵'] },
            { name: '动物', items: ['🐶', '🐱', '🐰', '🐼', '🐨', '🦁', '🐯', '🐻', '🦊', '🐮'] },
            { name: '运动', items: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸'] },
            { name: '天气', items: ['☀️', '🌤️', '☁️', '🌧️', '⛈️', '🌈', '❄️', '🌊', '🌪️', '🌙'] },
            { name: '食物', items: ['🍕', '🍔', '🌭', '🍿', '🥓', '🍳', '🥞', '🥪', '🍣', '🍩'] },
            { name: '花卉', items: ['🌹', '🌻', '🌷', '🌺', '🌸', '🌼', '🌾', '🌿', '🍀', '🌵'] },
            { name: '太空', items: ['🌍', '🌙', '⭐', '🌟', '🚀', '🛸', '🌌', '🪐', '☄️', '👨‍🚀'] },
            { name: '音乐', items: ['🎵', '🎶', '🎸', '🎹', '🎺', '🎷', '🥁', '🎻', '🎤', '📻'] }
        ];

        // 关卡配置
        this.levelConfig = this.generateLevelConfig();
    }

    // 生成关卡配置（50关）
    generateLevelConfig() {
        const levels = [];
        for (let i = 1; i <= 50; i++) {
            let cardCount, displayTime, scoreMultiplier;
            
            if (i <= 10) {
                // 1-10关：简单
                cardCount = 3;
                displayTime = 6000 - (i * 200);
                scoreMultiplier = 1.0;
            } else if (i <= 25) {
                // 11-25关：中等
                cardCount = 4;
                displayTime = 5000 - ((i - 10) * 150);
                scoreMultiplier = 1.2;
            } else if (i <= 40) {
                // 26-40关：困难
                cardCount = 6;
                displayTime = 4000 - ((i - 25) * 100);
                scoreMultiplier = 1.5;
            } else {
                // 41-50关：挑战
                cardCount = 8;
                displayTime = 3000 - ((i - 40) * 50);
                scoreMultiplier = 2.0;
            }

            levels.push({
                level: i,
                cardCount: cardCount,
                displayTime: Math.max(2000, displayTime),
                scoreMultiplier: scoreMultiplier
            });
        }
        return levels;
    }

    addTouchFeedback(element) {
        element.addEventListener('touchstart', () => {
            element.style.transform = 'scale(0.95)';
        }, { passive: true });
        
        element.addEventListener('touchend', () => {
            element.style.transform = 'scale(1)';
        }, { passive: true });
    }

    startGame(gameType, level = 1) {
        this.score = 0;
        this.currentLevel = level;
        this.gameManager = new GameManager();
        const gameArea = document.getElementById('game-area');
        gameArea.innerHTML = '';
        
        // 更新关卡显示
        const levelDisplay = document.getElementById('level-display');
        if (levelDisplay) {
            levelDisplay.textContent = `关卡: ${this.currentLevel}`;
        }
        
        switch(gameType) {
            case 'color-match':
                this.startColorMatchGame();
                break;
            case 'shape-match':
                this.startShapeMatchGame();
                break;
            case 'simple-puzzle':
                this.startSimplePuzzleGame();
                break;
            case 'number-count':
                this.startNumberCountGame();
                break;
            case 'memory-match':
                this.startMemoryMatchGame();
                break;
            case 'letter-match':
                this.startLetterMatchGame();
                break;
        }
        this.updateScore();
    }

    updateScore() {
        document.getElementById('score').textContent = `得分: ${this.score}`;
    }

    // 保存当前游戏进度
    saveProgress(gameId, data) {
        if (this.gameManager) {
            this.gameManager.saveProgress(gameId, data);
        }
    }

    // 记录关卡完成
    recordLevelComplete(gameId, level) {
        if (this.gameManager) {
            this.gameManager.recordLevelComplete(gameId, level);
            this.gameManager.updateHighScore(gameId, this.score);
        }
    }

    showCelebration() {
        const celebration = document.createElement('div');
        celebration.className = 'celebration';
        celebration.textContent = '🎉';
        document.body.appendChild(celebration);
        setTimeout(() => celebration.remove(), 1000);
    }

    startColorMatchGame() {
        document.getElementById('game-title').textContent = '🎨 颜色配对';
        const gameArea = document.getElementById('game-area');
        
        const colors = [
            { name: '红色', color: '#e74c3c', emoji: '🍎' },
            { name: '蓝色', color: '#3498db', emoji: '🫐' },
            { name: '绿色', color: '#2ecc71', emoji: '🍀' },
            { name: '黄色', color: '#f1c40f', emoji: '🌻' },
            { name: '紫色', color: '#9b59b6', emoji: '🍇' },
            { name: '橙色', color: '#e67e22', emoji: '🍊' }
        ];

        let round = 0;
        const totalRounds = 5;

        const createRound = () => {
            if (round >= totalRounds) {
                gameArea.innerHTML = '<div class="game-instruction">🎉 太棒了！你完成了所有关卡！</div>';
                this.showCelebration();
                return;
            }

            const targetColor = colors[Math.floor(Math.random() * colors.length)];
            const options = [...colors].sort(() => Math.random() - 0.5).slice(0, 4);
            if (!options.includes(targetColor)) {
                options[Math.floor(Math.random() * options.length)] = targetColor;
            }
            options.sort(() => Math.random() - 0.5);

            gameArea.innerHTML = `
                <div class="game-instruction">找到${targetColor.name}的颜色！</div>
                <div class="target-display" style="background: ${targetColor.color}">
                    ${targetColor.emoji}
                </div>
                <div class="items-grid">
                    ${options.map(opt => `
                        <div class="game-item color-item" data-color="${opt.name}" 
                             style="background: ${opt.color};" data-correct="${opt.name === targetColor.name}">
                            ${opt.emoji}
                        </div>
                    `).join('')}
                </div>
            `;

            const items = gameArea.querySelectorAll('.game-item');
            items.forEach(item => {
                this.addTouchFeedback(item);
                item.addEventListener('click', () => {
                    const isCorrect = item.dataset.correct === 'true';
                    if (isCorrect) {
                        item.classList.add('correct');
                        this.score += 10;
                        this.updateScore();
                        this.showCelebration();
                        round++;
                        setTimeout(createRound, 1000);
                    } else {
                        item.classList.add('wrong');
                        this.score = Math.max(0, this.score - 5);
                        this.updateScore();
                        setTimeout(() => item.classList.remove('wrong'), 500);
                    }
                });
            });
        };

        createRound();
    }

    startShapeMatchGame() {
        document.getElementById('game-title').textContent = '⭐ 形状识别';
        const gameArea = document.getElementById('game-area');
        
        const shapes = [
            { name: '圆形', emoji: '⭕' },
            { name: '正方形', emoji: '⬜' },
            { name: '三角形', emoji: '🔺' },
            { name: '星形', emoji: '⭐' },
            { name: '爱心', emoji: '❤️' },
            { name: '月亮', emoji: '🌙' }
        ];

        let round = 0;
        const totalRounds = 5;

        const createRound = () => {
            if (round >= totalRounds) {
                gameArea.innerHTML = '<div class="game-instruction">🎉 太棒了！你完成了所有关卡！</div>';
                this.showCelebration();
                return;
            }

            const targetShape = shapes[Math.floor(Math.random() * shapes.length)];
            const options = [...shapes].sort(() => Math.random() - 0.5).slice(0, 4);
            if (!options.includes(targetShape)) {
                options[Math.floor(Math.random() * options.length)] = targetShape;
            }
            options.sort(() => Math.random() - 0.5);

            gameArea.innerHTML = `
                <div class="game-instruction">找到${targetShape.name}！</div>
                <div class="target-display">
                    ${targetShape.emoji}
                </div>
                <div class="items-grid">
                    ${options.map(opt => `
                        <div class="game-item shape-item" data-shape="${opt.name}" 
                             data-correct="${opt.name === targetShape.name}">
                            ${opt.emoji}
                        </div>
                    `).join('')}
                </div>
            `;

            const items = gameArea.querySelectorAll('.game-item');
            items.forEach(item => {
                this.addTouchFeedback(item);
                item.addEventListener('click', () => {
                    const isCorrect = item.dataset.correct === 'true';
                    if (isCorrect) {
                        item.classList.add('correct');
                        this.score += 10;
                        this.updateScore();
                        this.showCelebration();
                        round++;
                        setTimeout(createRound, 1000);
                    } else {
                        item.classList.add('wrong');
                        this.score = Math.max(0, this.score - 5);
                        this.updateScore();
                        setTimeout(() => item.classList.remove('wrong'), 500);
                    }
                });
            });
        };

        createRound();
    }

    startSimplePuzzleGame() {
        document.getElementById('game-title').textContent = '🧩 简单拼图';
        const gameArea = document.getElementById('game-area');
        
        const puzzles = [
            { emoji: '🐶', name: '小狗', options: ['🐱', '🐰', '🐼'] },
            { emoji: '🐱', name: '小猫', options: ['🐶', '🐰', '🐼'] },
            { emoji: '🐰', name: '小兔', options: ['🐶', '🐱', '🐼'] },
            { emoji: '🐼', name: '熊猫', options: ['🐶', '🐱', '🐰'] }
        ];

        let currentPuzzle = 0;

        const createPuzzle = () => {
            if (currentPuzzle >= puzzles.length) {
                gameArea.innerHTML = '<div class="game-instruction">🎉 太棒了！你完成了所有拼图！</div>';
                this.showCelebration();
                return;
            }

            const puzzle = puzzles[currentPuzzle];
            const allOptions = [...puzzle.options, puzzle.emoji].sort(() => Math.random() - 0.5);
            
            gameArea.innerHTML = `
                <div class="game-instruction">找到${puzzle.name}的拼图！</div>
                <div class="target-display">
                    ${puzzle.emoji}
                </div>
                <div class="puzzle-grid" style="grid-template-columns: repeat(2, 1fr); gap: 15px; max-width: 350px;">
                    ${allOptions.map((opt, index) => `
                        <div class="puzzle-piece" 
                             data-emoji="${opt}" 
                             data-correct="${opt === puzzle.emoji}">
                            ${opt}
                        </div>
                    `).join('')}
                </div>
            `;

            const pieces = gameArea.querySelectorAll('.puzzle-piece');
            pieces.forEach(piece => {
                this.addTouchFeedback(piece);
                piece.addEventListener('click', () => {
                    const isCorrect = piece.dataset.correct === 'true';
                    if (isCorrect) {
                        piece.classList.add('correct');
                        this.score += 10;
                        this.updateScore();
                        this.showCelebration();
                        setTimeout(() => {
                            currentPuzzle++;
                            createPuzzle();
                        }, 1000);
                    } else {
                        piece.classList.add('wrong');
                        this.score = Math.max(0, this.score - 5);
                        this.updateScore();
                        setTimeout(() => piece.classList.remove('wrong'), 500);
                    }
                });
            });
        };

        createPuzzle();
    }

    startNumberCountGame() {
        document.getElementById('game-title').textContent = '🔢 数字认知';
        const gameArea = document.getElementById('game-area');
        
        const emojis = ['🍎', '🌟', '🐟', '🌸', '🎈', '🦋'];
        let round = 0;
        const totalRounds = 5;

        const createRound = () => {
            if (round >= totalRounds) {
                gameArea.innerHTML = '<div class="game-instruction">🎉 太棒了！你完成了所有关卡！</div>';
                this.showCelebration();
                return;
            }

            const emoji = emojis[Math.floor(Math.random() * emojis.length)];
            const count = Math.floor(Math.random() * 5) + 1;
            const correctAnswer = count;
            const options = [correctAnswer, correctAnswer - 1, correctAnswer + 1, correctAnswer + 2]
                .filter(n => n >= 1 && n <= 10)
                .sort(() => Math.random() - 0.5)
                .slice(0, 4);

            const emojiString = emoji.repeat(count);

            gameArea.innerHTML = `
                <div class="game-instruction">数一数有多少个？</div>
                <div class="target-display" style="font-size: clamp(30px, 6vw, 50px);">
                    ${emojiString}
                </div>
                <div class="items-grid">
                    ${options.map(num => `
                        <div class="game-item number-item" data-number="${num}">
                            ${num}
                        </div>
                    `).join('')}
                </div>
            `;

            const items = gameArea.querySelectorAll('.game-item');
            items.forEach(item => {
                this.addTouchFeedback(item);
                item.addEventListener('click', () => {
                    const selectedNum = parseInt(item.dataset.number);
                    if (selectedNum === correctAnswer) {
                        item.classList.add('correct');
                        this.score += 10;
                        this.updateScore();
                        this.showCelebration();
                        round++;
                        setTimeout(createRound, 1000);
                    } else {
                        item.classList.add('wrong');
                        this.score = Math.max(0, this.score - 5);
                        this.updateScore();
                        setTimeout(() => item.classList.remove('wrong'), 500);
                    }
                });
            });
        };

        createRound();
    }

    startMemoryMatchGame() {
        document.getElementById('game-title').textContent = '🧠 记忆大师';
        const gameArea = document.getElementById('game-area');
        
        const memoryThemes = [
            {
                name: '水果',
                items: [
                    { emoji: '🍎', name: '苹果' },
                    { emoji: '🍌', name: '香蕉' },
                    { emoji: '🍇', name: '葡萄' },
                    { emoji: '🍊', name: '橘子' },
                    { emoji: '🍋', name: '柠檬' },
                    { emoji: '🍓', name: '草莓' }
                ]
            },
            {
                name: '车辆',
                items: [
                    { emoji: '🚗', name: '汽车' },
                    { emoji: '🚕', name: '出租车' },
                    { emoji: '🚙', name: '越野车' },
                    { emoji: '🚌', name: '公交车' },
                    { emoji: '🚎', name: '无轨电车' },
                    { emoji: '🚓', name: '警车' }
                ]
            },
            {
                name: '动物',
                items: [
                    { emoji: '🐶', name: '小狗' },
                    { emoji: '🐱', name: '小猫' },
                    { emoji: '🐰', name: '小兔' },
                    { emoji: '🐼', name: '熊猫' },
                    { emoji: '🐨', name: '考拉' },
                    { emoji: '🦁', name: '狮子' }
                ]
            }
        ];

        const difficultyLevels = [
            { name: '简单', cardCount: 3, displayTime: 5000 },
            { name: '中等', cardCount: 4, displayTime: 4000 },
            { name: '困难', cardCount: 6, displayTime: 3000 }
        ];

        let currentRound = 0;
        const totalRounds = 5;
        let currentDifficulty = 0;

        const createRound = () => {
            if (currentRound >= totalRounds) {
                gameArea.innerHTML = '<div class="game-instruction">🎉 太棒了！你完成了所有关卡！</div>';
                this.showCelebration();
                return;
            }

            const theme = memoryThemes[currentRound % memoryThemes.length];
            const difficulty = difficultyLevels[currentDifficulty];
            
            const shuffledItems = [...theme.items].sort(() => Math.random() - 0.5);
            const selectedItems = shuffledItems.slice(0, difficulty.cardCount);
            const targetItem = selectedItems[Math.floor(Math.random() * selectedItems.length)];

            gameArea.innerHTML = `
                <div class="game-instruction">
                    <div>主题: ${theme.name}</div>
                    <div>难度: ${difficulty.name}</div>
                    <div id="timer-display">准备开始...</div>
                </div>
                <div class="memory-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 15px; max-width: 500px; width: 100%;"></div>
                <div id="target-display" class="game-instruction" style="margin-top: 20px; font-size: clamp(18px, 4vw, 22px); display: none;">
                    请找到 ${targetItem.emoji} ${targetItem.name}
                </div>
            `;

            const memoryGrid = gameArea.querySelector('.memory-grid');
            const timerDisplay = document.getElementById('timer-display');
            const targetDisplay = document.getElementById('target-display');

            const cardElements = [];
            selectedItems.forEach((item, index) => {
                const card = document.createElement('div');
                card.className = 'memory-card';
                card.dataset.index = index;
                card.dataset.emoji = item.emoji;
                card.dataset.name = item.name;
                card.style.cssText = `
                    width: clamp(80px, 18vw, 120px);
                    height: clamp(80px, 18vw, 120px);
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 15px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: clamp(40px, 8vw, 60px);
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                    user-select: none;
                    -webkit-tap-highlight-color: transparent;
                    touch-action: manipulation;
                `;
                card.textContent = item.emoji;
                this.addTouchFeedback(card);
                memoryGrid.appendChild(card);
                cardElements.push(card);
            });

            let countdown = 3;
            timerDisplay.textContent = `${countdown} 秒后开始记忆`;

            const countdownInterval = setInterval(() => {
                countdown--;
                if (countdown > 0) {
                    timerDisplay.textContent = `${countdown} 秒后开始记忆`;
                } else {
                    clearInterval(countdownInterval);
                    startMemoryPhase();
                }
            }, 1000);

            const startMemoryPhase = () => {
                timerDisplay.textContent = '记住这些卡片！';
                
                let displayCount = difficulty.displayTime / 1000;
                const displayInterval = setInterval(() => {
                    displayCount--;
                    if (displayCount > 0) {
                        timerDisplay.textContent = `${displayCount} 秒`;
                    } else {
                        clearInterval(displayInterval);
                        hideCards();
                    }
                }, 1000);
            };

            const hideCards = () => {
                timerDisplay.textContent = '卡片已隐藏！';
                
                cardElements.forEach(card => {
                    card.style.background = '#e0e0e0';
                    card.textContent = '❓';
                });

                targetDisplay.style.display = 'block';
                
                cardElements.forEach(card => {
                    card.addEventListener('click', () => {
                        const isCorrect = card.dataset.emoji === targetItem.emoji;
                        
                        if (isCorrect) {
                            card.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
                            card.textContent = targetItem.emoji;
                            this.score += 10;
                            this.updateScore();
                            this.showCelebration();
                            
                            setTimeout(() => {
                                currentRound++;
                                if (currentRound % 3 === 0 && currentDifficulty < difficultyLevels.length - 1) {
                                    currentDifficulty++;
                                }
                                createRound();
                            }, 1500);
                        } else {
                            card.style.background = '#f44336';
                            setTimeout(() => {
                                card.style.background = '#e0e0e0';
                                card.textContent = '❓';
                            }, 500);
                            
                            this.score = Math.max(0, this.score - 5);
                            this.updateScore();
                        }
                    }, { once: true });
                });
            };
        };

        createRound();
    }
}