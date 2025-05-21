// 生成煙火動畫
function createFirework() {
    const container = document.getElementById('podium-container');
    const firstPlayer = document.querySelector('.first');
    const firstAvatar = firstPlayer.querySelector('.player-avatar');
    
    // 獲取第一名頭像的位置和尺寸
    const firstRect = firstAvatar.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    // 計算相對於容器的位置
    const centerX = firstRect.left - containerRect.left + firstRect.width / 2;
    const centerY = firstRect.top - containerRect.top + firstRect.height / 2;
    
    // 煙火的半徑範圍
    const radius = Math.min(firstRect.width, firstRect.height) * 2;
    
    // 煙火爆炸的粒子數量
    const particleCount = 20;
    
    // 創建煙火爆炸效果
    for (let i = 0; i < particleCount; i++) {
        // 隨機角度
        const angle = Math.random() * Math.PI * 2;
        // 隨機距離（使用平方根來使分佈更均勻）
        const distance = Math.sqrt(Math.random()) * radius;
        
        // 計算粒子位置
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        
        // 隨機顏色
        const colors = ['#FF0000', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF', '#FFFFFF'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        // 創建粒子元素
        const particle = document.createElement('div');
        particle.className = 'firework';
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.backgroundColor = color;
        
        // 隨機延遲開始動畫
        particle.style.animationDelay = `${Math.random() * 0.5}s`;
        
        // 添加到容器
        container.appendChild(particle);
        
        // 動畫結束後移除元素
        particle.addEventListener('animationend', () => {
            particle.remove();
        });
    }
}

// 定期創建煙火
setInterval(createFirework, 1000);

// 頁面加載時立即創建煙火
document.addEventListener('DOMContentLoaded', () => {
    createFirework();
    
    // 為前三名添加閃光效果
    const shineElements = document.querySelectorAll('.shine');
    shineElements.forEach((shine, index) => {
        shine.style.animationDelay = `${index * 0.7}s`;
    });
});