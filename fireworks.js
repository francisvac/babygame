class Fireworks {
    constructor(container) {
        this.container = container || document.body;
        this.colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff8800', '#ff0088'];
        this.fireworks = [];
        this.isActive = false;
    }

    start() {
        if (this.isActive) return;
        this.isActive = true;
        this.launchFirework();
        this.fireworkInterval = setInterval(() => this.launchFirework(), 1000);
    }

    stop() {
        this.isActive = false;
        clearInterval(this.fireworkInterval);
        this.fireworks.forEach(firework => {
            if (firework.element && firework.element.parentNode) {
                this.container.removeChild(firework.element);
            }
        });
        this.fireworks = [];
    }

    launchFirework() {
        if (!this.isActive) return;

        const firework = document.createElement('div');
        firework.className = 'firework';
        
        // Random position
        const x = 10 + Math.random() * 80; // 10% to 90% of container width
        const y = 60; // Start from bottom
        
        // Random color
        const color = this.colors[Math.floor(Math.random() * this.colors.length)];
        
        // Set position and color
        firework.style.left = `${x}%`;
        firework.style.top = `${y}vh`;
        firework.style.color = color;
        
        // Create firework pattern
        const pattern = [];
        const particleCount = 30 + Math.floor(Math.random() * 20);
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const distance = 10 + Math.random() * 20;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance + (Math.random() - 0.5) * 10;
            
            const particle = document.createElement('div');
            particle.className = 'firework-particle';
            particle.style.setProperty('--tx', `${tx}vmin`);
            particle.style.setProperty('--ty', `${ty}vmin`);
            particle.style.background = color;
            particle.style.animationDelay = `${Math.random() * 0.5}s`;
            particle.style.animationDuration = `${1 + Math.random() * 2}s`;
            
            firework.appendChild(particle);
        }
        
        // Add to DOM
        this.container.appendChild(firework);
        
        // Remove after animation
        setTimeout(() => {
            if (firework.parentNode === this.container) {
                this.container.removeChild(firework);
            }
            this.fireworks = this.fireworks.filter(f => f !== firework);
        }, 2000);
        
        this.fireworks.push(firework);
    }
}

// Initialize fireworks when the winning screen is shown
function initFireworks() {
    const winScreen = document.querySelector('.win-screen');
    if (!winScreen) return;
    
    const fireworks = new Fireworks(winScreen);
    fireworks.start();
    
    // Clean up when winning screen is closed
    const observer = new MutationObserver(() => {
        if (!document.body.contains(winScreen)) {
            fireworks.stop();
            observer.disconnect();
        }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    return fireworks;
}

// Export for use in other scripts
window.Fireworks = Fireworks;
window.initFireworks = initFireworks;
