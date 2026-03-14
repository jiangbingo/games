class App {
    constructor() {
        this.games = new Games();
        this.storage = new CloudStorage(); // 使用CloudStorage（自动fallback到LocalStorage）
        this.gameManager = new GameManager(this.storage);
        this.currentUser = null;
        this.init();
    }

    async init() {
        // 检查云端存储是否可用
        await this.storage.checkCloudAvailability();
        
        this.checkCurrentUser();
        this.setupEventListeners();
        this.setupTouchEvents();
    }

    checkCurrentUser() {
        const currentUser = this.storage.userStorage.getCurrentUser();
        if (currentUser) {
            this.currentUser = currentUser;
            this.showMainMenu();
        } else {
            this.showLoginScreen();
        }
    }

    showLoginScreen() {
        const loginScreen = document.getElementById('login-screen');
        const mainMenu = document.getElementById('main-menu');
        const gameContainer = document.getElementById('game-container');

        loginScreen.style.display = 'flex';
        mainMenu.style.display = 'none';
        gameContainer.style.display = 'none';

        this.renderUserList();
    }

    showMainMenu() {
        const loginScreen = document.getElementById('login-screen');
        const mainMenu = document.getElementById('main-menu');
        const gameContainer = document.getElementById('game-container');
        const userInfo = document.getElementById('user-info');
        const currentUserName = document.getElementById('current-user-name');

        loginScreen.style.display = 'none';
        mainMenu.style.display = 'block';
        gameContainer.style.display = 'none';
        userInfo.style.display = 'flex';
        currentUserName.textContent = `👋 ${this.currentUser.username}`;
    }

    renderUserList() {
        const userList = document.getElementById('user-list');
        const users = this.storage.userStorage.getAllUsers();
        const currentUserId = this.storage.userStorage.getCurrentUserId();

        if (users.length === 0) {
            userList.innerHTML = '<p class="section-title" style="text-align:center;">还没有用户，创建一个吧！</p>';
            return;
        }

        userList.innerHTML = users.map(user => `
            <div class="user-item ${user.userId === currentUserId ? 'current' : ''}" data-user-id="${user.userId}">
                <div class="user-item-avatar">${this.getAvatar(user.username)}</div>
                <div class="user-item-name">${user.username}</div>
            </div>
        `).join('');

        // 添加点击事件
        userList.querySelectorAll('.user-item').forEach(item => {
            this.addTouchFeedback(item);
            item.addEventListener('click', () => {
                const userId = item.dataset.userId;
                this.switchUser(userId);
            });
        });
    }

    getAvatar(username) {
        const avatars = ['👶', '👧', '👦', '🧒', '👩', '👨', '🧑', '👱', '👴', '👵'];
        const index = username.charCodeAt(0) % avatars.length;
        return avatars[index];
    }

    setupEventListeners() {
        // 登录按钮
        const loginBtn = document.getElementById('login-btn');
        this.addTouchFeedback(loginBtn);
        loginBtn.addEventListener('click', () => {
            this.handleLogin();
        });

        // 用户名输入框回车
        const usernameInput = document.getElementById('username');
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleLogin();
            }
        });

        // 切换用户按钮
        const switchUserBtn = document.getElementById('switch-user-btn');
        if (switchUserBtn) {
            this.addTouchFeedback(switchUserBtn);
            switchUserBtn.addEventListener('click', () => {
                this.showLoginScreen();
            });
        }

        // 游戏卡片按钮
        const actionButtons = document.querySelectorAll('.action-btn');
        actionButtons.forEach(btn => {
            this.addTouchFeedback(btn);
            btn.addEventListener('click', async (e) => {
                e.stopPropagation(); // 防止冒泡到卡片
                const gameCard = btn.closest('.game-card');
                const gameType = gameCard.dataset.game;
                const mode = btn.dataset.mode;
                await this.openGame(gameType, mode);
            });
        });

        // 返回按钮
        const backBtn = document.getElementById('back-btn');
        this.addTouchFeedback(backBtn);
        backBtn.addEventListener('click', () => {
            this.backToMenu();
        });
    }

    setupTouchEvents() {
        // 触摸反馈已在 setupEventListeners 中处理
    }

    addTouchFeedback(element) {
        element.addEventListener('touchstart', () => {
            element.style.transform = 'scale(0.95)';
        }, { passive: true });
        
        element.addEventListener('touchend', () => {
            element.style.transform = 'scale(1)';
        }, { passive: true });
    }

    async handleLogin() {
        const usernameInput = document.getElementById('username');
        const username = usernameInput.value.trim();
        const errorDiv = document.querySelector('.error-message');

        // 移除旧的错误信息
        if (errorDiv) {
            errorDiv.remove();
        }

        try {
            const user = await this.storage.createUser(username);
            this.currentUser = user;
            usernameInput.value = '';
            this.showMainMenu();
        } catch (error) {
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.textContent = error.message;
            usernameInput.parentNode.insertBefore(errorMessage, usernameInput);

            // 震动提示（如果支持）
            if (navigator.vibrate) {
                navigator.vibrate(200);
            }
        }
    }

    switchUser(userId) {
        const user = this.storage.userStorage.switchUser(userId);
        if (user) {
            this.currentUser = user;
            this.showMainMenu();
        }
    }

    async openGame(gameType, mode = 'campaign') {
        const mainMenu = document.getElementById('main-menu');
        const gameContainer = document.getElementById('game-container');
        const levelDisplay = document.getElementById('level-display');

        mainMenu.style.display = 'none';
        gameContainer.style.display = 'block';

        // 获取当前关卡（使用 await 正确处理 Promise）
        const currentLevel = await this.gameManager.getCurrentLevel(gameType);
        if (levelDisplay) {
            if (mode === 'endless') {
                levelDisplay.textContent = '模式: 无限挑战';
            } else {
                levelDisplay.textContent = `关卡: ${currentLevel}`;
            }
        }

        const gameNames = {
            'color-match': '🎨 颜色配对',
            'shape-match': '⭐ 形状识别',
            'simple-puzzle': '🧩 简单拼图',
            'number-count': '🔢 数字认知',
            'memory-match': '🧠 记忆大师',
            'letter-match': '🔤 字母配对'
        };

        document.getElementById('game-title').textContent = gameNames[gameType];
        await this.games.startGame(gameType, mode, currentLevel);
    }

    backToMenu() {
        const mainMenu = document.getElementById('main-menu');
        const gameContainer = document.getElementById('game-container');
        const gameArea = document.getElementById('game-area');
        const userInfo = document.getElementById('user-info');
        
        gameArea.innerHTML = '';
        gameContainer.style.display = 'none';
        mainMenu.style.display = 'block';
        userInfo.style.display = 'flex';
        mainMenu.style.animation = 'fadeIn 0.3s ease';
    }

    saveGameProgress(gameId, progress) {
        return this.gameManager.saveProgress(gameId, progress);
    }

    loadGameProgress(gameId) {
        return this.gameManager.loadProgress(gameId);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('游戏暂停');
        // 可以在这里保存当前游戏状态
    } else {
        console.log('游戏继续');
    }
});
// 分类筛选功能
document.addEventListener('DOMContentLoaded', function() {
    const categoryTabs = document.querySelectorAll('.category-tab');
    const gameCards = document.querySelectorAll('.game-card');
    
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const category = this.dataset.category;
            
            // 更新标签状态
            categoryTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // 筛选游戏卡片
            gameCards.forEach(card => {
                if (category === 'all') {
                    card.classList.remove('hidden');
                } else {
                    const cardCategory = card.dataset.category;
                    if (cardCategory === category) {
                        card.classList.remove('hidden');
                    } else {
                        card.classList.add('hidden');
                    }
                }
            });
        });
    });
});
