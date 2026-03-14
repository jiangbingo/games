// 分类筛选功能
window.filterByCategory = function(category, clickedElement) {
    console.log('筛选分类:', category);
    
    const categoryTabs = document.querySelectorAll('.category-tab');
    const gameCards = document.querySelectorAll('.game-card');
    
    // 更新标签状态
    categoryTabs.forEach(t => t.classList.remove('active'));
    if (clickedElement) {
        clickedElement.classList.add('active');
    }
    
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
};
