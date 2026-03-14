class Games {
    constructor() {
        this.score = 0;
        this.currentLevel = 1;
        this.currentGame = null;
        this.gameManager = null;
        this.gameMode = 'campaign';
        this.audioContext = null;
        this.difficultyManager = new DifficultyManager();
        this.roundStartTime = null;
        this.targetTime = null;
        this.aiCache = new AIGameCache();

        // 记忆游戏主题（10种）
        this.memoryThemes = [
            { name: '水果', items: ['🍎', '🍏', '🍊', '🍓', '🍋', '🍓', '🍑', '🍍', '🥝'] },
            { name: '蔬菜', items: ['🥕', '🥦', '🍆', '🥒', '🌽', '🥬', '🍅', '🥑', '🧄'] },
            { name: '车辆', items: ['🚗', '🚕', '🚙', '🚌', '🚎', '🚓', '🚒', '🏎️', '🛵'] },
            { name: '动物', items: ['🐶', '🐱', '🐰', '🐼', '🐨', '🦁', '🐯', '🐻', '🦊'] },
            { name: '运动', items: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏉', '🏐', '🏓', '🏸'] },
            { name: '天气', items: ['☀️', '⛅️', '🌤️', '🌧️', '⛈️', '🌈', '❄️', '🌊', '🌙'] },
            { name: '食物', items: ['🍕', '🍔', '🌭', '🍿', '🧂', '🥓', '🍳', '🥪', '🍣'] },
            { name: '花卉', items: ['🌹', '🌻', '🌷', '🌺', '🌼', '🌾', '🌿', '🍀', '🍁', '🍵'] },
            { name: '太空', items: ['🌍', '🌙', '⭐', '🚀', '🛸', '🌌', '🪐', '☄️', '👨🚀'] },
            { name: '音乐', items: ['🎵', '🎶', '🎸', '🎹', '🎺', '🎷', '🎻', '🎤', '📻', '🎼'] }
        ];

        // 动物声音配置（用于声音配对游戏）
        this.animalSoundConfig = {
            '🐶': { name: '小狗', freq: 400, duration: 0.3, pattern: 'bark' },
            '🐱': { name: '小猫', freq: 600, duration: 0.5, pattern: 'meow' },
            '🐑': { name: '小羊', freq: 200, duration: 0.4, pattern: 'moo' },
            '🦆': { name: '小鸭', freq: 350, duration: 0.35, pattern: 'quack' },
            '🐤': { name: '小鸡', freq: 500, duration: 0.3, pattern: 'crow' },
            '🐸': { name: '青蛙', freq: 200, duration: 0.2, pattern: 'croak' }
        };

        // 关卡配置（50关）
        this.levelConfig = this.generateLevelConfig();
    }

    generateLevelConfig() {
        const levels = [];
        for (let i = 1; i <= 50; i++) {
            let cardCount, displayTime, scoreMultiplier;
            
            if (i <= 10) {
                cardCount = 3;
                displayTime = 6000 - (i * 200);
                scoreMultiplier = 1.0;
            } else if (i <= 25) {
                cardCount = 4;
                displayTime = 5000 - ((i - 10) * 150);
                scoreMultiplier = 1.2;
            } else if (i <= 40) {
                cardCount = 6;
                displayTime = 4000 - ((i - 25) * 100);
                scoreMultiplier = 1.5;
            } else {
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

    // ==================== 音频管理 ====================
    
    getAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this.audioContext;
    }

    async resumeAudioContext() {
        const ctx = this.getAudioContext();
        if (ctx.state === 'suspended') {
            try {
                await ctx.resume();
            } catch (error) {
                console.error('激活 AudioContext 失败:', error);
            }
        }
        return ctx;
    }

    playAnimalSound(emoji) {
        const config = this.animalSoundConfig[emoji];
        if (!config) return;

        const audio = this.getAudioContext();
        const osc = audio.createOscillator();
        const gain = audio.createGain();

        osc.connect(gain);
        gain.connect(audio.destination);

        switch(config.pattern) {
            case 'bark':
                this.playBark(audio, osc, gain, config);
                break;
            case 'meow':
                this.playMeow(audio, osc, gain, config);
                break;
            case 'moo':
                this.playMoo(audio, osc, gain, config);
                break;
            case 'quack':
                this.playQuack(audio, osc, gain, config);
                break;
            case 'crow':
                this.playCrow(audio, osc, gain, config);
                break;
            case 'croak':
                this.playCroak(audio, osc, gain, config);
                break;
        }
    }

    playBark(audio, osc, gain, config) {
        osc.type = 'square';
        gain.gain.setValueAtTime(0.3, audio.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audio.currentTime + config.duration);
        
        osc.frequency.setValueAtTime(config.freq, audio.currentTime);
        osc.frequency.setValueAtTime(config.freq * 0.8, audio.currentTime + 0.1);
        
        osc.start(audio.currentTime);
        osc.stop(audio.currentTime + config.duration);
    }

    playMeow(audio, osc, gain, config) {
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, audio.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audio.currentTime + config.duration);
        
        osc.frequency.setValueAtTime(config.freq * 0.7, audio.currentTime);
        osc.frequency.linearRampToValueAtTime(config.freq * 1.2, audio.currentTime + config.duration * 0.5);
        osc.frequency.linearRampToValueAtTime(config.freq * 0.8, audio.currentTime + config.duration);
        
        osc.start(audio.currentTime);
        osc.stop(audio.currentTime + config.duration);
    }

    playMoo(audio, osc, gain, config) {
        osc.type = 'sawtooth';
        gain.gain.setValueAtTime(0.2, audio.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audio.currentTime + config.duration);
        
        osc.frequency.setValueAtTime(config.freq, audio.currentTime);
        
        osc.start(audio.currentTime);
        osc.stop(audio.currentTime + config.duration);
    }

    playQuack(audio, osc, gain, config) {
        osc.type = 'square';
        for (let i = 0; i < 2; i++) {
            gain.gain.setValueAtTime(0.3, audio.currentTime + i * 0.2);
            gain.gain.exponentialRampToValueAtTime(0.01, audio.currentTime + i * 0.2 + 0.15);
            
            osc.frequency.setValueAtTime(config.freq, audio.currentTime + i * 0.2);
            osc.frequency.setValueAtTime(config.freq * 0.9, audio.currentTime + i * 0.2 + 0.2);
        }
        
        osc.start(audio.currentTime);
        osc.stop(audio.currentTime + 0.35);
    }

    playCrow(audio, osc, gain, config) {
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, audio.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audio.currentTime + config.duration);
        
        osc.frequency.setValueAtTime(config.freq * 0.5, audio.currentTime);
        osc.frequency.linearRampToValueAtTime(config.freq * 1.5, audio.currentTime + config.duration * 0.3);
        osc.frequency.linearRampToValueAtTime(config.freq * 1.2, audio.currentTime + config.duration * 0.5);
        
        osc.start(audio.currentTime);
        osc.stop(audio.currentTime + config.duration);
    }

    playCroak(audio, osc, gain, config) {
        osc.type = 'sine';
        for (let i = 0; i < 3; i++) {
            gain.gain.setValueAtTime(0.3, audio.currentTime + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, audio.currentTime + i * 0.15 + 0.1);
        }
        
        osc.frequency.setValueAtTime(config.freq, audio.currentTime);
        osc.frequency.setValueAtTime(config.freq * 1.5, audio.currentTime + 0.15);
        osc.frequency.setValueAtTime(config.freq * 2, audio.currentTime + 0.3);
        
        osc.start(audio.currentTime);
        osc.stop(audio.currentTime + 0.45);
    }

    // ==================== 核心修改：解决无限递归问题 ====================
    // 原来的代码在这里递归调用了自己，导致浏览器崩溃或卡死
    
    async startGame(gameType, mode = 'campaign', currentLevel = 1) {
        //1. 初始化游戏状态
        this.score = 0;
        this.gameMode = mode;
        this.currentLevel = mode === 'endless' ?1 : currentLevel;
        this.currentGame = gameType;
        
        // 2. 清空游戏区域
        const gameArea = document.getElementById('game-area');
        if (!gameArea) {
            console.error('Game area element not found!');
            return;
        }
        gameArea.innerHTML = '';
        
        // 3. 更新 UI
        const levelDisplay = document.getElementById('level-display');
        if (levelDisplay) {
            levelDisplay.textContent = `关卡: ${this.currentLevel}`;
        }

        const gameNames = {
            'color-match': '🎨 颜色配对',
            'shape-match': '⭐ 形状识别',
            'simple-puzzle': '🧩 简单拼图',
            'number-count': '🔢 数字认知',
            'memory-match': '🧠 记忆大师',
            'letter-match': '🔤 字母配对',
            'sound-match': '🔊 声音配对',
            'size-compare': '🐘🐭 大小比较',
            'drag-drop': '🎯 简单拖放',
            'emotion-match': '😊😢 情感识别',
            'touch-draw': '🎨 触摸画画',
            'music-rhythm': '🎵 音乐节奏'
        };

        const titleElement = document.getElementById('game-title');
        if (titleElement) {
            titleElement.textContent = gameNames[gameType] || gameType;
        }

        switch (gameType) {
            case 'color-match':
                if (mode === 'endless') {
                    this.startColorMatchEndless();
                } else {
                    this.startColorMatchGame();
                }
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
                if (mode === 'endless') {
                    this.startMemoryMatchEndless();
                } else {
                    await this.startMemoryMatchGame();
                }
                break;
            case 'letter-match':
                if (mode === 'endless') {
                    this.startLetterMatchEndless();
                } else {
                    await this.startLetterMatchGame();
                }
                break;
            case 'sound-match':
                if (mode === 'endless') {
                    this.startSoundMatchEndless();
                } else {
                    this.startSoundMatchGame();
                }
                break;
            case 'size-compare':
                if (mode === 'endless') {
                    this.startSizeCompareEndless();
                } else {
                    this.startSizeCompareGame();
                }
                break;
            case 'drag-drop':
                if (mode === 'endless') {
                    this.startDragDropEndless();
                } else {
                    this.startDragDropGame();
                }
                break;
            case 'emotion-match':
                if (mode === 'endless') {
                    this.startEmotionMatchEndless();
                } else {
                    this.startEmotionMatchGame();
                }
                break;
            case 'touch-draw':
                this.startTouchDrawGame();
                break;
            case 'music-rhythm':
                if (mode === 'endless') {
                    this.startMusicRhythmEndless();
                } else {
                    this.startMusicRhythmGame();
                }
                break;
            default:
                console.error(`❌ 未知游戏类型: ${gameType}`);
                gameArea.innerHTML = '<div class="error">❌ 错误：未知游戏类型</div>';
                return;
        }
        
        // 5. 更新分数
        this.updateScore();
        
        // Game initialization completed
    }
    // ==================== 修复结束 ====================

    updateScore() {
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.textContent = `得分: ${this.score}`;
        }
    }

    showCelebration() {
        const celebration = document.createElement('div');
        celebration.className = 'celebration';
        celebration.textContent = '🎉';
        celebration.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 100px;
            z-index: 9999;
            animation: popIn 0.5s ease;
        `;
        document.body.appendChild(celebration);
        setTimeout(() => celebration.remove(), 1000);
    }

    startRoundTimer(targetTimeMs) {
        this.roundStartTime = Date.now();
        this.targetTime = targetTimeMs;
    }

    recordPerformance(isCorrect) {
        if (!this.roundStartTime || !this.gameManager) return;

        const responseTime = Date.now() - this.roundStartTime;
        const userStorage = new UserStorage();
        const userId = userStorage.getCurrentUserId();

        if (userId && this.currentGame) {
            const adjustment = this.difficultyManager.recordPerformance(userId, this.currentGame, {
                level: this.currentLevel,
                isCorrect,
                responseTime,
                targetTime: this.targetTime || 3000,
                score: this.score
            });

            if (adjustment.shouldAdjust) {
                this.showDifficultyAdjustment(adjustment);
            }
        }

        this.roundStartTime = null;
    }

    showDifficultyAdjustment(adjustment) {
        const message = this.difficultyManager.generateAdjustmentMessage(adjustment);
        if (!message) return;

        const notification = document.createElement('div');
        notification.className = 'difficulty-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px 30px;
            border-radius: 15px;
            font-size: clamp(16px, 4vw, 20px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            z-index: 10000;
            text-align: center;
            animation: slideDown 0.5s ease;
        `;
        notification.innerHTML = `
            <div style="font-size: 40px; margin-bottom: 10px;">${message.emoji}</div>
            <div>${message.message}</div>
        `;

        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.animation = 'slideUp 0.5s ease';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    getRecommendedLevel(gameId) {
        const userStorage = new UserStorage();
        const userId = userStorage.getCurrentUserId();
        return this.difficultyManager.getRecommendedLevel(userId, gameId);
    }

    saveProgress(gameId, progressData) {
        if (this.gameManager) {
            return this.gameManager.saveProgress(gameId, progressData);
        }
        return false;
    }

    loadProgress(gameId) {
        if (this.gameManager) {
            return this.gameManager.loadProgress(gameId);
        }
        return null;
    }

    recordLevelComplete(gameId, level) {
        if (this.gameManager) {
            return this.gameManager.recordLevelComplete(gameId, level);
        }
        return false;
    }

    async getCurrentLevel(gameId) {
        const progress = await this.loadProgress(gameId);
        return progress ? progress.currentLevel : 1;
    }

    async getCompletedLevels(gameId) {
        const progress = await this.loadProgress(gameId);
        return progress ? progress.completedLevels : [];
    }

    // ==================== 具体游戏方法 ====================

    startColorMatchGame() {
        document.getElementById('game-title').textContent = '🎨 颜色配对';
        const gameArea = document.getElementById('game-area');
        
        const colors = [
            { name: '红色', color: '#e74c3c', emoji: '🍎' },
            { name: '蓝色', color: '#3498db', emoji: '🫐' },
            { name: '绿色', color: '#2ecc71', emoji: '🍀' },
            { name: '黄色', color: '#f1c40f', emoji: '🌻' },
            { name: '紫色', color: '#9b59b6', emoji: '🍇' }
        ];

        let round = 0;
        const totalRounds = 5;

        const createRound = () => {
            if (round >= totalRounds) {
                gameArea.innerHTML = '<div class="game-instruction">🎉 太棒了！你完成了所有关卡！</div>';
                this.showCelebration();
                this.recordLevelComplete('color-match', round);
                return;
            }

            const targetColor = colors[Math.floor(Math.random() * colors.length)];
            const options = [...colors].sort(() => Math.random() - 0.5).slice(0, 4);
            if (!options.includes(targetColor)) {
                options[Math.floor(Math.random() * options.length)] = targetColor;
            }
            options.sort(() => Math.random() - 0.5);

            // 使用安全的DOM创建方式避免XSS
            const instructionDiv = document.createElement('div');
            instructionDiv.className = 'game-instruction';
            instructionDiv.textContent = `找到${targetColor.name}的颜色！`;
            
            const targetDisplay = document.createElement('div');
            targetDisplay.className = 'target-display';
            targetDisplay.style.background = targetColor.color;
            
            const targetEmoji = document.createElement('div');
            targetEmoji.textContent = targetColor.emoji;
            targetDisplay.appendChild(targetEmoji);
            
            gameArea.appendChild(instructionDiv);
            gameArea.appendChild(targetDisplay);
            
            const itemsGrid = document.createElement('div');
            itemsGrid.className = 'items-grid';
            
            options.forEach(opt => {
                const item = document.createElement('div');
                item.className = 'game-item color-item';
                item.dataset.color = opt.name;
                item.style.background = opt.color;
                item.dataset.correct = opt.name === targetColor.name;
                
                const emoji = document.createElement('div');
                emoji.textContent = opt.emoji;
                item.appendChild(emoji);
                
                const name = document.createElement('div');
                name.className = 'animal-name';
                name.textContent = opt.name;
                item.appendChild(name);
                
                itemsGrid.appendChild(item);
            });
            
            gameArea.appendChild(itemsGrid);

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
                        this.recordLevelComplete('color-match', round);
                        setTimeout(() => {
                            round++;
                            createRound();
                        }, 1000);
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

        let shapes = [
            { name: '圆形', emoji: '⭕' },
            { name: '正方形', emoji: '⬜' },
            { name: '三角形', emoji: '🔺' },
            { name: '星形', emoji: '⭐' },
            { name: '爱心', emoji: '❤️' }
        ];

        const aiGameData = this.aiCache.getLatestGame('shape');
        if (aiGameData && aiGameData.shapes && aiGameData.shapes.length >= 4) {
            shapes = aiGameData.shapes;
        }

        let round = 0;
        const totalRounds = 5;

        const createRound = () => {
            if (round >= totalRounds) {
                gameArea.innerHTML = '<div class="game-instruction">🎉 太棒了！你完成了所有关卡！</div>';
                this.showCelebration();
                this.recordLevelComplete('shape-match', round);
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
                        this.recordLevelComplete('shape-match', round);
                        setTimeout(() => {
                            round++;
                            createRound();
                        }, 1000);
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
            { emoji: '🐶', name: '小狗', options: ['🐱', '🐰', '🐼', '🐨', '🐯', '🐻', '🦊'] },
            { emoji: '🐱', name: '小猫', options: ['🐶', '🐰', '🐼', '🐨', '🐯', '🐻', '🦊'] },
            { emoji: '🐰', name: '小兔', options: ['🐶', '🐱', '🐼', '🐨', '🐯', '🐻', '🦊'] },
            { emoji: '🐼', name: '熊猫', options: ['🐶', '🐱', '🐰', '🐨', '🐯', '🐻', '🦊'] }
        ];

        let currentPuzzle = 0;

        const createPuzzle = () => {
            if (currentPuzzle >= puzzles.length) {
                gameArea.innerHTML = '<div class="game-instruction">🎉 太棒了！你完成了所有拼图！</div>';
                this.showCelebration();
                this.recordLevelComplete('simple-puzzle', currentPuzzle);
                return;
            }

            const puzzle = puzzles[currentPuzzle];
            const allOptions = [...puzzle.options, puzzle.emoji].sort(() => Math.random() - 0.5);
            const correctOption = puzzle.emoji;

            gameArea.innerHTML = `
                <div class="game-instruction">找到${puzzle.name}的拼图！</div>
                <div class="target-display">
                    ${puzzle.emoji}
                </div>
                <div class="puzzle-grid">
                    ${allOptions.map(opt => `
                        <div class="puzzle-piece" data-option="${opt}" 
                             data-correct="${opt === correctOption}">
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
                        piece.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
                        this.score += 10;
                        this.updateScore();
                        this.showCelebration();
                        
                        setTimeout(() => {
                            currentPuzzle++;
                            createPuzzle();
                        }, 1000);
                    } else {
                        piece.classList.add('wrong');
                        piece.style.background = '#f44336';
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
        
        const emojis = ['🍎', '🌟', '🐟', '🌸', '🎈', '🦋', '🦋'];
        let round = 0;
        const totalRounds = 5;

        const createRound = () => {
            if (round >= totalRounds) {
                gameArea.innerHTML = '<div class="game-instruction">🎉 太棒了！你完成了所有关卡！</div>';
                this.showCelebration();
                this.recordLevelComplete('number-count', round);
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
                        this.recordLevelComplete('number-count', round);
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

    async startMemoryMatchGame() {
        document.getElementById('game-title').textContent = '🧠 记忆大师';
        const gameArea = document.getElementById('game-area');

        const currentLevel = await this.getCurrentLevel('memory-match');
        const levelConfig = this.levelConfig[currentLevel -1] || this.levelConfig[0];

        let aiGameData = this.aiCache.getLatestGame('memory');
        let theme;
        if (aiGameData && aiGameData.emojis && aiGameData.emojis.length >= 3) {
            theme = {
                name: aiGameData.theme || 'AI 题目',
                items: aiGameData.emojis
            };
        } else {
            const themeIndex = (currentLevel - 1) % this.memoryThemes.length;
            theme = this.memoryThemes[themeIndex];
        }

        let currentRound = 0;
        const roundsPerLevel = Math.min(5, 2 + Math.floor((currentLevel - 1) / 5));

        const createRound = () => {
            if (currentRound >= roundsPerLevel) {
                const nextLevel = currentLevel + 1;
                if (nextLevel > 50) {
                    gameArea.innerHTML = '<div class="game-instruction">🏆 恭喜过关！</div>';
                    this.showCelebration();
                    this.recordLevelComplete('memory-match', this.currentLevel);
                    
                    if (nextLevel > 50) {
                        gameArea.innerHTML = '<div class="game-instruction">🏆 太棒了！你完成了所有50关！</div>';
                        this.showCelebration();
                        return;
                    }
                }
                
                // 下一关
                setTimeout(async () => {
                    this.currentLevel = nextLevel;
                    await this.startMemoryMatchGame();
                }, 1500);
                return;
            }

            const theme = this.memoryThemes[currentRound % this.memoryThemes.length];
            const difficulty = this.levelConfig[currentLevel - 1] || this.levelConfig[0];

            const shuffledItems = [...theme.items].sort(() => Math.random() - 0.5);
            const selectedItems = shuffledItems.slice(0, difficulty.cardCount);
            const targetItem = selectedItems[Math.floor(Math.random() * selectedItems.length)];
            const points = Math.round(10 * difficulty.scoreMultiplier);

            gameArea.innerHTML = `
                <div class="game-instruction">
                    <div>关卡: ${this.currentLevel}/50</div>
                    <div>主题: ${theme.name}</div>
                    <div>难度: ${difficulty.name}</div>
                    <div>得分: ${points}分</div>
                    <div id="timer-display">准备开始...</div>
                </div>
                <div class="memory-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 15px; max-width: 500px; width: 100%;"></div>
                <div id="target-display" class="memory-target" style="display: none;">
                    <div class="memory-target-content">
                        <div class="memory-target-instruction">请找到</div>
                        <div class="memory-target-emoji" style="font-size: clamp(60px, 12vw, 100px);">
                            ${targetItem}
                        </div>
                    </div>
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
                card.dataset.emoji = item;
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
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                    user-select: none;
                    -webkit-tap-highlight-color: transparent;
                    touch-action: manipulation;
                    -webkit-touch-callout: none;
                `;
                card.textContent = item;
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

                let displayCount = levelConfig.displayTime / 1000;
                const displayInterval = setInterval(() => {
                    displayCount--;
                    if (displayCount > 0) {
                        timerDisplay.textContent = `${displayCount.toFixed(1)} 秒`;
                    } else {
                        clearInterval(displayInterval);
                        hideCards();
                    }
                }, 100);
            };

            const hideCards = () => {
                timerDisplay.textContent = '卡片已隐藏！';

                cardElements.forEach(card => {
                    card.style.background = '#e0e0e0';
                    card.textContent = '❓';
                });

                targetDisplay.style.display = 'block';
                targetDisplay.classList.add('active');

                this.startRoundTimer(levelConfig.displayTime);

                cardElements.forEach(card => {
                    card.addEventListener('click', () => {
                        const isCorrect = card.dataset.emoji === targetItem;

                        if (isCorrect) {
                            card.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
                            card.textContent = targetItem;
                            card.style.transform = 'scale(1.2)';
                            this.score += points;
                            this.updateScore();
                            this.showCelebration();
                            this.recordPerformance(true);

                            setTimeout(() => {
                                this.recordLevelComplete('memory-match', this.currentLevel);

                                currentRound++;
                                createRound();
                            }, 1500);
                        } else {
                            card.style.background = '#f44336';
                            card.style.transform = 'scale(0.9)';
                            this.recordPerformance(false);

                            setTimeout(() => {
                                card.style.background = '#e0e0e0';
                                card.textContent = '❓';
                                card.style.transform = 'scale(1)';
                            }, 500);

                            this.score = Math.max(0, this.score - Math.round(5 * levelConfig.scoreMultiplier));
                            this.updateScore();
                        }
                    }, { once: true });
                });
            };
        };

        createRound();
    }

    async startLetterMatchGame() {
        document.getElementById('game-title').textContent = '🔤 字母配对';
        const gameArea = document.getElementById('game-area');

        const letters = [
            { upper: 'A', lower: 'a' },
            { upper: 'B', lower: 'b' },
            { upper: 'C', lower: 'c' },
            { upper: 'D', lower: 'd' },
            { upper: 'E', lower: 'e' },
            { upper: 'F', lower: 'f' },
            { upper: 'G', lower: 'g' },
            { upper: 'H', lower: 'h' },
            { upper: 'I', lower: 'i' },
            { upper: 'J', lower: 'j' },
            { upper: 'K', lower: 'k' },
            { upper: 'L', lower: 'l' },
            { upper: 'M', lower: 'm' },
            { upper: 'N', lower: 'n' },
            { upper: 'O', lower: 'o' },
            { upper: 'P', lower: 'p' },
            { upper: 'Q', lower: 'q' },
            { upper: 'R', lower: 'r' },
            { upper: 'S', lower: 's' },
            { upper: 'T', lower: 't' },
            { upper: 'U', lower: 'u' },
            { upper: 'V', lower: 'v' },
            { upper: 'W', lower: 'w' },
            { upper: 'X', lower: 'x' },
            { upper: 'Y', lower: 'y' },
            { upper: 'Z', lower: 'z' }
        ];

        const currentLevel = await this.getCurrentLevel('letter-match');
        let round = 0;
        const roundsPerLevel = Math.min(5, 2 + Math.floor((currentLevel - 1) / 5));
        
        const createRound = () => {
            if (round >= roundsPerLevel) {
                const nextLevel = currentLevel + 1;
                
                gameArea.innerHTML = '<div class="game-instruction">🎉 恭喜过关！</div>';
                this.showCelebration();
                this.recordLevelComplete('letter-match', currentLevel);
                
                setTimeout(async () => {
                    const nextLevel = this.currentLevel + 1;
                    this.currentLevel = nextLevel;
                    await this.startLetterMatchGame();
                }, 2000);
                return;
            }

            const cardCount = Math.min(4, 2 + Math.floor((currentLevel - 1) / 10));
            const shuffledLetters = [...letters].sort(() => Math.random() - 0.5);
            const selectedLetters = shuffledLetters.slice(0, cardCount);

            gameArea.innerHTML = `
                <div class="game-instruction">
                    <div>关卡: ${this.currentLevel}</div>
                    <div class="instruction-text">找到 ${shuffledLetters[0].upper} 的写</div>
                </div>
                <div class="target-display">
                    <div class="target-emoji">${shuffledLetters[0].upper}</div>
                    <div class="instruction-text">请找到 ${shuffledLetters[0].lower} 的写</div>
                </div>
                <div class="items-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 15px; max-width: 400px;">
                    ${shuffledLetters.map(letter => `
                        <div class="game-item letter-item" data-letter="${letter.lower}" data-correct="${letter.upper === shuffledLetters[0].upper}">
                            ${letter.lower}
                        </div>
                    `).join('')}
                </div>
            `;

            const items = gameArea.querySelectorAll('.game-item');
            items.forEach(item => {
                this.addTouchFeedback(item);
                item.addEventListener('click', () => {
                    const selectedNum = item.dataset.letter;
                    const isCorrect = item.dataset.correct === 'true';
                    const points = 10;
                    
                    if (isCorrect) {
                        item.classList.add('correct');
                        item.style.animation = 'correctAnswer 0.6s ease';
                        this.score += points;
                        this.updateScore();
                        this.showCelebration();
                        round++;
                        setTimeout(createRound, 1000);
                    } else {
                        item.classList.add('wrong');
                        item.style.animation = 'wrongAnswer 0.5s ease';
                        this.score = Math.max(0, this.score - Math.round(5 * 0.5));
                        this.updateScore();
                        setTimeout(() => {
                            item.classList.remove('wrong');
                        }, 500);
                    }
                });
            });
        };

        createRound();
    }

    // ==================== 声音配对游戏 ====================
    
    /**
     * 启动声音配对游戏
     * @description 初始化并运行声音配对游戏，让小朋友通过听动物声音找出对应动物
     */
    startSoundMatchGame() {
        document.getElementById('game-title').textContent = '🔊 声音配对';
        const gameArea = document.getElementById('game-area');

        let animalSounds = [
            { name: '小狗', emoji: '🐶', text: '小狗怎么叫？' },
            { name: '小猫', emoji: '🐱', text: '小猫怎么叫？' },
            { name: '小羊', emoji: '🐑', text: '小羊怎么叫？' },
            { name: '小鸭', emoji: '🦆', text: '小鸭怎么叫？' },
            { name: '小鸡', emoji: '🐤', text: '小鸡怎么叫？' },
            { name: '青蛙', emoji: '🐸', text: '青蛙怎么叫？' }
        ];

        const aiGameData = this.aiCache.getLatestGame('sound');
        if (aiGameData && aiGameData.animals && aiGameData.animals.length >= 4) {
            animalSounds = aiGameData.animals.map(animal => ({
                name: animal.name,
                emoji: animal.emoji,
                text: `${animal.name}怎么叫？`
            }));
        }

        let round = 0;
        const totalRounds = 5;

        const createRound = () => {
            if (round >= totalRounds) {
                gameArea.innerHTML = '<div class="game-instruction">🎉 太棒了！你完成了所有关卡！</div>';
                this.showCelebration();
                this.recordLevelComplete('sound-match', round);
                return;
            }

            const targetAnimal = animalSounds[Math.floor(Math.random() * animalSounds.length)];
            const options = [...animalSounds].sort(() => Math.random() - 0.5).slice(0, 4);
            if (!options.includes(targetAnimal)) {
                options[Math.floor(Math.random() * options.length)] = targetAnimal;
            }
            options.sort(() => Math.random() - 0.5);

            gameArea.innerHTML = `
                <div class="game-instruction">${targetAnimal.text}</div>
                <div class="sound-player" id="sound-player">
                    <div class="sound-icon">🔊</div>
                    <div class="sound-text">点击听声音</div>
                </div>
                <div class="items-grid">
                    ${options.map(opt => `
                        <div class="game-item sound-item" data-animal="${opt.name}"
                             data-correct="${opt.name === targetAnimal.name}">
                            <div class="animal-emoji">${opt.emoji}</div>
                            <div class="animal-name">${opt.name}</div>
                        </div>
                    `).join('')}
                </div>
            `;

            // 设置声音播放器
            const soundPlayer = document.getElementById('sound-player');
            this.addTouchFeedback(soundPlayer);

            soundPlayer.addEventListener('click', async () => {
                soundPlayer.classList.add('playing');

                try {
                    await this.resumeAudioContext();
                    this.playAnimalSound(targetAnimal.emoji);
                } catch (error) {
                    console.error('播放声音失败:', error);
                }

                setTimeout(() => {
                    soundPlayer.classList.remove('playing');
                }, 1000);
            });

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
                        this.recordLevelComplete('sound-match', round);
                        setTimeout(() => {
                            round++;
                            createRound();
                        }, 1500);
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

    // ==================== 大小比较游戏 ====================
    
    /**
     * 启动大小比较游戏
     * @description 初始化并运行大小比较游戏，帮助3岁小朋友理解"大"和"小"的概念
     */
    startSizeCompareGame() {
        document.getElementById('game-title').textContent = '🐘🐭 大小比较';
        const gameArea = document.getElementById('game-area');
        
        const items = [
            { big: { emoji: '🐘', name: '大象' }, small: { emoji: '🐭', name: '老鼠' } },
            { big: { emoji: '🌳', name: '大树' }, small: { emoji: '🌱', name: '小树' } },
            { big: { emoji: '🏠', name: '大房子' }, small: { emoji: '🏚️', name: '小房子' } },
            { big: { emoji: '🚗', name: '大汽车' }, small: { emoji: '🚲', name: '小自行车' } },
            { big: { emoji: '🍉', name: '大西瓜' }, small: { emoji: '🍓', name: '小草莓' } }
        ];

        let round = 0;
        const totalRounds = 5;

        const createRound = () => {
            if (round >= totalRounds) {
                gameArea.innerHTML = '<div class="game-instruction">🎉 太棒了！你完成了所有关卡！</div>';
                this.showCelebration();
                this.recordLevelComplete('size-compare', round);
                return;
            }

            const currentItem = items[Math.floor(Math.random() * items.length)];
            const question = Math.random() > 0.5 ? 'big' : 'small';
            const targetSize = question === 'big' ? '大' : '小';
            const targetItem = currentItem[question];

            gameArea.innerHTML = `
                <div class="game-instruction">请找出${targetSize}${targetItem.name}！</div>
                <div class="size-comparison">
                    <div class="size-item big-size">
                        <div class="size-emoji big-emoji">${currentItem.big.emoji}</div>
                        <div class="size-label">大</div>
                    </div>
                    <div class="size-vs">VS</div>
                    <div class="size-item small-size">
                        <div class="size-emoji small-emoji">${currentItem.small.emoji}</div>
                        <div class="size-label">小</div>
                    </div>
                </div>
                <div class="items-grid">
                    <div class="game-item size-item-option" data-size="big" 
                         data-correct="${question === 'big'}">
                        <div class="size-emoji-option big-emoji-option">${currentItem.big.emoji}</div>
                        <div class="size-label-option">大</div>
                    </div>
                    <div class="game-item size-item-option" data-size="small" 
                         data-correct="${question === 'small'}">
                        <div class="size-emoji-option small-emoji-option">${currentItem.small.emoji}</div>
                        <div class="size-label-option">小</div>
                    </div>
                </div>
            `;

            const sizeOptions = gameArea.querySelectorAll('.size-item-option');
            sizeOptions.forEach(item => {
                this.addTouchFeedback(item);
                item.addEventListener('click', () => {
                    const isCorrect = item.dataset.correct === 'true';
                    if (isCorrect) {
                        item.classList.add('correct');
                        this.score += 10;
                        this.updateScore();
                        this.showCelebration();
                        this.recordLevelComplete('size-compare', round);
                        setTimeout(() => {
                            round++;
                            createRound();
                        }, 1500);
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

    // ==================== 简单拖放游戏 ====================
    
    /**
     * 启动简单拖放游戏
     * @description 初始化并运行拖放游戏，让小朋友将物品拖放到正确的分类中
     */
    startDragDropGame() {
        document.getElementById('game-title').textContent = '🎯 简单拖放';
        const gameArea = document.getElementById('game-area');
        
        const dragGames = [
            { 
                items: [
                    { emoji: '🍎', name: '苹果', target: 'fruits' },
                    { emoji: '🍌', name: '香蕉', target: 'fruits' },
                    { emoji: '🚗', name: '汽车', target: 'vehicles' },
                    { emoji: '✈️', name: '飞机', target: 'vehicles' }
                ],
                targets: [
                    { id: 'fruits', label: '水果', emoji: '🍎' },
                    { id: 'vehicles', label: '交通工具', emoji: '🚗' }
                ]
            },
            {
                items: [
                    { emoji: '🐶', name: '小狗', target: 'animals' },
                    { emoji: '🐱', name: '小猫', target: 'animals' },
                    { emoji: '🌸', name: '花朵', target: 'plants' },
                    { emoji: '🌳', name: '大树', target: 'plants' }
                ],
                targets: [
                    { id: 'animals', label: '动物', emoji: '🐶' },
                    { id: 'plants', label: '植物', emoji: '🌸' }
                ]
            }
        ];

        let round = 0;
        const totalRounds = 2;

        const createRound = () => {
            if (round >= totalRounds) {
                gameArea.innerHTML = '<div class="game-instruction">🎉 太棒了！你完成了所有关卡！</div>';
                this.showCelebration();
                this.recordLevelComplete('drag-drop', round);
                return;
            }

            const currentGame = dragGames[round];
            const shuffledItems = [...currentGame.items].sort(() => Math.random() - 0.5);
            let placedItems = 0;

            gameArea.innerHTML = `
                <div class="game-instruction">把物品拖到正确的位置！</div>
                <div class="drag-drop-area">
                    <div class="items-area">
                        <div class="items-container">
                            ${shuffledItems.map((item, index) => `
                                <div class="draggable-item" draggable="true" 
                                     data-item='${JSON.stringify(item)}' data-index="${index}">
                                    <div class="item-emoji">${item.emoji}</div>
                                    <div class="item-name">${item.name}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="targets-area">
                        ${currentGame.targets.map(target => `
                            <div class="drop-target" data-target="${target.id}">
                                <div class="target-emoji">${target.emoji}</div>
                                <div class="target-label">${target.label}</div>
                                <div class="target-items"></div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;

            // 拖放功能实现
            const draggables = gameArea.querySelectorAll('.draggable-item');
            const dropTargets = gameArea.querySelectorAll('.drop-target');
            
            draggables.forEach(draggable => {
                this.addTouchFeedback(draggable);
                
                draggable.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', draggable.dataset.item);
                    draggable.classList.add('dragging');
                });

                draggable.addEventListener('dragend', () => {
                    draggable.classList.remove('dragging');
                });

                // 触摸设备支持
                draggable.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    const touch = e.touches[0];
                    const clone = draggable.cloneNode(true);
                    clone.style.position = 'fixed';
                    clone.style.pointerEvents = 'none';
                    clone.style.zIndex = '1000';
                    clone.style.opacity = '0.7';
                    document.body.appendChild(clone);
                    
                    const moveTouch = (e) => {
                        const touch = e.touches[0];
                        clone.style.left = touch.clientX - 50 + 'px';
                        clone.style.top = touch.clientY - 50 + 'px';
                    };
                    
                    const endTouch = (e) => {
                        clone.remove();
                        document.removeEventListener('touchmove', moveTouch);
                        document.removeEventListener('touchend', endTouch);
                        
                        const touch = e.changedTouches[0];
                        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
                        const dropTarget = elementBelow?.closest('.drop-target');
                        
                        if (dropTarget) {
                            const item = JSON.parse(draggable.dataset.item);
                            if (item.target === dropTarget.dataset.target) {
                                handleCorrectDrop(draggable, dropTarget, item);
                            } else {
                                handleWrongDrop(draggable);
                            }
                        }
                    };
                    
                    document.addEventListener('touchmove', moveTouch);
                    document.addEventListener('touchend', endTouch);
                });
            });

            dropTargets.forEach(target => {
                target.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    target.classList.add('drag-over');
                });

                target.addEventListener('dragleave', () => {
                    target.classList.remove('drag-over');
                });

                target.addEventListener('drop', (e) => {
                    e.preventDefault();
                    target.classList.remove('drag-over');
                    
                    const itemData = e.dataTransfer.getData('text/plain');
                    const item = JSON.parse(itemData);
                    const draggable = document.querySelector(`[data-item='${itemData}']`);
                    
                    if (item.target === target.dataset.target) {
                        handleCorrectDrop(draggable, target, item);
                    } else {
                        handleWrongDrop(draggable);
                    }
                });
            });

            const handleCorrectDrop = (draggable, target, item) => {
                draggable.classList.add('correct');
                draggable.draggable = false;
                
                const targetItems = target.querySelector('.target-items');
                const placedItem = draggable.cloneNode(true);
                placedItem.classList.remove('draggable-item');
                placedItem.classList.add('placed-item');
                placedItem.style.transform = 'scale(0.8)';
                targetItems.appendChild(placedItem);
                
                draggable.remove();
                
                placedItems++;
                this.score += 10;
                this.updateScore();
                this.showCelebration();
                
                if (placedItems === currentGame.items.length) {
                    this.recordLevelComplete('drag-drop', round);
                    setTimeout(() => {
                        round++;
                        createRound();
                    }, 1500);
                }
            };

            const handleWrongDrop = (draggable) => {
                draggable.classList.add('wrong');
                this.score = Math.max(0, this.score - 5);
                this.updateScore();
                setTimeout(() => draggable.classList.remove('wrong'), 500);
            };
        };

        createRound();
    }

    // ==================== 情感识别游戏 ====================
    
    /**
     * 启动情感识别游戏
     * @description 初始化并运行情感识别游戏，帮助3岁小朋友认识基本情绪表情
     */
    startEmotionMatchGame() {
        document.getElementById('game-title').textContent = '😊😢 情感识别';
        const gameArea = document.getElementById('game-area');
        
        const emotions = [
            { emoji: '😊', name: '开心', color: '#ffeb3b', description: '小朋友很快乐' },
            { emoji: '😢', name: '难过', color: '#2196f3', description: '小朋友很伤心' },
            { emoji: '😡', name: '生气', color: '#f44336', description: '小朋友很生气' },
            { emoji: '😴', name: '困了', color: '#9c27b0', description: '小朋友想睡觉' },
            { emoji: '🤔', name: '思考', color: '#ff9800', description: '小朋友在想事情' },
            { emoji: '😮', name: '惊讶', color: '#4caf50', description: '小朋友很惊讶' }
        ];

        let round = 0;
        const totalRounds = 5;

        const createRound = () => {
            if (round >= totalRounds) {
                gameArea.innerHTML = '<div class="game-instruction">🎉 太棒了！你完成了所有关卡！</div>';
                this.showCelebration();
                this.recordLevelComplete('emotion-match', round);
                return;
            }

            const targetEmotion = emotions[Math.floor(Math.random() * emotions.length)];
            const options = [...emotions].sort(() => Math.random() - 0.5).slice(0, 4);
            if (!options.includes(targetEmotion)) {
                options[Math.floor(Math.random() * options.length)] = targetEmotion;
            }
            options.sort(() => Math.random() - 0.5);

            gameArea.innerHTML = `
                <div class="game-instruction">${targetEmotion.description}</div>
                <div class="emotion-display" style="background: ${targetEmotion.color};">
                    <div class="emotion-emoji">?</div>
                    <div class="emotion-question">这是什么表情？</div>
                </div>
                <div class="items-grid">
                    ${options.map(opt => `
                        <div class="game-item emotion-item" data-emotion="${opt.name}" 
                             data-correct="${opt.name === targetEmotion.name}" 
                             style="background: ${opt.color};">
                            <div class="emotion-emoji">${opt.emoji}</div>
                            <div class="emotion-name">${opt.name}</div>
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
                        // 显示正确答案
                        const emotionDisplay = gameArea.querySelector('.emotion-display .emotion-emoji');
                        emotionDisplay.textContent = targetEmotion.emoji;
                        
                        this.score += 10;
                        this.updateScore();
                        this.showCelebration();
                        this.recordLevelComplete('emotion-match', round);
                        setTimeout(() => {
                            round++;
                            createRound();
                        }, 1500);
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

    // ==================== 触摸画画游戏 ====================
    
    /**
     * 启动触摸画画游戏
     * @description 初始化并运行触摸画画游戏，让小朋友自由涂鸦激发创造力
     */
    startTouchDrawGame() {
        document.getElementById('game-title').textContent = '🎨 触摸画画';
        const gameArea = document.getElementById('game-area');
        
        const colors = [
            { name: '红色', color: '#f44336' },
            { name: '蓝色', color: '#2196f3' },
            { name: '绿色', color: '#4caf50' },
            { name: '黄色', color: '#ffeb3b' },
            { name: '紫色', color: '#9c27b0' },
            { name: '橙色', color: '#ff9800' }
        ];

        let currentColor = colors[0].color;
        let isDrawing = false;
        let drawingCount = 0;

        gameArea.innerHTML = `
            <div class="game-instruction">自由画画！选择颜色，开始创作吧！</div>
            <div class="drawing-controls">
                <div class="color-palette">
                    ${colors.map(color => `
                        <div class="color-option ${color.color === currentColor ? 'selected' : ''}" 
                             data-color="${color.color}" style="background: ${color.color};"
                             title="${color.name}"></div>
                    `).join('')}
                </div>
                <button class="clear-btn" id="clear-canvas">清空画布</button>
                <button class="complete-btn" id="complete-drawing">完成作品</button>
            </div>
            <div class="drawing-canvas-container">
                <canvas id="drawing-canvas" class="drawing-canvas"></canvas>
            </div>
            <div class="drawing-stats">
                <span>已画: ${drawingCount} 笔</span>
            </div>
        `;

        const canvas = document.getElementById('drawing-canvas');
        const ctx = canvas.getContext('2d');
        
        // 设置画布大小
        canvas.width = Math.min(400, window.innerWidth - 40);
        canvas.height = 300;
        
        // 设置画笔样式
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.strokeStyle = currentColor;

        // 获取画布位置
        function getCanvasPosition(e) {
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX || e.touches[0].clientX) - rect.left;
            const y = (e.clientY || e.touches[0].clientY) - rect.top;
            return { x, y };
        }

        // 开始绘画
        function startDrawing(e) {
            isDrawing = true;
            const pos = getCanvasPosition(e);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
        }

        // 绘画中
        function draw(e) {
            if (!isDrawing) return;
            e.preventDefault();
            const pos = getCanvasPosition(e);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        }

        // 结束绘画
        function stopDrawing() {
            if (isDrawing) {
                isDrawing = false;
                drawingCount++;
                gameArea.querySelector('.drawing-stats span').textContent = `已画: ${drawingCount} 笔`;
            }
        }

        // 鼠标事件
        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseout', stopDrawing);

        // 触摸事件
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            startDrawing(e);
        });
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            draw(e);
        });
        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            stopDrawing();
        });

        // 颜色选择
        const colorOptions = gameArea.querySelectorAll('.color-option');
        colorOptions.forEach(option => {
            this.addTouchFeedback(option);
            option.addEventListener('click', () => {
                colorOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                currentColor = option.dataset.color;
                ctx.strokeStyle = currentColor;
            });
        });

        // 清空画布
        const clearBtn = document.getElementById('clear-canvas');
        this.addTouchFeedback(clearBtn);
        clearBtn.addEventListener('click', () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawingCount = 0;
            gameArea.querySelector('.drawing-stats span').textContent = `已画: ${drawingCount} 笔`;
        });

        // 完成作品
        const completeBtn = document.getElementById('complete-drawing');
        this.addTouchFeedback(completeBtn);
        completeBtn.addEventListener('click', () => {
            this.score += 20;
            this.updateScore();
            this.showCelebration();
            
            gameArea.innerHTML = `
                <div class="game-instruction">🎉 恭喜完成作品！</div>
                <div class="completed-canvas">
                    <canvas id="completed-canvas" class="drawing-canvas"></canvas>
                </div>
                <div class="completion-stats">
                    <span>作品完成！获得20分！</span>
                    <span>共画了 ${drawingCount} 笔</span>
                </div>
                <button class="restart-btn" id="restart-drawing">再画一幅</button>
            `;
            
            // 复制画作
            const completedCanvas = document.getElementById('completed-canvas');
            const completedCtx = completedCanvas.getContext('2d');
            completedCanvas.width = canvas.width;
            completedCanvas.height = canvas.height;
            completedCtx.drawImage(canvas, 0, 0);
            
            const restartBtn = document.getElementById('restart-drawing');
            this.addTouchFeedback(restartBtn);
            restartBtn.addEventListener('click', () => {
                this.startTouchDrawGame();
            });
        });
    }

    // ==================== 音乐节奏游戏 ====================
    
    /**
     * 启动音乐节奏游戏
     * @description 初始化并运行音乐节奏游戏，让小朋友跟随简单节奏点击
     */
    startMusicRhythmGame() {
        document.getElementById('game-title').textContent = '🎵 音乐节奏';
        const gameArea = document.getElementById('game-area');
        
        const rhythms = [
            { pattern: [1, 0, 1, 0], name: '简单节奏', speed: 800 },
            { pattern: [1, 1, 0, 1], name: '快速节奏', speed: 600 },
            { pattern: [1, 0, 0, 1, 1], name: '复杂节奏', speed: 700 },
            { pattern: [1, 1, 1, 0], name: '三连节奏', speed: 500 }
        ];

        let round = 0;
        const totalRounds = 4;

        const createRound = () => {
            if (round >= totalRounds) {
                gameArea.innerHTML = '<div class="game-instruction">🎉 太棒了！你完成了所有节奏！</div>';
                this.showCelebration();
                this.recordLevelComplete('music-rhythm', round);
                return;
            }

            const currentRhythm = rhythms[Math.min(round, rhythms.length - 1)];
            let currentBeat = 0;
            let playerBeats = [];
            let isPlaying = false;
            let isPlayerTurn = false;

            gameArea.innerHTML = `
                <div class="game-instruction">
                    <div>节奏: ${currentRhythm.name}</div>
                    <div id="round-status">点击开始播放节奏</div>
                </div>
                <div class="rhythm-display">
                    <div class="rhythm-beats">
                        ${currentRhythm.pattern.map((beat, index) => `
                            <div class="beat-indicator" data-index="${index}">${beat ? '🎵' : '🔇'}</div>
                        `).join('')}
                    </div>
                </div>
                <div class="rhythm-controls">
                    <button class="play-btn" id="play-rhythm">播放节奏</button>
                    <button class="repeat-btn" id="repeat-rhythm" disabled>重复播放</button>
                </div>
                <div class="player-controls">
                    <div class="rhythm-pad" id="rhythm-pad">
                        <div class="pad-button">🎵</div>
                    </div>
                    <div class="player-status">
                        <span id="player-status">听节奏，然后重复</span>
                    </div>
                </div>
            `;

            const beatIndicators = gameArea.querySelectorAll('.beat-indicator');
            const playBtn = document.getElementById('play-rhythm');
            const repeatBtn = document.getElementById('repeat-rhythm');
            const rhythmPad = document.getElementById('rhythm-pad');
            const roundStatus = document.getElementById('round-status');
            const playerStatus = document.getElementById('player-status');

            this.addTouchFeedback(playBtn);
            this.addTouchFeedback(repeatBtn);
            this.addTouchFeedback(rhythmPad);

            const playRhythm = () => {
                isPlaying = true;
                currentBeat = 0;
                playerBeats = [];
                isPlayerTurn = false;
                
                playBtn.disabled = true;
                repeatBtn.disabled = true;
                roundStatus.textContent = '播放中...';
                playerStatus.textContent = '仔细听节奏';

                const playInterval = setInterval(() => {
                    // 高亮当前节拍
                    beatIndicators.forEach(beat => beat.classList.remove('active'));
                    beatIndicators[currentBeat].classList.add('active');

                    // 播放声音（视觉反馈）
                    if (currentRhythm.pattern[currentBeat]) {
                        rhythmPad.style.transform = 'scale(1.1)';
                        rhythmPad.style.background = '#4caf50';
                        setTimeout(() => {
                            rhythmPad.style.transform = 'scale(1)';
                            rhythmPad.style.background = '#e0e0e0';
                        }, 200);
                    }

                    currentBeat++;

                    if (currentBeat >= currentRhythm.pattern.length) {
                        clearInterval(playInterval);
                        beatIndicators.forEach(beat => beat.classList.remove('active'));
                        
                        setTimeout(() => {
                            isPlaying = false;
                            isPlayerTurn = true;
                            repeatBtn.disabled = false;
                            roundStatus.textContent = '现在轮到你了！';
                            playerStatus.textContent = '点击节奏垫重复节奏';
                        }, 500);
                    }
                }, currentRhythm.speed);
            };

            const handlePlayerBeat = () => {
                if (!isPlayerTurn) return;

                playerBeats.push(1);
                rhythmPad.style.transform = 'scale(1.1)';
                rhythmPad.style.background = '#2196f3';
                setTimeout(() => {
                    rhythmPad.style.transform = 'scale(1)';
                    rhythmPad.style.background = '#e0e0e0';
                }, 200);

                if (playerBeats.length === currentRhythm.pattern.length) {
                    isPlayerTurn = false;
                    
                    // 检查答案
                    const isCorrect = JSON.stringify(playerBeats) === JSON.stringify(currentRhythm.pattern.filter(b => b === 1));
                    
                    if (isCorrect) {
                        roundStatus.textContent = '完美！节奏正确！';
                        playerStatus.textContent = '🎉 太棒了！';
                        this.score += 15;
                        this.updateScore();
                        this.showCelebration();
                        this.recordLevelComplete('music-rhythm', round);
                        
                        setTimeout(() => {
                            round++;
                            createRound();
                        }, 2000);
                    } else {
                        roundStatus.textContent = '节奏不太对，再试试！';
                        playerStatus.textContent = '😅 再听一遍吧';
                        this.score = Math.max(0, this.score - 5);
                        this.updateScore();
                        
                        setTimeout(() => {
                            repeatBtn.disabled = false;
                            playerStatus.textContent = '点击重复播放再试一次';
                        }, 1500);
                    }
                }
            };

            playBtn.addEventListener('click', playRhythm);
            repeatBtn.addEventListener('click', playRhythm);
            rhythmPad.addEventListener('click', handlePlayerBeat);
        };

        createRound();
    }

    // ==================== 无限挑战模式 ====================

    // 颜色配对 - 无限模式
    startColorMatchEndless() {
        document.getElementById('game-title').textContent = '🎨 颜色配对 - 无限';
        const gameArea = document.getElementById('game-area');

        const colors = [
            { name: '红色', color: '#e74c3c', emoji: '🍎' },
            { name: '蓝色', color: '#3498db', emoji: '🫐' },
            { name: '绿色', color: '#2ecc71', emoji: '🍀' },
            { name: '黄色', color: '#f1c40f', emoji: '🌻' },
            { name: '紫色', color: '#9b59b6', emoji: '🍇' }
        ];

        const createRound = () => {
            const targetColor = colors[Math.floor(Math.random() * colors.length)];
            const options = [...colors].sort(() => Math.random() - 0.5).slice(0, 4);
            if (!options.includes(targetColor)) {
                options[Math.floor(Math.random() * options.length)] = targetColor;
            }
            options.sort(() => Math.random() - 0.5);

            // 计算难度倍数（基于分数）
            const difficultyMultiplier = Math.min(2.0, 1 + Math.floor(this.score / 100) * 0.1);
            const points = Math.round(10 * difficultyMultiplier);

            gameArea.innerHTML = `
                <div class="game-instruction">
                    <div>得分: ${this.score}</div>
                    <div>难度倍数: ${difficultyMultiplier.toFixed(1)}x</div>
                </div>
                <div class="target-display" style="background: ${targetColor.color};">
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
                        this.score += points;
                        this.updateScore();
                        this.showCelebration();
                        setTimeout(createRound, 1000);
                    } else {
                        item.classList.add('wrong');
                        this.score = Math.max(0, this.score - Math.round(5 * difficultyMultiplier));
                        this.updateScore();
                        setTimeout(() => item.classList.remove('wrong'), 500);
                    }
                });
            });
        };

        createRound();
    }

    // 形状识别 - 无限模式
    startShapeMatchEndless() {
        document.getElementById('game-title').textContent = '⭐ 形状识别 - 无限';
        const gameArea = document.getElementById('game-area');

        const shapes = [
            { name: '圆形', emoji: '⭕' },
            { name: '正方形', emoji: '⬜' },
            { name: '三角形', emoji: '🔺' },
            { name: '星形', emoji: '⭐' },
            { name: '爱心', emoji: '❤️' }
        ];

        const createRound = () => {
            const targetShape = shapes[Math.floor(Math.random() * shapes.length)];
            const options = [...shapes].sort(() => Math.random() - 0.5).slice(0, 4);
            if (!options.includes(targetShape)) {
                options[Math.floor(Math.random() * options.length)] = targetShape;
            }
            options.sort(() => Math.random() - 0.5);

            const difficultyMultiplier = Math.min(2.0, 1 + Math.floor(this.score / 100) * 0.1);
            const points = Math.round(10 * difficultyMultiplier);

            gameArea.innerHTML = `
                <div class="game-instruction">
                    <div>得分: ${this.score}</div>
                    <div>难度倍数: ${difficultyMultiplier.toFixed(1)}x</div>
                </div>
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
                        this.score += points;
                        this.updateScore();
                        this.showCelebration();
                        setTimeout(createRound, 1000);
                    } else {
                        item.classList.add('wrong');
                        this.score = Math.max(0, this.score - Math.round(5 * difficultyMultiplier));
                        this.updateScore();
                        setTimeout(() => item.classList.remove('wrong'), 500);
                    }
                });
            });
        };

        createRound();
    }

    // 简单拼图 - 无限模式
    startSimplePuzzleEndless() {
        document.getElementById('game-title').textContent = '🧩 简单拼图 - 无限';
        const gameArea = document.getElementById('game-area');

        const puzzles = [
            { emoji: '🐶', name: '小狗', options: ['🐱', '🐰', '🐼', '🐨', '🐯', '🐻', '🦊'] },
            { emoji: '🐱', name: '小猫', options: ['🐶', '🐰', '🐼', '🐨', '🐯', '🐻', '🦊'] },
            { emoji: '🐰', name: '小兔', options: ['🐶', '🐱', '🐼', '🐨', '🐯', '🐻', '🦊'] },
            { emoji: '🐼', name: '熊猫', options: ['🐶', '🐱', '🐰', '🐨', '🐯', '🐻', '🦊'] }
        ];

        const createPuzzle = () => {
            const puzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
            const allOptions = [...puzzle.options, puzzle.emoji].sort(() => Math.random() - 0.5);
            const correctOption = puzzle.emoji;

            const difficultyMultiplier = Math.min(2.0, 1 + Math.floor(this.score / 100) * 0.1);
            const points = Math.round(10 * difficultyMultiplier);

            gameArea.innerHTML = `
                <div class="game-instruction">
                    <div>得分: ${this.score}</div>
                    <div>难度倍数: ${difficultyMultiplier.toFixed(1)}x</div>
                </div>
                <div class="target-display">
                    ${puzzle.emoji}
                </div>
                <div class="puzzle-grid">
                    ${allOptions.map(opt => `
                        <div class="puzzle-piece" data-option="${opt}"
                             data-correct="${opt === correctOption}">
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
                        piece.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
                        this.score += points;
                        this.updateScore();
                        this.showCelebration();
                        setTimeout(createPuzzle, 1000);
                    } else {
                        piece.classList.add('wrong');
                        piece.style.background = '#f44336';
                        this.score = Math.max(0, this.score - Math.round(5 * difficultyMultiplier));
                        this.updateScore();
                        setTimeout(() => piece.classList.remove('wrong'), 500);
                    }
                });
            });
        };

        createPuzzle();
    }

    // 数字认知 - 无限模式
    startNumberCountEndless() {
        document.getElementById('game-title').textContent = '🔢 数字认知 - 无限';
        const gameArea = document.getElementById('game-area');

        const emojis = ['🍎', '🌟', '🐟', '🌸', '🎈', '🦋'];

        const createRound = () => {
            const emoji = emojis[Math.floor(Math.random() * emojis.length)];
            const count = Math.floor(Math.random() * 5) + 1;
            const correctAnswer = count;
            const options = [correctAnswer, correctAnswer - 1, correctAnswer + 1, correctAnswer + 2]
                .filter(n => n >= 1 && n <= 10)
                .sort(() => Math.random() - 0.5)
                .slice(0, 4);

            const emojiString = emoji.repeat(count);

            const difficultyMultiplier = Math.min(2.0, 1 + Math.floor(this.score / 100) * 0.1);
            const points = Math.round(10 * difficultyMultiplier);

            gameArea.innerHTML = `
                <div class="game-instruction">
                    <div>得分: ${this.score}</div>
                    <div>难度倍数: ${difficultyMultiplier.toFixed(1)}x</div>
                </div>
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
                        this.score += points;
                        this.updateScore();
                        this.showCelebration();
                        setTimeout(createRound, 1000);
                    } else {
                        item.classList.add('wrong');
                        this.score = Math.max(0, this.score - Math.round(5 * difficultyMultiplier));
                        this.updateScore();
                        setTimeout(() => item.classList.remove('wrong'), 500);
                    }
                });
            });
        };

        createRound();
    }

    // 记忆大师 - 无限模式
    startMemoryMatchEndless() {
        document.getElementById('game-title').textContent = '🧠 记忆大师 - 无限';
        const gameArea = document.getElementById('game-area');

        let endlessLevel = 1;
        const maxDisplayTime = 6000;
        const minDisplayTime = 2000;

        const createRound = () => {
            const difficulty = Math.min(3, Math.floor(endlessLevel / 5));
            const cardCount = Math.min(8, 3 + difficulty);
            const displayTime = Math.max(minDisplayTime, maxDisplayTime - (endlessLevel * 100));
            const themeIndex = endlessLevel % this.memoryThemes.length;
            const theme = this.memoryThemes[themeIndex];

            const shuffledItems = [...theme.items].sort(() => Math.random() - 0.5);
            const selectedItems = shuffledItems.slice(0, cardCount);
            const targetItem = selectedItems[Math.floor(Math.random() * selectedItems.length)];

            const difficultyMultiplier = Math.min(2.0, 1 + Math.floor(endlessLevel / 10) * 0.1);
            const points = Math.round(10 * difficultyMultiplier * (1 + difficulty * 0.2));

            gameArea.innerHTML = `
                <div class="game-instruction">
                    <div>得分: ${this.score}</div>
                    <div>轮次: ${endlessLevel}</div>
                    <div>主题: ${theme.name}</div>
                    <div>得分: ${points}分</div>
                    <div id="timer-display">准备开始...</div>
                </div>
                <div class="memory-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 15px; max-width: 500px; width: 100%;"></div>
                <div id="target-display" class="memory-target" style="display: none;">
                    <div class="memory-target-content">
                        <div class="memory-target-instruction">请找到</div>
                        <div class="memory-target-emoji" style="font-size: clamp(60px, 12vw, 100px);">
                            ${targetItem}
                        </div>
                    </div>
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
                card.dataset.emoji = item;
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
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                    user-select: none;
                `;
                card.textContent = item;
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

                let displayCount = displayTime / 1000;
                const displayInterval = setInterval(() => {
                    displayCount -= 0.1;
                    if (displayCount > 0) {
                        timerDisplay.textContent = `${displayCount.toFixed(1)} 秒`;
                    } else {
                        clearInterval(displayInterval);
                        hideCards();
                    }
                }, 100);
            };

            const hideCards = () => {
                timerDisplay.textContent = '卡片已隐藏！';

                cardElements.forEach(card => {
                    card.style.background = '#e0e0e0';
                    card.textContent = '❓';
                });

                targetDisplay.style.display = 'block';
                targetDisplay.classList.add('active');

                cardElements.forEach(card => {
                    card.addEventListener('click', () => {
                        const isCorrect = card.dataset.emoji === targetItem;

                        if (isCorrect) {
                            card.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
                            card.textContent = targetItem;
                            card.style.transform = 'scale(1.2)';
                            this.score += points;
                            this.updateScore();
                            this.showCelebration();

                            endlessLevel++;
                            setTimeout(createRound, 1500);
                        } else {
                            card.style.background = '#f44336';
                            card.style.transform = 'scale(0.9)';

                            setTimeout(() => {
                                card.style.background = '#e0e0e0';
                                card.textContent = '❓';
                                card.style.transform = 'scale(1)';
                            }, 500);

                            this.score = Math.max(0, this.score - Math.round(5 * difficultyMultiplier));
                            this.updateScore();
                        }
                    }, { once: true });
                });
            };
        };

        createRound();
    }

    // 字母配对 - 无限模式
    startLetterMatchEndless() {
        document.getElementById('game-title').textContent = '🔤 字母配对 - 无限';
        const gameArea = document.getElementById('game-area');

        const letters = [
            { upper: 'A', lower: 'a' },
            { upper: 'B', lower: 'b' },
            { upper: 'C', lower: 'c' },
            { upper: 'D', lower: 'd' },
            { upper: 'E', lower: 'e' },
            { upper: 'F', lower: 'f' },
            { upper: 'G', lower: 'g' },
            { upper: 'H', lower: 'h' },
            { upper: 'I', lower: 'i' },
            { upper: 'J', lower: 'j' },
            { upper: 'K', lower: 'k' },
            { upper: 'L', lower: 'l' },
            { upper: 'M', lower: 'm' },
            { upper: 'N', lower: 'n' },
            { upper: 'O', lower: 'o' },
            { upper: 'P', lower: 'p' },
            { upper: 'Q', lower: 'q' },
            { upper: 'R', lower: 'r' },
            { upper: 'S', lower: 's' },
            { upper: 'T', lower: 't' },
            { upper: 'U', lower: 'u' },
            { upper: 'V', lower: 'v' },
            { upper: 'W', lower: 'w' },
            { upper: 'X', lower: 'x' },
            { upper: 'Y', lower: 'y' },
            { upper: 'Z', lower: 'z' }
        ];

        let endlessRound = 0;

        const createRound = () => {
            endlessRound++;

            const cardCount = Math.min(4, 2 + Math.floor((endlessRound - 1) / 5));
            const shuffledLetters = [...letters].sort(() => Math.random() - 0.5);
            const selectedLetters = shuffledLetters.slice(0, cardCount);

            const difficultyMultiplier = Math.min(2.0, 1 + Math.floor(endlessRound / 10) * 0.1);
            const points = Math.round(10 * difficultyMultiplier);

            gameArea.innerHTML = `
                <div class="game-instruction">
                    <div>得分: ${this.score}</div>
                    <div>轮次: ${endlessRound}</div>
                    <div class="instruction-text">找到 ${selectedLetters[0].upper} 的写</div>
                </div>
                <div class="target-display">
                    <div class="target-emoji">${selectedLetters[0].upper}</div>
                    <div class="instruction-text">请找到 ${selectedLetters[0].lower} 的写</div>
                </div>
                <div class="items-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 15px; max-width: 400px;">
                    ${selectedLetters.map(letter => `
                        <div class="game-item letter-item" data-letter="${letter.lower}" data-correct="${letter.upper === selectedLetters[0].upper}">
                            ${letter.lower}
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
                        item.style.animation = 'correctAnswer 0.6s ease';
                        this.score += points;
                        this.updateScore();
                        this.showCelebration();
                        setTimeout(createRound, 1000);
                    } else {
                        item.classList.add('wrong');
                        item.style.animation = 'wrongAnswer 0.5s ease';
                        this.score = Math.max(0, this.score - Math.round(5 * difficultyMultiplier));
                        this.updateScore();
                        setTimeout(() => {
                            item.classList.remove('wrong');
                        }, 500);
                    }
                });
            });
        };

        createRound();
    }

    // 声音配对 - 无限模式
    startSoundMatchEndless() {
        document.getElementById('game-title').textContent = '🔊 声音配对 - 无限';
        const gameArea = document.getElementById('game-area');

        let animalSounds = [
            { name: '小狗', emoji: '🐶', text: '小狗怎么叫？' },
            { name: '小猫', emoji: '🐱', text: '小猫怎么叫？' },
            { name: '小羊', emoji: '🐑', text: '小羊怎么叫？' },
            { name: '小鸭', emoji: '🦆', text: '小鸭怎么叫？' },
            { name: '小鸡', emoji: '🐤', text: '小鸡怎么叫？' },
            { name: '青蛙', emoji: '🐸', text: '青蛙怎么叫？' }
        ];

        let endlessRound = 0;

        const createRound = () => {
            endlessRound++;

            const targetAnimal = animalSounds[Math.floor(Math.random() * animalSounds.length)];
            const options = [...animalSounds].sort(() => Math.random() - 0.5).slice(0, 4);
            if (!options.includes(targetAnimal)) {
                options[Math.floor(Math.random() * options.length)] = targetAnimal;
            }
            options.sort(() => Math.random() - 0.5);

            const difficultyMultiplier = Math.min(2.0, 1 + Math.floor(endlessRound / 10) * 0.1);
            const points = Math.round(10 * difficultyMultiplier);

            gameArea.innerHTML = `
                <div class="game-instruction">
                    <div>得分: ${this.score}</div>
                    <div>轮次: ${endlessRound}</div>
                    <div>${targetAnimal.text}</div>
                </div>
                <div class="sound-player" id="sound-player">
                    <div class="sound-icon">🔊</div>
                    <div class="sound-text">点击听声音</div>
                </div>
                <div class="items-grid">
                    ${options.map(opt => `
                        <div class="game-item sound-item" data-animal="${opt.name}"
                             data-correct="${opt.name === targetAnimal.name}">
                            <div class="animal-emoji">${opt.emoji}</div>
                            <div class="animal-name">${opt.name}</div>
                        </div>
                    `).join('')}
                </div>
            `;

            // 设置声音播放器
            const soundPlayer = document.getElementById('sound-player');
            this.addTouchFeedback(soundPlayer);

            soundPlayer.addEventListener('click', async () => {
                soundPlayer.classList.add('playing');

                try {
                    await this.resumeAudioContext();
                    this.playAnimalSound(targetAnimal.emoji);
                } catch (error) {
                    console.error('播放声音失败:', error);
                }

                setTimeout(() => {
                    soundPlayer.classList.remove('playing');
                }, 1000);
            });

            const items = gameArea.querySelectorAll('.game-item');
            items.forEach(item => {
                this.addTouchFeedback(item);
                item.addEventListener('click', () => {
                    const isCorrect = item.dataset.correct === 'true';
                    if (isCorrect) {
                        item.classList.add('correct');
                        this.score += points;
                        this.updateScore();
                        this.showCelebration();
                        setTimeout(createRound, 1500);
                    } else {
                        item.classList.add('wrong');
                        this.score = Math.max(0, this.score - Math.round(5 * difficultyMultiplier));
                        this.updateScore();
                        setTimeout(() => item.classList.remove('wrong'), 500);
                    }
                });
            });
        };

        createRound();
    }

    // 大小比较 - 无限模式
    startSizeCompareEndless() {
        document.getElementById('game-title').textContent = '🐘🐭 大小比较 - 无限';
        const gameArea = document.getElementById('game-area');

        const items = [
            { big: { emoji: '🐘', name: '大象' }, small: { emoji: '🐭', name: '老鼠' } },
            { big: { emoji: '🌳', name: '大树' }, small: { emoji: '🌱', name: '小树' } },
            { big: { emoji: '🏠', name: '大房子' }, small: { emoji: '🏚️', name: '小房子' } },
            { big: { emoji: '🚗', name: '大汽车' }, small: { emoji: '🚲', name: '小自行车' } },
            { big: { emoji: '🍉', name: '大西瓜' }, small: { emoji: '🍓', name: '小草莓' } }
        ];

        let endlessRound = 0;

        const createRound = () => {
            endlessRound++;

            const currentItem = items[Math.floor(Math.random() * items.length)];
            const question = Math.random() > 0.5 ? 'big' : 'small';
            const targetSize = question === 'big' ? '大' : '小';
            const targetItem = currentItem[question];

            const difficultyMultiplier = Math.min(2.0, 1 + Math.floor(endlessRound / 10) * 0.1);
            const points = Math.round(10 * difficultyMultiplier);

            gameArea.innerHTML = `
                <div class="game-instruction">
                    <div>得分: ${this.score}</div>
                    <div>轮次: ${endlessRound}</div>
                    <div>请找出${targetSize}${targetItem.name}！</div>
                </div>
                <div class="size-comparison">
                    <div class="size-item big-size">
                        <div class="size-emoji big-emoji">${currentItem.big.emoji}</div>
                        <div class="size-label">大</div>
                    </div>
                    <div class="size-vs">VS</div>
                    <div class="size-item small-size">
                        <div class="size-emoji small-emoji">${currentItem.small.emoji}</div>
                        <div class="size-label">小</div>
                    </div>
                </div>
                <div class="items-grid">
                    <div class="game-item size-item-option" data-size="big"
                         data-correct="${question === 'big'}">
                        <div class="size-emoji-option big-emoji-option">${currentItem.big.emoji}</div>
                        <div class="size-label-option">大</div>
                    </div>
                    <div class="game-item size-item-option" data-size="small"
                         data-correct="${question === 'small'}">
                        <div class="size-emoji-option small-emoji-option">${currentItem.small.emoji}</div>
                        <div class="size-label-option">小</div>
                    </div>
                </div>
            `;

            const sizeOptions = gameArea.querySelectorAll('.size-item-option');
            sizeOptions.forEach(item => {
                this.addTouchFeedback(item);
                item.addEventListener('click', () => {
                    const isCorrect = item.dataset.correct === 'true';
                    if (isCorrect) {
                        item.classList.add('correct');
                        this.score += points;
                        this.updateScore();
                        this.showCelebration();
                        setTimeout(createRound, 1500);
                    } else {
                        item.classList.add('wrong');
                        this.score = Math.max(0, this.score - Math.round(5 * difficultyMultiplier));
                        this.updateScore();
                        setTimeout(() => item.classList.remove('wrong'), 500);
                    }
                });
            });
        };

        createRound();
    }

    // 简单拖放 - 无限模式
    startDragDropEndless() {
        document.getElementById('game-title').textContent = '🎯 简单拖放 - 无限';
        const gameArea = document.getElementById('game-area');

        const dragGames = [
            {
                items: [
                    { emoji: '🍎', name: '苹果', target: 'fruits' },
                    { emoji: '🍌', name: '香蕉', target: 'fruits' },
                    { emoji: '🚗', name: '汽车', target: 'vehicles' },
                    { emoji: '✈️', name: '飞机', target: 'vehicles' }
                ],
                targets: [
                    { id: 'fruits', label: '水果', emoji: '🍎' },
                    { id: 'vehicles', label: '交通工具', emoji: '🚗' }
                ]
            },
            {
                items: [
                    { emoji: '🐶', name: '小狗', target: 'animals' },
                    { emoji: '🐱', name: '小猫', target: 'animals' },
                    { emoji: '🌸', name: '花朵', target: 'plants' },
                    { emoji: '🌳', name: '大树', target: 'plants' }
                ],
                targets: [
                    { id: 'animals', label: '动物', emoji: '🐶' },
                    { id: 'plants', label: '植物', emoji: '🌸' }
                ]
            }
        ];

        let endlessRound = 0;

        const createRound = () => {
            endlessRound++;

            const currentGame = dragGames[endlessRound % dragGames.length];
            const shuffledItems = [...currentGame.items].sort(() => Math.random() - 0.5);
            let placedItems = 0;

            const difficultyMultiplier = Math.min(2.0, 1 + Math.floor(endlessRound / 10) * 0.1);
            const points = Math.round(10 * difficultyMultiplier);

            gameArea.innerHTML = `
                <div class="game-instruction">
                    <div>得分: ${this.score}</div>
                    <div>轮次: ${endlessRound}</div>
                    <div>把物品拖到正确的位置！</div>
                </div>
                <div class="drag-drop-area">
                    <div class="items-area">
                        <div class="items-container">
                            ${shuffledItems.map((item, index) => `
                                <div class="draggable-item" draggable="true"
                                     data-item='${JSON.stringify(item)}' data-index="${index}">
                                    <div class="item-emoji">${item.emoji}</div>
                                    <div class="item-name">${item.name}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="targets-area">
                        ${currentGame.targets.map(target => `
                            <div class="drop-target" data-target="${target.id}">
                                <div class="target-emoji">${target.emoji}</div>
                                <div class="target-label">${target.label}</div>
                                <div class="target-items"></div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;

            // 拖放功能实现
            const draggables = gameArea.querySelectorAll('.draggable-item');
            const dropTargets = gameArea.querySelectorAll('.drop-target');

            draggables.forEach(draggable => {
                this.addTouchFeedback(draggable);

                draggable.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', draggable.dataset.item);
                    draggable.classList.add('dragging');
                });

                draggable.addEventListener('dragend', () => {
                    draggable.classList.remove('dragging');
                });

                // 触摸设备支持
                draggable.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    const touch = e.touches[0];
                    const clone = draggable.cloneNode(true);
                    clone.style.position = 'fixed';
                    clone.style.pointerEvents = 'none';
                    clone.style.zIndex = '1000';
                    clone.style.opacity = '0.7';
                    document.body.appendChild(clone);

                    const moveTouch = (e) => {
                        const touch = e.touches[0];
                        clone.style.left = touch.clientX - 50 + 'px';
                        clone.style.top = touch.clientY - 50 + 'px';
                    };

                    const endTouch = (e) => {
                        clone.remove();
                        document.removeEventListener('touchmove', moveTouch);
                        document.removeEventListener('touchend', endTouch);

                        const touch = e.changedTouches[0];
                        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
                        const dropTarget = elementBelow?.closest('.drop-target');

                        if (dropTarget) {
                            const item = JSON.parse(draggable.dataset.item);
                            if (item.target === dropTarget.dataset.target) {
                                handleCorrectDrop(draggable, dropTarget, item);
                            } else {
                                handleWrongDrop(draggable);
                            }
                        }
                    };

                    document.addEventListener('touchmove', moveTouch);
                    document.addEventListener('touchend', endTouch);
                });
            });

            dropTargets.forEach(target => {
                target.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    target.classList.add('drag-over');
                });

                target.addEventListener('dragleave', () => {
                    target.classList.remove('drag-over');
                });

                target.addEventListener('drop', (e) => {
                    e.preventDefault();
                    target.classList.remove('drag-over');

                    const itemData = e.dataTransfer.getData('text/plain');
                    const item = JSON.parse(itemData);
                    const draggable = document.querySelector(`[data-item='${itemData}']`);

                    if (item.target === target.dataset.target) {
                        handleCorrectDrop(draggable, target, item);
                    } else {
                        handleWrongDrop(draggable);
                    }
                });
            });

            const handleCorrectDrop = (draggable, target, item) => {
                draggable.classList.add('correct');
                draggable.draggable = false;

                const targetItems = target.querySelector('.target-items');
                const placedItem = draggable.cloneNode(true);
                placedItem.classList.remove('draggable-item');
                placedItem.classList.add('placed-item');
                placedItem.style.transform = 'scale(0.8)';
                targetItems.appendChild(placedItem);

                draggable.remove();

                placedItems++;
                this.score += points;
                this.updateScore();
                this.showCelebration();

                if (placedItems === currentGame.items.length) {
                    setTimeout(() => {
                        createRound();
                    }, 1500);
                }
            };

            const handleWrongDrop = (draggable) => {
                draggable.classList.add('wrong');
                this.score = Math.max(0, this.score - Math.round(5 * difficultyMultiplier));
                this.updateScore();
                setTimeout(() => draggable.classList.remove('wrong'), 500);
            };
        };

        createRound();
    }

    // 情感识别 - 无限模式
    startEmotionMatchEndless() {
        document.getElementById('game-title').textContent = '😊😢 情感识别 - 无限';
        const gameArea = document.getElementById('game-area');

        const emotions = [
            { emoji: '😊', name: '开心', color: '#ffeb3b', description: '小朋友很快乐' },
            { emoji: '😢', name: '难过', color: '#2196f3', description: '小朋友很伤心' },
            { emoji: '😡', name: '生气', color: '#f44336', description: '小朋友很生气' },
            { emoji: '😴', name: '困了', color: '#9c27b0', description: '小朋友想睡觉' },
            { emoji: '🤔', name: '思考', color: '#ff9800', description: '小朋友在想事情' },
            { emoji: '😮', name: '惊讶', color: '#4caf50', description: '小朋友很惊讶' }
        ];

        let endlessRound = 0;

        const createRound = () => {
            endlessRound++;

            const targetEmotion = emotions[Math.floor(Math.random() * emotions.length)];
            const options = [...emotions].sort(() => Math.random() - 0.5).slice(0, 4);
            if (!options.includes(targetEmotion)) {
                options[Math.floor(Math.random() * options.length)] = targetEmotion;
            }
            options.sort(() => Math.random() - 0.5);

            const difficultyMultiplier = Math.min(2.0, 1 + Math.floor(endlessRound / 10) * 0.1);
            const points = Math.round(10 * difficultyMultiplier);

            gameArea.innerHTML = `
                <div class="game-instruction">
                    <div>得分: ${this.score}</div>
                    <div>轮次: ${endlessRound}</div>
                    <div>${targetEmotion.description}</div>
                </div>
                <div class="emotion-display" style="background: ${targetEmotion.color};">
                    <div class="emotion-emoji">?</div>
                    <div class="emotion-question">这是什么表情？</div>
                </div>
                <div class="items-grid">
                    ${options.map(opt => `
                        <div class="game-item emotion-item" data-emotion="${opt.name}"
                             data-correct="${opt.name === targetEmotion.name}"
                             style="background: ${opt.color};">
                            <div class="emotion-emoji">${opt.emoji}</div>
                            <div class="emotion-name">${opt.name}</div>
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
                        // 显示正确答案
                        const emotionDisplay = gameArea.querySelector('.emotion-display .emotion-emoji');
                        emotionDisplay.textContent = targetEmotion.emoji;

                        this.score += points;
                        this.updateScore();
                        this.showCelebration();
                        setTimeout(createRound, 1500);
                    } else {
                        item.classList.add('wrong');
                        this.score = Math.max(0, this.score - Math.round(5 * difficultyMultiplier));
                        this.updateScore();
                        setTimeout(() => item.classList.remove('wrong'), 500);
                    }
                });
            });
        };

        createRound();
    }

    // 音乐节奏 - 无限模式
    startMusicRhythmEndless() {
        document.getElementById('game-title').textContent = '🎵 音乐节奏 - 无限';
        const gameArea = document.getElementById('game-area');

        const rhythms = [
            { pattern: [1, 0, 1, 0], name: '简单节奏', speed: 800 },
            { pattern: [1, 1, 0, 1], name: '快速节奏', speed: 600 },
            { pattern: [1, 0, 0, 1, 1], name: '复杂节奏', speed: 700 },
            { pattern: [1, 1, 1, 0], name: '三连节奏', speed: 500 }
        ];

        let endlessRound = 0;

        const createRound = () => {
            endlessRound++;

            const currentRhythm = rhythms[endlessRound % rhythms.length];
            let currentBeat = 0;
            let playerBeats = [];
            let isPlaying = false;
            let isPlayerTurn = false;

            const difficultyMultiplier = Math.min(2.0, 1 + Math.floor(endlessRound / 10) * 0.1);
            const points = Math.round(15 * difficultyMultiplier);

            gameArea.innerHTML = `
                <div class="game-instruction">
                    <div>得分: ${this.score}</div>
                    <div>轮次: ${endlessRound}</div>
                    <div>节奏: ${currentRhythm.name}</div>
                    <div id="round-status">点击开始播放节奏</div>
                </div>
                <div class="rhythm-display">
                    <div class="rhythm-beats">
                        ${currentRhythm.pattern.map((beat, index) => `
                            <div class="beat-indicator" data-index="${index}">${beat ? '🎵' : '🔇'}</div>
                        `).join('')}
                    </div>
                </div>
                <div class="rhythm-controls">
                    <button class="play-btn" id="play-rhythm">播放节奏</button>
                    <button class="repeat-btn" id="repeat-rhythm" disabled>重复播放</button>
                </div>
                <div class="player-controls">
                    <div class="rhythm-pad" id="rhythm-pad">
                        <div class="pad-button">🎵</div>
                    </div>
                    <div class="player-status">
                        <span id="player-status">听节奏，然后重复</span>
                    </div>
                </div>
            `;

            const beatIndicators = gameArea.querySelectorAll('.beat-indicator');
            const playBtn = document.getElementById('play-rhythm');
            const repeatBtn = document.getElementById('repeat-rhythm');
            const rhythmPad = document.getElementById('rhythm-pad');
            const roundStatus = document.getElementById('round-status');
            const playerStatus = document.getElementById('player-status');

            this.addTouchFeedback(playBtn);
            this.addTouchFeedback(repeatBtn);
            this.addTouchFeedback(rhythmPad);

            const playRhythm = () => {
                isPlaying = true;
                currentBeat = 0;
                playerBeats = [];
                isPlayerTurn = false;

                playBtn.disabled = true;
                repeatBtn.disabled = true;
                roundStatus.textContent = '播放中...';
                playerStatus.textContent = '仔细听节奏';

                const playInterval = setInterval(() => {
                    // 高亮当前节拍
                    beatIndicators.forEach(beat => beat.classList.remove('active'));
                    beatIndicators[currentBeat].classList.add('active');

                    // 播放声音（视觉反馈）
                    if (currentRhythm.pattern[currentBeat]) {
                        rhythmPad.style.transform = 'scale(1.1)';
                        rhythmPad.style.background = '#4caf50';
                        setTimeout(() => {
                            rhythmPad.style.transform = 'scale(1)';
                            rhythmPad.style.background = '#e0e0e0';
                        }, 200);
                    }

                    currentBeat++;

                    if (currentBeat >= currentRhythm.pattern.length) {
                        clearInterval(playInterval);
                        beatIndicators.forEach(beat => beat.classList.remove('active'));

                        setTimeout(() => {
                            isPlaying = false;
                            isPlayerTurn = true;
                            repeatBtn.disabled = false;
                            roundStatus.textContent = '现在轮到你了！';
                            playerStatus.textContent = '点击节奏垫重复节奏';
                        }, 500);
                    }
                }, currentRhythm.speed);
            };

            const handlePlayerBeat = () => {
                if (!isPlayerTurn) return;

                playerBeats.push(1);
                rhythmPad.style.transform = 'scale(1.1)';
                rhythmPad.style.background = '#2196f3';
                setTimeout(() => {
                    rhythmPad.style.transform = 'scale(1)';
                    rhythmPad.style.background = '#e0e0e0';
                }, 200);

                if (playerBeats.length === currentRhythm.pattern.length) {
                    isPlayerTurn = false;

                    // 检查答案
                    const isCorrect = JSON.stringify(playerBeats) === JSON.stringify(currentRhythm.pattern.filter(b => b === 1));

                    if (isCorrect) {
                        roundStatus.textContent = '完美！节奏正确！';
                        playerStatus.textContent = '🎉 太棒了！';
                        this.score += points;
                        this.updateScore();
                        this.showCelebration();

                        setTimeout(() => {
                            createRound();
                        }, 2000);
                    } else {
                        roundStatus.textContent = '节奏不太对，再试试！';
                        playerStatus.textContent = '😅 再听一遍吧';
                        this.score = Math.max(0, this.score - Math.round(5 * difficultyMultiplier));
                        this.updateScore();

                        setTimeout(() => {
                            repeatBtn.disabled = false;
                            playerStatus.textContent = '点击重复播放再试一次';
                        }, 1500);
                    }
                }
            };

            playBtn.addEventListener('click', playRhythm);
            repeatBtn.addEventListener('click', playRhythm);
            rhythmPad.addEventListener('click', handlePlayerBeat);
        };

        createRound();
    }
}

// Production: Development logs removed

// ==================== 涂鸦板游戏 ====================
class DrawingBoardGame {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.gameType = 'drawing-board';
        this.name = '涂鸦板';
        this.icon = '🎨';
        this.canvas = null;
        this.ctx = null;
        this.currentColor = '#000000';
        this.currentSize = 5;
        this.isDrawing = false;
    }
    
    startGame() {
        const gameArea = document.getElementById('game-area');
        gameArea.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <h2>🎨 涂鸦板</h2>
                <div style="margin: 20px 0;">
                    <span style="margin: 0 10px;">颜色：</span>
                    <button onclick="this.setColor('#ff0000')" style="width: 30px; height: 30px; background: #ff0000; border: 2px solid #ccc; cursor: pointer;"></button>
                    <button onclick="this.setColor('#00ff00')" style="width: 30px; height: 30px; background: #00ff00; border: 2px solid #ccc; cursor: pointer;"></button>
                    <button onclick="this.setColor('#0000ff')" style="width: 30px; height: 30px; background: #0000ff; border: 2px solid #ccc; cursor: pointer;"></button>
                    <button onclick="this.setColor('#ffff00')" style="width: 30px; height: 30px; background: #ffff00; border: 2px solid #ccc; cursor: pointer;"></button>
                    <button onclick="this.setColor('#000000')" style="width: 30px; height: 30px; background: #000000; border: 2px solid #ccc; cursor: pointer;"></button>
                </div>
                <div style="margin: 20px 0;">
                    <span style="margin: 0 10px;">大小：</span>
                    <button onclick="this.setSize(5)" style="padding: 10px 20px; cursor: pointer;">小</button>
                    <button onclick="this.setSize(10)" style="padding: 10px 20px; cursor: pointer;">中</button>
                    <button onclick="this.setSize(20)" style="padding: 10px 20px; cursor: pointer;">大</button>
                </div>
                <div style="margin: 20px 0;">
                    <button onclick="this.clearCanvas()" style="padding: 10px 20px; cursor: pointer;">🗑️ 清空</button>
                    <button onclick="this.saveCanvas()" style="padding: 10px 20px; cursor: pointer;">💾 保存</button>
                </div>
                <canvas id="drawing-canvas" style="border: 2px solid #ccc; background: white; cursor: crosshair; display: block; margin: 0 auto;"></canvas>
            </div>
        `;
        
        this.canvas = document.getElementById('drawing-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        this.setupEvents();
    }
    
    setupCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = Math.min(600, container.offsetWidth - 40);
        this.canvas.height = this.canvas.width;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineWidth = this.currentSize;
    }
    
    setupEvents() {
        const canvas = this.canvas;
        let isDrawing = false;
        let lastX = 0;
        let lastY = 0;
        
        canvas.addEventListener('mousedown', (e) => {
            isDrawing = true;
            [lastX, lastY] = [e.offsetX, e.offsetY];
        });
        
        canvas.addEventListener('mousemove', (e) => {
            if (!isDrawing) return;
            
            this.ctx.beginPath();
            this.ctx.moveTo(lastX, lastY);
            this.ctx.lineTo(e.offsetX, e.offsetY);
            this.ctx.stroke();
            
            lastX = e.offsetX;
            lastY = e.offsetY;
        });
        
        canvas.addEventListener('mouseup', () => {
            isDrawing = false;
        });
        
        canvas.addEventListener('mouseleave', () => {
            isDrawing = false;
        });
        
        // 触摸事件
        canvas.addEventListener('touchstart', (e) => {
            isDrawing = true;
            const touch = e.touches[0];
            lastX = touch.clientX - canvas.offsetLeft;
            lastY = touch.clientY - canvas.offsetTop;
        });
        
        canvas.addEventListener('touchmove', (e) => {
            if (!isDrawing) return;
            e.preventDefault();
            const touch = e.touches[0];
            const x = touch.clientX - canvas.offsetLeft;
            const y = touch.clientY - canvas.offsetTop;
            
            this.ctx.beginPath();
            this.ctx.moveTo(lastX, lastY);
            this.ctx.lineTo(x, y);
            this.ctx.stroke();
            
            lastX = x;
            lastY = y;
        });
        
        canvas.addEventListener('touchend', () => {
            isDrawing = false;
        });
    }
    
    setColor(color) {
        this.currentColor = color;
        this.ctx.strokeStyle = color;
    }
    
    setSize(size) {
        this.currentSize = size;
        this.ctx.lineWidth = size;
    }
    
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.showToast('🗑️ 已清空');
    }
    
    saveCanvas() {
        const link = document.createElement('a');
        link.download = `涂鸦_${new Date().toLocaleString('zh-CN').replace(/[/:]/g, '-')}.png`;
        link.href = this.canvas.toDataURL('image/png');
        link.click();
        this.showToast('💾 已保存');
    }
    
    showToast(message) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = 'position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: rgba(0,1,1,0.8); color: white; padding: 12px 24px; border-radius: 8px; z-index: 1000;';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }
}

/**
 * 记忆翻牌游戏
 * 4x3卡片配对训练记忆力
 */
class MemoryCardsGame {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.gameType = 'memory-cards';
        this.name = '记忆翻牌';
        this.emojis = ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼'];
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.isLocked = false;
    }

    start() {
        document.getElementById('game-title').textContent = '🎴 记忆翻牌';
        this.initGame();
    }

    initGame() {
        const gameArea = document.getElementById('game-area');
        gameArea.innerHTML = `
            <div class="memory-stats">
                <div class="memory-stat">步数: <span id="memory-moves">0</span></div>
                <div class="memory-stat">配对: <span id="memory-pairs">0</span>/6</div>
            </div>
            <div class="memory-grid" id="memory-grid"></div>
            <button class="memory-restart-btn" id="memory-restart">🔄 重新开始</button>
            <div class="memory-celebration" id="memory-celebration">
                <div class="celebration-text">🎉 太棒了!</div>
            </div>
        `;

        this.addStyles();
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.isLocked = false;

        document.getElementById('memory-moves').textContent = '0';
        document.getElementById('memory-pairs').textContent = '0';
        document.getElementById('memory-celebration').classList.remove('active');

        this.createCards();
        
        document.getElementById('memory-restart').addEventListener('click', () => {
            this.initGame();
        });
    }
}

/**
 * 颜色配对游戏
 * 认识基本颜色
 */
class ColorMatchingGame {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.gameType = 'color-matching';
        this.name = '颜色配对';
        this.colors = [
            { name: '红色', hex: '#FF4757', light: '#FF6B7A' },
            { name: '黄色', hex: '#FFA502', light: '#FFB732' },
            { name: '蓝色', hex: '#3742FA', light: '#5352ED' },
            { name: '绿色', hex: '#2ED573', light: '#7BED9F' },
            { name: '橙色', hex: '#FF6B35', light: '#FF7F50' },
            { name: '紫色', hex: '#A55EEA', light: '#BE7ADB' },
            { name: '粉色', hex: '#FF69B4', light: '#FF85C1' },
            { name: '黑色', hex: '#2C3E50', light: '#34495E' }
        ];
        this.score = 0;
        this.targetColor = null;
        this.isAnimating = false;
    }

    start() {
        document.getElementById('game-title').textContent = '🎨 颜色配对';
        this.score = 0;
        this.initGame();
    }

    initGame() {
        const gameArea = document.getElementById('game-area');
        gameArea.innerHTML = `
            <div class="color-header">
                <div class="color-title">找颜色</div>
                <div class="color-score">
                    <span class="star">⭐</span> <span id="color-score">0</span>
                </div>
            </div>
            <div class="color-target">
                <div class="color-target-label">找到这个颜色：</div>
                <div class="color-target-name" id="color-target-name">红色</div>
            </div>
            <div class="color-feedback" id="color-feedback"></div>
            <div class="color-options" id="color-options"></div>
        `;

        this.addStyles();
        this.newRound();
    }

    addStyles() {
        if (document.getElementById('color-game-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'color-game-styles';
        styles.textContent = `
            .color-header {
                text-align: center;
                margin-bottom: 30px;
            }
            .color-title {
                font-size: 2rem;
                font-weight: bold;
                margin-bottom: 15px;
            }
            .color-score {
                font-size: 1.5rem;
                background: rgba(255,255,255,0.2);
                padding: 10px 30px;
                border-radius: 20px;
                display: inline-block;
            }
            .star { color: #FFD700; }
            .color-target {
                text-align: center;
                margin-bottom: 30px;
            }
            .color-target-label {
                font-size: 1.5rem;
                margin-bottom: 15px;
            }
            .color-target-name {
                font-size: 2.5rem;
                font-weight: bold;
                animation: colorPulse 1s ease-in-out infinite;
            }
            @keyframes colorPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
            .color-feedback {
                font-size: 2.5rem;
                font-weight: bold;
                text-align: center;
                min-height: 60px;
                margin-bottom: 20px;
            }
            .color-options {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
                max-width: 400px;
                margin: 0 auto;
                padding: 20px;
            }
            .color-btn {
                width: 120px;
                height: 120px;
                border: 6px solid white;
                border-radius: 25px;
                cursor: pointer;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                transition: transform 0.1s, box-shadow 0.1s;
                touch-action: manipulation;
            }
            .color-btn:active {
                transform: scale(0.9);
            }
            .color-btn.correct {
                animation: correctFlash 0.5s ease;
                box-shadow: 0 0 30px rgba(255,255,255,0.8);
            }
            @keyframes correctFlash {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.15); }
            }
            .color-btn.wrong {
                animation: wrongShake 0.5s ease;
            }
            @keyframes wrongShake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-15px); }
                75% { transform: translateX(15px); }
            }
        `;
        document.head.appendChild(styles);
    }

    newRound() {
        if (this.isAnimating) return;
        
        const shuffled = [...this.colors].sort(() => Math.random() - 0.5);
        const selectedColors = shuffled.slice(0, 4);
        
        this.targetColor = selectedColors[Math.floor(Math.random() * selectedColors.length)];
        document.getElementById('color-target-name').textContent = this.targetColor.name;
        
        const optionsArea = document.getElementById('color-options');
        optionsArea.innerHTML = '';
        
        const shuffledOptions = [...selectedColors].sort(() => Math.random() - 0.5);
        
        shuffledOptions.forEach(color => {
            const btn = document.createElement('button');
            btn.className = 'color-btn';
            btn.style.background = `linear-gradient(135deg, ${color.hex} 0%, ${color.light} 100%)`;
            btn.dataset.color = color.name;
            
            this.gameManager.addTouchFeedback(btn);
            btn.addEventListener('click', () => this.checkAnswer(color.name, btn));
            optionsArea.appendChild(btn);
        });
    }

    checkAnswer(selected, btnElement) {
        if (this.isAnimating) return;
        this.isAnimating = true;
        
        const isCorrect = selected === this.targetColor.name;
        const feedback = document.getElementById('color-feedback');
        
        if (isCorrect) {
            btnElement.classList.add('correct');
            feedback.textContent = '对了！🎉';
            this.playSound('correct');
            this.score++;
            document.getElementById('color-score').textContent = this.score;
            
            setTimeout(() => {
                feedback.textContent = '';
                btnElement.classList.remove('correct');
                this.isAnimating = false;
                this.newRound();
            }, 1200);
        } else {
            btnElement.classList.add('wrong');
            feedback.textContent = '再试试！💪';
            this.playSound('wrong');
            
            setTimeout(() => {
                feedback.textContent = '';
                btnElement.classList.remove('wrong');
                this.isAnimating = false;
            }, 800);
        }
    }

    playSound(type) {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            const config = {
                correct: { freq: 659.25, duration: 0.15, type: 'sine' },
                wrong: { freq: 196.00, duration: 0.2, type: 'square' }
            };
            
            const c = config[type] || config.correct;
            oscillator.type = c.type;
            oscillator.frequency.setValueAtTime(c.freq, audioCtx.currentTime);
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + c.duration);
            
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + c.duration);
        } catch(e) {}
    }
}

    addStyles() {
        if (document.getElementById('memory-styles')) return;
        const styles = document.createElement('style');
        styles.id = 'memory-styles';
        styles.textContent = `
            .memory-stats {
                display: flex;
                gap: 20px;
                justify-content: center;
                margin-bottom: 20px;
            }
            .memory-stat {
                background: rgba(255,255,255,0.2);
                padding: 8px 16px;
                border-radius: 20px;
            }
        }
        .memory-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 11px;
            max-width: 400px;
            margin: 0 auto 15px;
        }
    `;
        document.head.appendChild(styles);
    }

    createCards() {
        const grid = document.getElementById('memory-grid');
        grid.innerHTML = '';
        
        const emojiPairs = [...this.emojis, ...this.emojis];
        this.cards = this.shuffle(emojiPairs);
        
        this.cards.forEach((emoji, index) => {
            const card = document.createElement('div');
            card.className = 'memory-card';
            card.dataset.emoji = emoji;
            card.dataset.index = index;
            card.innerHTML = `
                <div class="memory-card-inner">
                    <div class="memory-card-face memory-card-back"></div>
                    <div class="memory-card-face memory-card-front">${emoji}</div>
                </div>
            `;
            
            this.gameManager.addTouchFeedback(card);
            card.addEventListener('click', () => this.flipCard(card));
            grid.appendChild(card);
        });
    }

    shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

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
            document.getElementById('memory-moves').textContent = this.moves;
            this.checkMatch();
        }
    }

    checkMatch() {
        this.isLocked = true;
        const [card1, card2] = this.flippedCards;
        const isMatch = card1.dataset.emoji === card2.dataset.emoji;

        if (isMatch) {
            setTimeout(() => {
                card1.classList.add('matched');
                card2.classList.add('matched');
                this.matchedPairs++;
                document.getElementById('memory-pairs').textContent = this.matchedPairs;
                
                this.flippedCards = [];
                this.isLocked = false;

                if (this.matchedPairs === 6) {
                    setTimeout(() => this.showCelebration(), 500);
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

    showCelebration() {
        const celebration = document.getElementById('memory-celebration');
        celebration.classList.add('active');
        
        // 创建confetti
        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.textContent = ['🎉', '🎊', '⭐', '💫'][Math.floor(Math.random() * 4)];
                confetti.style.cssText = `
                    position: absolute;
                    left: ${Math.random() * 100}vw;
                    font-size: ${15 + Math.random() * 20}px;
                    animation: fall 3s linear forwards;
                `;
                celebration.appendChild(confetti);
                setTimeout(() => confetti.remove(), 3000);
            }, i * 100);
        }
    }
}

