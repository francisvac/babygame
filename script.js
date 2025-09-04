document.addEventListener('DOMContentLoaded', () => {
    const gameArea = document.getElementById('game-area');
    const babiesContainer = document.getElementById('babies-container');
    const basket = document.getElementById('basket');
    const scoreElement = document.getElementById('score');
    const revealContainer = document.getElementById('reveal-container');
    const playAgainBtn = document.getElementById('play-again');
    const babyGenderSpan = document.getElementById('baby-gender');
    
    // Game state
    let score = 0;
    let caughtBabies = 0;
    let timeLeft = 30;
    let gameInterval;
    let spawnInterval;
    let isGameActive = true;
    let basketPosition = 50; // percentage
    let basketWidth = 80; // pixels
    let basketSpeed = 3; // Increased from 2 to 3 for faster movement
    let isMovingLeft = false;
    let isMovingRight = false;
    
    // Game settings
    const WINNING_SCORE = 100;
    const MISSED_BABY_PENALTY = 5; // Points to deduct for each missed baby
    const ITEM_TYPES = {
        BABY: 'baby',
        POOP: 'poop',
        BARF: 'barf'
    };
    
    // Speed settings
    const GAME_SPEED_MULTIPLIER = 1.5; // Increase game speed by 50%
    const BASE_FALL_SPEED = 2; // Base falling speed
    
    // Controls
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') isMovingLeft = true;
        if (e.key === 'ArrowRight') isMovingRight = true;
    });
    
    document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft') isMovingLeft = false;
        if (e.key === 'ArrowRight') isMovingRight = false;
    });
    
    // Touch controls for direct basket dragging
    let isDragging = false;
    let initialX;
    let initialBasketLeft;
    
    // Touch start handler
    basket.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        isDragging = true;
        initialX = touch.clientX;
        initialBasketLeft = basket.offsetLeft;
        e.stopPropagation();
        e.preventDefault();
    }, { passive: false });
    
    // Touch move handler - makes basket follow finger
    gameArea.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        
        const touch = e.touches[0];
        const deltaX = touch.clientX - initialX;
        const newLeft = initialBasketLeft + deltaX;
        const gameAreaRect = gameArea.getBoundingClientRect();
        const basketWidth = basket.offsetWidth;
        
        // Calculate new position as percentage
        let newPosition = ((newLeft - gameAreaRect.left) / (gameAreaRect.width - basketWidth)) * 100;
        
        // Keep basket within bounds
        newPosition = Math.max(0, Math.min(100, newPosition));
        
        // Update basket position
        basketPosition = newPosition;
        basket.style.left = `${basketPosition}%`;
        
        e.preventDefault();
    }, { passive: false });
    
    // Touch end handler
    document.addEventListener('touchend', () => {
        isDragging = false;
    });
    
    // Cancel touch if user scrolls
    document.addEventListener('touchcancel', () => {
        isDragging = false;
    });
    
    // Prevent scrolling when touching the game area
    gameArea.addEventListener('touchmove', (e) => {
        if (isDragging) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Prevent scrolling on touch devices when game is active
    document.addEventListener('touchmove', (e) => {
        if (isGameActive) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Add touch controls hint for mobile users
    if ('ontouchstart' in window || navigator.maxTouchPoints) {
        const touchHint = document.createElement('div');
        touchHint.textContent = '← Touch and drag to move →';
        touchHint.style.cssText = `
            position: absolute;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 1rem;
            z-index: 100;
            pointer-events: none;
            animation: fadeOut 3s forwards 3s;
        `;
        gameArea.appendChild(touchHint);
        
        // Add fade out animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeOut {
                to { opacity: 0; transform: translateX(-50%) translateY(20px); }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Randomly decide the gender (50/50 chance)
    const isBoy = Math.random() >= 0.5;
    
    // Update game state
    function updateGame() {
        if (!isGameActive) return;
        
        // Move basket with increased speed
        if (isMovingLeft) {
            basketPosition = Math.max(0, basketPosition - basketSpeed * 1.5); // Faster movement
        }
        if (isMovingRight) {
            basketPosition = Math.min(100 - (basketWidth / gameArea.offsetWidth * 100), basketPosition + basketSpeed * 1.5); // Faster movement
        }
        
        basket.style.left = `${basketPosition}%`;
        
        // Move and check items
        const items = document.querySelectorAll('.falling-item');
        items.forEach(item => {
            const top = parseFloat(item.style.top) || 0;
            const speed = parseFloat(item.dataset.speed) || 2;
            const newTop = top + speed;
            item.style.top = `${newTop}px`;
            
            // Check if caught or missed
            if (isColliding(item, basket)) {
                handleItemCatch(item);
            } else if (newTop > gameArea.offsetHeight) {
                // Item missed the basket
                if (item.dataset.type === ITEM_TYPES.BABY) {
                    // Penalty for missing a baby
                    score = Math.max(0, score - MISSED_BABY_PENALTY);
                    scoreElement.textContent = `Score: ${score}`;
                    
                    // Show penalty notification
                    const penalty = document.createElement('div');
                    penalty.className = 'penalty';
                    penalty.textContent = `-${MISSED_BABY_PENALTY}`;
                    penalty.style.position = 'absolute';
                    penalty.style.left = item.style.left;
                    penalty.style.top = `${gameArea.offsetHeight}px`;
                    penalty.style.color = 'red';
                    penalty.style.fontWeight = 'bold';
                    penalty.style.fontSize = '1.5rem';
                    penalty.style.animation = 'float-up 1s forwards';
                    gameArea.appendChild(penalty);
                    
                    // Remove penalty notification after animation
                    setTimeout(() => {
                        if (penalty.parentNode) {
                            penalty.remove();
                        }
                    }, 1000);
                }
                item.remove();
            }
        });
        
        requestAnimationFrame(updateGame);
    }
    
    function isColliding(item, basket) {
        const itemRect = item.getBoundingClientRect();
        const basketRect = basket.getBoundingClientRect();
        
        return !(
            itemRect.bottom < basketRect.top ||
            itemRect.top > basketRect.bottom ||
            itemRect.right < basketRect.left + 20 ||
            itemRect.left > basketRect.right - 20
        );
    }
    
    function handleItemCatch(item) {
        const itemType = item.dataset.type;
        
        if (itemType === ITEM_TYPES.BABY) {
            caughtBabies++;
            score += 10;
            scoreElement.textContent = `Score: ${score}/100`;
            
            if (score >= WINNING_SCORE) {
                endGame(true);
            }
        } else if (itemType === ITEM_TYPES.POOP || itemType === ITEM_TYPES.BARF) {
            // Penalty for catching poop or barf
            score = Math.max(0, score - 5);
            scoreElement.textContent = `Score: ${score}/100`;
        }
        
        // Create catch effect
        const effect = document.createElement('div');
        effect.className = 'catch-effect';
        effect.textContent = itemType === ITEM_TYPES.BABY ? '👶 +10' : '💩 -5';
        effect.style.color = itemType === ITEM_TYPES.BABY ? '#4CAF50' : '#e74c3c';
        effect.style.left = `${item.getBoundingClientRect().left}px`;
        effect.style.top = `${item.getBoundingClientRect().top}px`;
        document.body.appendChild(effect);
        
        setTimeout(() => {
            effect.remove();
        }, 1000);
        
        item.remove();
    }
    
    function spawnItem() {
        if (!isGameActive) return;
        
        const item = document.createElement('div');
        item.className = 'falling-item';
        
        // Randomly decide item type
        const rand = Math.random();
        let itemType, emoji, speed;
        
        if (rand < 0.6) { // 60% chance for baby
            itemType = ITEM_TYPES.BABY;
            emoji = '👶';
            speed = (2 + Math.random() * 2) * GAME_SPEED_MULTIPLIER; // Apply speed multiplier
        } else if (rand < 0.8) { // 20% chance for poop
            itemType = ITEM_TYPES.POOP;
            emoji = '💩';
            speed = (3 + Math.random() * 2) * GAME_SPEED_MULTIPLIER; // Apply speed multiplier
        } else { // 20% chance for barf
            itemType = ITEM_TYPES.BARF;
            emoji = '🤮';
            speed = (3 + Math.random() * 2) * GAME_SPEED_MULTIPLIER; // Apply speed multiplier
        }
        
        item.dataset.type = itemType;
        item.dataset.speed = speed;
        item.textContent = emoji;
        
        // Random position at top of screen
        const left = Math.random() * (gameArea.offsetWidth - 40);
        item.style.left = `${left}px`;
        item.style.top = '-40px';
        
        // Add rotation animation
        item.style.animation = `spin ${3 + Math.random() * 3}s linear infinite`;
        
        babiesContainer.appendChild(item);
    }
    
    // Update timer display
    function updateTimer() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        document.getElementById('timer').textContent = `⏱️ ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    
    // Handle special balloon effects
    function handleSpecialBalloon(balloon) {
        const type = balloon.dataset.type;
        const effect = document.createElement('div');
        effect.className = 'effect';
        
        switch(type) {
            case 'bomb':
                // Remove all balloons
                effect.textContent = 'BOOM!';
                effect.style.color = 'red';
                document.body.appendChild(effect);
                
                const allBalloons = document.querySelectorAll('.balloon:not(.popped)');
                allBalloons.forEach(b => {
                    b.classList.add('popped');
                    balloonsPopped++;
                });
                score += 5;
                break;
                
            case 'clock':
                // Add time
                timeLeft += 10;
                effect.textContent = '+10s';
                effect.style.color = '#4CAF50';
                document.body.appendChild(effect);
                score += 2;
                break;
                
            case 'multiplier':
                // Double points for next 3 balloons
                effect.textContent = '2x Points!';
                effect.style.color = '#FFD700';
                document.body.appendChild(effect);
                score += 3;
                break;
                
            case 'rainbow':
                // Bonus points
                const bonus = 10;
                effect.textContent = `+${bonus} Points!`;
                effect.style.background = 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)';
                effect.style.webkitBackgroundClip = 'text';
                effect.style.color = 'transparent';
                document.body.appendChild(effect);
                score += bonus;
                break;
        }
        
        // Remove effect after animation
        setTimeout(() => effect.remove(), 1000);
    }

    // Pop balloon animation and check win condition
    function popBalloon(balloon) {
        if (balloon.classList.contains('popped') || !isGameActive) return;
        
        // Get the baby image if exists
        const babyImage = balloon.querySelector('.baby-image');
        if (babyImage) {
            // Create a floating baby effect
            const baby = babyImage.cloneNode(true);
            baby.style.position = 'fixed';
            baby.style.top = `${balloon.getBoundingClientRect().top}px`;
            baby.style.left = `${balloon.getBoundingClientRect().left}px`;
            baby.style.width = '80px';
            baby.style.height = '96px';
            baby.style.transform = 'scale(1) rotate(0deg)';
            baby.style.transition = 'all 1s ease-out';
            baby.style.zIndex = '1000';
            baby.style.pointerEvents = 'none';
            document.body.appendChild(baby);
            
            // Animate baby floating up
            setTimeout(() => {
                baby.style.transform = `translateY(-100px) scale(1.5) rotate(${Math.random() * 20 - 10}deg)`;
                baby.style.opacity = '0';
                
                // Remove after animation
                setTimeout(() => baby.remove(), 1000);
            }, 10);
        }
        
        balloon.classList.add('popped');
        balloonsPopped++;
        
        // Handle special balloons
        if (balloon.dataset.type) {
            handleSpecialBalloon(balloon);
        } else {
            // Regular balloon with baby
            score += 1;
        }
        
        // Update score display
        scoreElement.textContent = `Score: ${score} | Balloons: ${balloonsPopped}/${totalBalloons}`;
        
        // Play pop sound
        const popSound = new Audio('pop.mp3');
        popSound.play().catch(e => console.log("Audio play failed:", e));
        
        // Check win/lose conditions
        if (balloonsPopped >= totalBalloons) {
            endGame(true);
        }
    }
    
    // Create confetti effect
    function createConfetti() {
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff8800', '#8800ff'];
        const container = document.body;
        
        for (let i = 0; i < 150; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            
            // Random properties
            const size = Math.random() * 10 + 5;
            const posX = Math.random() * window.innerWidth;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const animationDuration = Math.random() * 3 + 2;
            const delay = Math.random() * 5;
            const shape = Math.random() > 0.5 ? 'circle' : 'square';
            
            // Apply styles
            confetti.style.width = `${size}px`;
            confetti.style.height = `${size}px`;
            confetti.style.left = `${posX}px`;
            confetti.style.backgroundColor = color;
            confetti.style.animationDuration = `${animationDuration}s`;
            confetti.style.animationDelay = `${delay}s`;
            confetti.style.borderRadius = shape === 'circle' ? '50%' : '2px';
            
            // Random rotation
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            
            container.appendChild(confetti);
            
            // Remove confetti after animation
            setTimeout(() => {
                confetti.remove();
            }, (animationDuration + delay) * 1000);
        }
    }
    
    // Reveal the gender
    function revealGender() {
        revealContainer.classList.add('visible');
        
        if (isBoy) {
            genderReveal.textContent = '👶 It\'s a Boy! 👶';
            document.body.style.backgroundColor = '#e3f2fd';
            revealContainer.style.backgroundColor = 'rgba(187, 222, 251, 0.9)';
            // Blue-themed confetti
            createConfetti();
        } else {
            genderReveal.textContent = '👧 It\'s a Girl! 👧';
            document.body.style.backgroundColor = '#fce4ec';
            revealContainer.style.backgroundColor = 'rgba(248, 187, 208, 0.9)';
            // Pink-themed confetti
            createConfetti();
        }
    }
    
    // Game over handler
    function endGame(isWin) {
        isGameActive = false;
        clearInterval(gameInterval);
        clearInterval(spawnInterval);
        
        if (isWin) {
            // Create fullscreen overlay for the win message
            const fullscreenOverlay = document.createElement('div');
            fullscreenOverlay.id = 'fullscreen-win';
            fullscreenOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(255, 255, 255, 0.98);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                text-align: center;
                padding: 20px;
            `;
            
            // Create close button
            const closeButton = document.createElement('button');
            closeButton.textContent = '✕';
            closeButton.style.cssText = `
                position: absolute;
                top: 20px;
                right: 20px;
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #666;
            `;
            closeButton.onclick = () => fullscreenOverlay.remove();
            
            // Create message content
            const messageContent = document.createElement('div');
            messageContent.style.maxWidth = '800px';
            messageContent.innerHTML = `
                <div style="font-size: 2.5em; margin: 40px 0; line-height: 1.4;">
                    <span style="color: #e91e63">Anisha</span> & <span style="color: #2196f3">Francis</span> are having a 
                    <span style="color: #2196f3; font-weight: bold; font-size: 1.2em;">BOY</span>! 👶
                </div>
                <div style="font-size: 1.5em; margin: 30px 0; color: #555;">
                    Final Score: ${score}
                </div>
                <button onclick="window.location.reload()" style="
                    background: #4CAF50;
                    color: white;
                    border: none;
                    padding: 15px 40px;
                    font-size: 1.2em;
                    border-radius: 50px;
                    cursor: pointer;
                    margin-top: 20px;
                    transition: transform 0.2s, background 0.2s;
                ">
                    Play Again
                </button>
            `;
            
            // Assemble and show the overlay
            fullscreenOverlay.appendChild(closeButton);
            fullscreenOverlay.appendChild(messageContent);
            document.body.appendChild(fullscreenOverlay);
            
            // Hide the original reveal container
            revealContainer.style.display = 'none';
            
            // Confetti effect for win
            createConfetti();
        } else {
            // Create fullscreen overlay for the game over message
            const gameOverOverlay = document.createElement('div');
            gameOverOverlay.id = 'fullscreen-gameover';
            gameOverOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(255, 235, 238, 0.98);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                text-align: center;
                padding: 20px;
            `;
            
            // Create close button
            const closeButton = document.createElement('button');
            closeButton.textContent = '✕';
            closeButton.style.cssText = `
                position: absolute;
                top: 20px;
                right: 20px;
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #666;
            `;
            closeButton.onclick = () => gameOverOverlay.remove();
            
            // Create message content
            const messageContent = document.createElement('div');
            messageContent.style.maxWidth = '800px';
            messageContent.innerHTML = `
                <h1 style="color: #e74c3c; font-size: 3em; margin-bottom: 20px;">⏰ TIME'S UP! ⏰</h1>
                <div style="font-size: 2.5em; margin: 20px 0; line-height: 1.4;">
                    <span style="color: #e91e63">Anisha</span> & <span style="color: #2196f3">Francis</span> are having a 
                    <span style="color: #e74c3c; font-weight: bold; font-size: 1.2em;">BABY</span>! 👶
                </div>
                <div style="font-size: 1.8em; margin: 20px 0; color: #d32f2f;">
                    Final Score: ${score}
                </div>
                <div style="font-size: 1.4em; margin: 30px 0; color: #5d4037; background: #fff3e0; padding: 15px; border-radius: 10px; max-width: 600px; line-height: 1.5;">
                    💡 <strong>Hint:</strong> Score 100 points to find out if the baby is a boy or girl!
                </div>
                <button onclick="window.location.reload()" class="btn primary large" style="margin-top: 2rem;">
                    Try Again
                </button>
            `;
            
            // Assemble and show the overlay
            gameOverOverlay.appendChild(closeButton);
            gameOverOverlay.appendChild(messageContent);
            document.body.appendChild(gameOverOverlay);
            
            // Hide the original reveal container
            revealContainer.style.display = 'none';
        }
    }

    // Reset game
    function resetGame() {
        // Reset game state
        score = 0;
        caughtBabies = 0;
        timeLeft = 30;
        isGameActive = true;
        basketPosition = 50;
        
        // Update displays
        scoreElement.textContent = `Score: ${score}/100`;
        updateTimer();
        
        // Clear existing elements
        babiesContainer.innerHTML = '';
        document.querySelectorAll('.effect, .confetti, .catch-effect').forEach(el => el.remove());
        
        // Hide reveal container and reset styles
        revealContainer.classList.remove('visible');
        revealContainer.classList.add('hidden');
        document.body.style.backgroundColor = '#f0f8ff';
        revealContainer.style.backgroundColor = '';
        revealContainer.style.display = 'none'; // Ensure it's hidden initially
        
        // Start game loops
        clearInterval(gameInterval);
        clearInterval(spawnInterval);
        
        // Game timer
        gameInterval = setInterval(() => {
            if (!isGameActive) return;
            
            timeLeft--;
            updateTimer();
            
            if (timeLeft <= 0) {
                endGame(false);
            }
        }, 1000);
        
        // Item spawner
        spawnInterval = setInterval(spawnItem, 1000);
        
        // Start game loop
        requestAnimationFrame(updateGame);
    }
    
    // Event listener for play again button
    playAgainBtn.addEventListener('click', resetGame);
    
    // Add game styles and animations
    const gameStyle = document.createElement('style');
    gameStyle.textContent = `
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        @keyframes float-up {
            0% { transform: translateY(0) scale(1); opacity: 1; }
            100% { transform: translateY(-50px) scale(1.5); opacity: 0; }
        }
        
        .catch-effect {
            position: fixed;
            font-size: 1.5rem;
            font-weight: bold;
            pointer-events: none;
            z-index: 1000;
            animation: float-up 1s ease-out forwards;
        }
        
        #game-area {
            position: relative;
            width: 100%;
            height: 60vh;
            background-color: #e3f2fd;
            border-radius: 10px;
            overflow: hidden;
            margin: 1rem 0;
        }
        
        #basket {
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 3rem;
            cursor: pointer;
            transition: transform 0.1s ease-out;
            z-index: 100;
            touch-action: none; /* Prevent default touch behaviors */
            user-select: none; /* Prevent text selection */
            -webkit-user-drag: none; /* Prevent dragging on WebKit browsers */
        }
        
        .falling-item {
            position: absolute;
            font-size: 2rem;
            width: 40px;
            height: 40px;
            text-align: center;
            line-height: 40px;
            user-select: none;
            z-index: 10;
        }
        
        .falling-item[data-type="baby"] {
            color: #ff6b6b;
        }
        
        .falling-item[data-type="poop"] {
            color: #8d6e63;
        }
        
        .falling-item[data-type="barf"] {
            color: #9ccc65;
        }
    `;
    document.head.appendChild(gameStyle);
    
    // Initialize the game
    resetGame();
});
