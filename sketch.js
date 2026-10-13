//=====================
//CONFIGURAÇÃO INICIAL
//=====================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const spaceGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
spaceGradient.addColorStop(0, "#101b4d");
spaceGradient.addColorStop(0.55, "#080e29");
spaceGradient.addColorStop(1, "#02040d");

const keys = {};

let score = 0;
let gameOver = false;
let gameStarted = false;
let shopOpen = false;
let catalogOpen = false;
let wave = 1;
let lives = 3;
let playerInvulnerableUntil = 0;
let nextPlayerShotAt = 0;
let nextEnemyShotAt = 0;
let rapidFireLevel = 0;
let spreadShotLevel = 0;
let speedLevel = 0;
let creditLevel = 0;
let shieldCharges = 0;
let frameScale = 1;
let previousFrameTime = 0;
const MAX_LIVES = 5;
const MAX_PLAYER_BULLETS = 90;
const MAX_ENEMY_BULLETS = 60;
const stars = Array.from({ length: 64 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2 + 0.5,
    speed: Math.random() * 1.2 + 0.3,
    opacity: Math.random() * 0.7 + 0.3,
}));

//=====================
//JOGADOR
//=====================

const player = {
    width: 50,
    height: 30,
    speed: 5,
    x: canvas.width / 2 - 25,
    y: canvas.height - 70,
};
const playerSkins = {
    default: {
        name: "NAVE PADRÃO",
        style: "fighter",
        hull: "#1bd8ff",
        trim: "#d8faff",
        wing: "#ff4f9a",
        engine: "#ffb52e",
    },
    neon: {
        name: "NEON",
        style: "sleek",
        hull: "#c45bff",
        trim: "#f4d5ff",
        wing: "#46e5cf",
        engine: "#ffe766",
    },
    crimson: {
        name: "CRIMSON",
        style: "heavy",
        hull: "#ff4e62",
        trim: "#ffe1b8",
        wing: "#ff9a4a",
        engine: "#ffe766",
    },
    gold: {
        name: "ORO",
        style: "royal",
        hull: "#ffc857",
        trim: "#fff4c2",
        wing: "#fff0b0",
        engine: "#ff704d",
    },
};
const ownedSkins = new Set(["default"]);
let selectedSkin = "default";
const PLAYER_TOP_BOUNDARY = 86;

//=====================
//TIROS
//=====================

const bullets = [];
const enemyBullets = [];
const bulletSpeed = 10;
const shopItems = [
    { id: "rapid", title: "TIRO RÁPIDO", description: "Dispare com mais frequência", baseCost: 100, color: "#46e5cf" },
    { id: "spread", title: "TIRO TRIPLO", description: "Lance três projéteis por vez", baseCost: 150, color: "#ba73ff" },
    { id: "life", title: "NAVE EXTRA", description: "Recupere uma vida", baseCost: 200, color: "#ff548c" },
    { id: "shield", title: "ESCUDO", description: "Bloqueia um acerto", baseCost: 160, color: "#54a0ff" },
    { id: "speed", title: "MOTOR TURBO", description: "Aumenta sua velocidade", baseCost: 130, color: "#ffc857" },
    { id: "credits", title: "BÔNUS DE CRÉDITOS", description: "Mais créditos por inimigo", baseCost: 180, color: "#69e879" },
    { id: "skin-neon", title: "SKIN NEON", description: "Nave ágil, visual neon", baseCost: 220, color: "#c45bff" },
    { id: "skin-crimson", title: "SKIN CRIMSON", description: "Nave pesada, visual rubi", baseCost: 260, color: "#ff4e62" },
    { id: "skin-gold", title: "SKIN ORO", description: "Nave real, visual dourado", baseCost: 300, color: "#ffc857" },
];

//=====================
//INIMIGOS
//=====================

const enemies = [];
const ENEMY_ROWS = 3;
const ENEMY_COLS = 8;
const ENEMY_WIDTH = 40;
const ENEMY_TYPES = ["scout", "bomber", "drone", "striker"];
const ENEMY_STYLES = {
    scout: { color: "#ff548c", core: "#fff29a" },
    bomber: { color: "#ff9a4a", core: "#fff0b0" },
    drone: { color: "#46e5cf", core: "#c3fff4" },
    striker: { color: "#ba73ff", core: "#f4d5ff" },
};

let enemyDirection = 1;
let enemySpeed = 1;

//=====================
//EVENTOS TECLADO
//=====================

window.addEventListener("keydown", (event) => {
    keys[event.code] = true;
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(event.code)) {
        event.preventDefault();
    }

    if (event.code === "Space" && gameStarted && !gameOver && !shopOpen) {
        keys.Space = true;
    }

    if (event.code === "KeyR" && gameOver) {
        resetGame();
    }

    if (event.code === "Enter" && shopOpen) {
        startNextWave();
    }
    if (event.code === "Escape" && catalogOpen) {
        catalogOpen = false;
    }
});

window.addEventListener("keyup", (event) => {
    keys[event.code] = false;
});

canvas.addEventListener("click", (event) => {
    const bounds = canvas.getBoundingClientRect();
    const scaleX = canvas.width / bounds.width;
    const scaleY = canvas.height / bounds.height;
    const clickX = (event.clientX - bounds.left) * scaleX;
    const clickY = (event.clientY - bounds.top) * scaleY;

    if (catalogOpen) {
        const closeButton = getCatalogCloseBounds();
        if (
            clickX >= closeButton.x &&
            clickX <= closeButton.x + closeButton.width &&
            clickY >= closeButton.y &&
            clickY <= closeButton.y + closeButton.height
        ) {
            catalogOpen = false;
        }
        return;
    }

    if (shopOpen) {
        for (let index = 0; index < shopItems.length; index++) {
            const card = getShopCardBounds(index);
            if (
                clickX >= card.x &&
                clickX <= card.x + card.width &&
                clickY >= card.y &&
                clickY <= card.y + card.height
            ) {
                purchasePowerUp(shopItems[index]);
                return;
            }
        }

        const continueButton = getContinueButtonBounds();
        if (
            clickX >= continueButton.x &&
            clickX <= continueButton.x + continueButton.width &&
            clickY >= continueButton.y &&
            clickY <= continueButton.y + continueButton.height
        ) {
            startNextWave();
        }
        return;
    }

    if (gameStarted && !gameOver) return;
    if (!gameOver) {
        const catalogButton = getCatalogButtonBounds();
        if (
            clickX >= catalogButton.x &&
            clickX <= catalogButton.x + catalogButton.width &&
            clickY >= catalogButton.y &&
            clickY <= catalogButton.y + catalogButton.height
        ) {
            catalogOpen = true;
            return;
        }
    }
    const button = gameOver ? getRestartButtonBounds() : getStartButtonBounds();

    if (
        clickX >= button.x &&
        clickX <= button.x + button.width &&
        clickY >= button.y &&
        clickY <= button.y + button.height
    ) {
        if (gameOver) {
            resetGame();
        } else {
            gameStarted = true;
            nextEnemyShotAt = Date.now() + 1100;
        }
    }
});

function getStartButtonBounds() {
    return {
        x: canvas.width / 2 - 230,
        y: canvas.height / 2 + 54,
        width: 210,
        height: 56,
    };
}

function getRestartButtonBounds() {
    return {
        x: canvas.width / 2 - 110,
        y: canvas.height / 2 + 54,
        width: 220,
        height: 56,
    };
}

function getCatalogButtonBounds() {
    return {
        x: canvas.width / 2 + 20,
        y: canvas.height / 2 + 54,
        width: 210,
        height: 56,
    };
}

function getCatalogCloseBounds() {
    return {
        x: canvas.width / 2 - 110,
        y: canvas.height - 72,
        width: 220,
        height: 50,
    };
}

function getShopCardBounds(index) {
    const width = 220;
    const gap = 15;
    const col = index % 3;
    const row = Math.floor(index / 3);
    return {
        x: canvas.width / 2 - (width * 3 + gap * 2) / 2 + col * (width + gap),
        y: 145 + row * 112,
        width,
        height: 100,
    };
}

function getContinueButtonBounds() {
    return {
        x: canvas.width / 2 - 120,
        y: 500,
        width: 240,
        height: 48,
    };
}

function getPowerUpCost(item) {
    const levels = {
        rapid: rapidFireLevel,
        spread: spreadShotLevel,
        speed: speedLevel,
        credits: creditLevel,
    };
    return item.baseCost * ((item.id in levels) ? levels[item.id] + 1 : 1);
}

function isItemMaxed(item) {
    const skinId = item.id.startsWith("skin-") ? item.id.slice(5) : null;
    if (skinId) return ownedSkins.has(skinId);
    return (
        (item.id === "life" && lives >= MAX_LIVES) ||
        (item.id === "rapid" && rapidFireLevel >= 4) ||
        (item.id === "spread" && spreadShotLevel >= 2) ||
        (item.id === "shield" && shieldCharges >= 3) ||
        (item.id === "speed" && speedLevel >= 3) ||
        (item.id === "credits" && creditLevel >= 3)
    );
}

function getItemLevel(item) {
    const skinId = item.id.startsWith("skin-") ? item.id.slice(5) : null;
    if (skinId) {
        if (selectedSkin === skinId) return "EQUIPADA";
        return ownedSkins.has(skinId) ? "ADQUIRIDA" : "";
    }
    const levels = {
        rapid: rapidFireLevel,
        spread: spreadShotLevel,
        shield: shieldCharges,
        speed: speedLevel,
        credits: creditLevel,
    };
    return item.id in levels ? `NÍVEL ${levels[item.id]}` : "";
}

function purchasePowerUp(item) {
    const skinId = item.id.startsWith("skin-") ? item.id.slice(5) : null;
    if (skinId && ownedSkins.has(skinId)) {
        selectedSkin = skinId;
        applySkinStats();
        return;
    }

    const atLimit = (
        (item.id === "life" && lives >= MAX_LIVES) ||
        (item.id === "rapid" && rapidFireLevel >= 4) ||
        (item.id === "spread" && spreadShotLevel >= 2) ||
        (item.id === "shield" && shieldCharges >= 3) ||
        (item.id === "speed" && speedLevel >= 3) ||
        (item.id === "credits" && creditLevel >= 3)
    );
    if (atLimit) return;

    const cost = getPowerUpCost(item);
    if (score < cost) return;

    score -= cost;
    if (item.id === "rapid") {
        rapidFireLevel++;
    } else if (item.id === "spread") {
        spreadShotLevel++;
    } else if (item.id === "life") {
        lives++;
    } else if (item.id === "shield") {
        shieldCharges++;
    } else if (item.id === "speed") {
        speedLevel++;
        player.speed = 5 + speedLevel * 0.8;
    } else if (item.id === "credits") {
        creditLevel++;
    } else if (skinId) {
        ownedSkins.add(skinId);
        selectedSkin = skinId;
    }
    applySkinStats();
}

function startNextWave() {
    shopOpen = false;
    createEnemies();
    nextEnemyShotAt = Date.now() + 900;
}

function applySkinStats() {
    player.speed = 5 + speedLevel * 0.8 + (selectedSkin === "neon" ? 0.9 : 0);
}

//=====================
//CRIA INIMIGOS
//=====================

function createEnemies() {
    enemies.length = 0;

    const spacingX = Math.min(60, (canvas.width - 100) / (ENEMY_COLS - 1));
    const startX = (canvas.width - spacingX * (ENEMY_COLS - 1) - ENEMY_WIDTH) / 2;
    const startY = 105;
    const spacingY = 43;

    const rowCount = Math.min(ENEMY_ROWS + Math.floor((wave - 1) / 3), 5);
    for (let row = 0; row < rowCount; row++) {
        for (let col = 0; col < ENEMY_COLS; col++) {
            const homeX = startX + col * spacingX;
            const homeY = startY + row * spacingY;
            const type = ENEMY_TYPES[(col + row * 2 + wave - 1) % ENEMY_TYPES.length];
            const entryType = (col + row + wave - 1) % 4;
            let spawnX = homeX;
            let spawnY = -ENEMY_WIDTH - col * 13;

            if (entryType === 1) {
                spawnX = col < ENEMY_COLS / 2 ? -ENEMY_WIDTH - row * 22 : canvas.width + row * 22;
                spawnY = homeY - 55;
            } else if (entryType === 2) {
                spawnX = col < ENEMY_COLS / 2 ? -ENEMY_WIDTH : canvas.width + ENEMY_WIDTH;
                spawnY = -25 - row * 18;
            } else if (entryType === 3) {
                spawnX = col % 2 === 0 ? -ENEMY_WIDTH : canvas.width + ENEMY_WIDTH;
                spawnY = homeY - 90;
            }

            const enemy = {
                x: spawnX,
                y: spawnY,
                homeX,
                homeY,
                type,
                entryType,
                phase: Math.random() * Math.PI * 2,
                nextDiveAt: Date.now() + 1800 + Math.random() * 2400,
                entering: true,
                row,
                width: ENEMY_WIDTH,
                height: 30,
                alive: true,
            };
            enemies.push(enemy);
        }
    }
}

//=====================
//ATIRAR
//=====================

function shoot() {
    const shotOffsets = spreadShotLevel >= 2
        ? [-20, -10, 0, 10, 20]
        : spreadShotLevel === 1
            ? [-13, 0, 13]
            : [0];
    const skin = playerSkins[selectedSkin];
    for (const offset of shotOffsets) {
        if (bullets.length >= MAX_PLAYER_BULLETS) break;
        bullets.push({
            x: player.x + player.width / 2 - 2.5 + offset,
            y: player.y,
            width: selectedSkin === "crimson" ? 7 : 5,
            height: 12,
            color: skin.hull,
            speed: bulletSpeed * (selectedSkin === "crimson" ? 1.2 : 1),
            hits: 0,
            maxHits: selectedSkin === "crimson" ? 2 : 1,
        });
    }
}

//=====================
//MOVIMENTO JOGADOR
//=====================

function updatePlayer() {
    if ((keys["ArrowLeft"] || keys["KeyA"]) && player.x > 0) {
        player.x -= player.speed * frameScale;
    }
    if ((keys["ArrowRight"] || keys["KeyD"]) && player.x < canvas.width - player.width) {
        player.x += player.speed * frameScale;
    }
    if ((keys["ArrowUp"] || keys["KeyW"]) && player.y > PLAYER_TOP_BOUNDARY) {
        player.y -= player.speed * frameScale;
    }
    if ((keys["ArrowDown"] || keys["KeyS"]) && player.y < canvas.height - player.height - 16) {
        player.y += player.speed * frameScale;
    }
    if (player.x < 0) player.x = 0;
    if (player.y < PLAYER_TOP_BOUNDARY) player.y = PLAYER_TOP_BOUNDARY;

    if (player.x > canvas.width - player.width) player.x = canvas.width - player.width;
    if (player.y > canvas.height - player.height - 16) player.y = canvas.height - player.height - 16;
}

//=====================
//MOVIMENTO TIROS
//=====================

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.x += (bullet.vx || 0) * frameScale;
        bullet.y += bullet.vy !== undefined
            ? bullet.vy * frameScale
            : -(bullet.speed || bulletSpeed) * frameScale;

        if (bullet.y + bullet.height < 0 || bullet.x < -20 || bullet.x > canvas.width + 20) {
            bullets.splice(i, 1);
        }
    }

    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        bullet.x += bullet.vx * frameScale;
        bullet.y += bullet.vy * frameScale;
        bullet.angle = (bullet.angle || 0) + (bullet.spin || 0.08);
        if (bullet.y > canvas.height || bullet.x < -20 || bullet.x > canvas.width + 20) {
            enemyBullets.splice(i, 1);
        } else if (
            Date.now() >= playerInvulnerableUntil &&
            isColliding(bullet, player)
        ) {
            enemyBullets.splice(i, 1);
            damagePlayer();
        }
    }
}

//=====================
//MOVIMENTO INIMIGOS
//=====================

function updateEnemies() {
    let shouldChangeDirection = false;
    const now = Date.now();
    const enteringEnemies = enemies.filter(enemy => enemy.alive && enemy.entering);

    if (enteringEnemies.length > 0) {
        const entrySpeed = 2.4 + Math.min(wave * 0.12, 2);
        for (const enemy of enteringEnemies) {
            const dx = enemy.homeX - enemy.x;
            const dy = enemy.homeY - enemy.y;
            const distance = Math.hypot(dx, dy);
            if (distance <= entrySpeed) {
                enemy.x = enemy.homeX;
                enemy.y = enemy.homeY;
                enemy.entering = false;
            } else {
                const speed = entrySpeed * (enemy.type === "striker" ? 1.45 : 1);
                enemy.x += (dx / distance) * speed * frameScale;
                enemy.y += (dy / distance) * speed * frameScale;
            }
        }
    }

    for (const enemy of enemies) {
        if (enemy.alive && !enemy.entering) {
            const typeSpeed = enemy.type === "bomber" ? 0.72 : enemy.type === "striker" ? 1.35 : 1;
            enemy.x += enemySpeed * typeSpeed * enemyDirection * frameScale;
            if (enemy.type === "drone") {
                enemy.x += Math.sin(now / 190 + enemy.phase) * 1.2 * frameScale;
            }

            if (enemy.x <= 0 || enemy.x + enemy.width >= canvas.width) {
                shouldChangeDirection = true;
            }

            if (enemy.type === "drone" && now >= enemy.nextDiveAt) {
                enemy.y += Math.min(1.4 + wave * 0.12, 3.2) * frameScale;
                if (enemy.y > enemy.homeY + 48) {
                    enemy.y = enemy.homeY;
                    enemy.nextDiveAt = now + 2200 + Math.random() * 2200;
                }
            } else if (enemy.type === "drone" && enemy.y > enemy.homeY) {
                enemy.y = Math.max(enemy.homeY, enemy.y - 1.1 * frameScale);
            }
        }
    }

    if (shouldChangeDirection) {
        enemyDirection *= -1;
        for (const enemy of enemies) {
            if (enemy.alive && !enemy.entering) {
                enemy.y += 20 * frameScale;
                if (
                    enemy.y + enemy.height >= player.y &&
                    now >= playerInvulnerableUntil
                ) {
                    damagePlayer();
                    if (!gameOver) {
                        createEnemies();
                    }
                    return;
                }
            }
        }
    }

    const fireInterval = Math.max(440, 1450 - (wave - 1) * 90);
    if (now >= nextEnemyShotAt) {
        const shooters = enemies.filter(enemy => enemy.alive && !enemy.entering);
        if (shooters.length > 0 && enemyBullets.length < MAX_ENEMY_BULLETS) {
            const shooter = shooters[Math.floor(Math.random() * shooters.length)];
            fireEnemyWeapon(shooter, now);
        }
        nextEnemyShotAt = now + fireInterval;
    }
}

function fireEnemyWeapon(enemy, now) {
    const originX = enemy.x + enemy.width / 2;
    const originY = enemy.y + enemy.height;
    const targetX = player.x + player.width / 2;
    const targetY = player.y + player.height / 2;
    const aimAngle = Math.atan2(targetY - originY, targetX - originX);
    const waveBonus = Math.min(wave * 0.18, 2.5);

    function addProjectile(type, angle, speed, size) {
        if (enemyBullets.length >= MAX_ENEMY_BULLETS) return;
        enemyBullets.push({
            x: originX - size / 2,
            y: originY,
            width: size,
            height: size,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            type,
            angle,
            spin: type === "mine" ? 0.12 : 0.04,
        });
    }

    if (enemy.type === "bomber") {
        for (const offset of [-0.34, 0, 0.34]) {
            addProjectile("orb", aimAngle + offset, 3.1 + waveBonus, 13);
        }
    } else if (enemy.type === "drone") {
        addProjectile("mine", Math.PI / 2, 2.2 + waveBonus * 0.5, 15);
    } else if (enemy.type === "striker") {
        addProjectile("bolt", aimAngle - 0.12, 6 + waveBonus, 6);
        addProjectile("bolt", aimAngle + 0.12, 6 + waveBonus, 6);
    } else {
        addProjectile("needle", aimAngle, 4.6 + waveBonus, 7);
    }
}

function damagePlayer() {
    if (shieldCharges > 0) {
        shieldCharges--;
        playerInvulnerableUntil = Date.now() + 900;
        enemyBullets.length = 0;
        return;
    }
    lives--;
    playerInvulnerableUntil = Date.now() + 1400;
    enemyBullets.length = 0;
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - 70;
    if (lives <= 0) {
        gameOver = true;
    }
}

//=====================
//COLISÃO RETANGULO
//=====================

function isColliding(a,b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

//=====================
//DETECTA ACERTOS
//=====================

function detectCollisions() {
    for (let b = bullets.length - 1; b >= 0; b--) {
        for (const enemy of enemies) {
            if (enemy.alive && isColliding(bullets[b], enemy)) {
                enemy.alive = false;
                const reward = { scout: 20, bomber: 45, drone: 35, striker: 50 }[enemy.type] || 20;
                const skinBonus = selectedSkin === "gold" ? 1.25 : 1;
                score += Math.round(reward * (1 + creditLevel * 0.25) * skinBonus);
                bullets[b].hits++;
                if (bullets[b].hits >= bullets[b].maxHits) {
                    bullets.splice(b, 1);
                    break;
                }
                break;
            }
        }
    }

    const remainingEnemies = enemies.filter(enemy => enemy.alive);
    if (remainingEnemies.length === 0 && !shopOpen) {
        wave++;
        enemySpeed = Math.min(enemySpeed + 0.5, 6);
        enemyBullets.length = 0;
        shopOpen = true;
    }
}

//=====================
//DESENHO JOGADOR
//=====================

function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);

    const centerX = player.width / 2;
    const centerY = player.height / 2;
    const skin = playerSkins[selectedSkin];
    const flameLength = 9 + Math.sin(Date.now() / 70) * 4;

    ctx.shadowColor = skin.hull;
    ctx.shadowBlur = 16;
    ctx.fillStyle = skin.hull;
    ctx.beginPath();
    if (skin.style === "heavy") {
        ctx.moveTo(centerX, -6);
        ctx.lineTo(player.width - 1, player.height - 5);
        ctx.lineTo(player.width - 8, player.height);
        ctx.lineTo(centerX, player.height - 8);
        ctx.lineTo(8, player.height);
        ctx.lineTo(1, player.height - 5);
    } else if (skin.style === "royal") {
        ctx.moveTo(centerX, -10);
        ctx.lineTo(player.width - 2, player.height - 4);
        ctx.lineTo(centerX + 8, player.height - 5);
        ctx.lineTo(centerX, player.height + 1);
        ctx.lineTo(centerX - 8, player.height - 5);
        ctx.lineTo(2, player.height - 4);
    } else if (skin.style === "sleek") {
        ctx.moveTo(centerX, -10);
        ctx.lineTo(player.width - 7, player.height - 2);
        ctx.lineTo(centerX, player.height - 11);
        ctx.lineTo(7, player.height - 2);
    } else {
        ctx.moveTo(centerX, -8);
        ctx.lineTo(player.width - 4, player.height - 3);
        ctx.lineTo(centerX, player.height - 9);
        ctx.lineTo(4, player.height - 3);
    }
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = skin.trim;
    ctx.beginPath();
    ctx.moveTo(centerX, -4);
    ctx.lineTo(player.width - 10, player.height - 6);
    ctx.lineTo(centerX, player.height - 12);
    ctx.lineTo(10, player.height - 6);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = skin.wing;
    ctx.beginPath();
    ctx.moveTo(7, player.height - 5);
    ctx.lineTo(-3, player.height + 2);
    ctx.lineTo(20, player.height - 7);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(player.width - 7, player.height - 5);
    ctx.lineTo(player.width + 3, player.height + 2);
    ctx.lineTo(player.width - 20, player.height - 7);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = skin.hull;
    ctx.beginPath();
    ctx.moveTo(centerX, -5);
    ctx.lineTo(centerX + 5, 10);
    ctx.lineTo(centerX, 14);
    ctx.lineTo(centerX - 5, 10);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(centerX, 9, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = skin.engine;
    ctx.beginPath();
    ctx.moveTo(centerX - 5, player.height - 4);
    ctx.lineTo(centerX + 5, player.height - 4);
    ctx.lineTo(centerX, player.height + flameLength);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#e8fcff";
    ctx.beginPath();
    ctx.moveTo(centerX - 2, player.height - 3);
    ctx.lineTo(centerX + 2, player.height - 3);
    ctx.lineTo(centerX, player.height + flameLength * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    if (shieldCharges > 0 || Date.now() < playerInvulnerableUntil) {
        ctx.save();
        ctx.strokeStyle = shieldCharges > 0 ? "rgba(84, 160, 255, 0.8)" : "rgba(70, 229, 207, 0.45)";
        ctx.lineWidth = 2;
        ctx.shadowColor = "#54a0ff";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.ellipse(
            player.x + player.width / 2,
            player.y + player.height / 2,
            player.width * 0.72,
            player.height * 1.05,
            0,
            0,
            Math.PI * 2
        );
        ctx.stroke();
        ctx.restore();
    }
}

//=====================
//DESENHO TIROS
//=====================

function drawBullets() {
    bullets.forEach((bullet) => {
        ctx.save();
        ctx.shadowColor = bullet.color || playerSkins[selectedSkin].hull;
        ctx.shadowBlur = 8;
        ctx.fillStyle = bullet.color || "#ffe766";
        ctx.fillRect(
            bullet.x, 
            bullet.y, 
            bullet.width, 
            bullet.height
        );
        ctx.restore();
    });

    enemyBullets.forEach((bullet) => {
        const centerX = bullet.x + bullet.width / 2;
        const centerY = bullet.y + bullet.height / 2;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(bullet.angle || 0);

        if (bullet.type === "orb") {
            ctx.shadowColor = "#ff8b47";
            ctx.shadowBlur = 9;
            ctx.fillStyle = "#e63564";
            ctx.beginPath();
            ctx.arc(0, 0, bullet.width / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#ff9a4a";
            ctx.beginPath();
            ctx.arc(-1, -1, bullet.width / 3.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#fff3a6";
            ctx.beginPath();
            ctx.arc(-2, -3, bullet.width / 7, 0, Math.PI * 2);
            ctx.fill();
        } else if (bullet.type === "mine") {
            ctx.shadowColor = "#ba73ff";
            ctx.shadowBlur = 15;
            ctx.fillStyle = "#bd78ff";
            ctx.beginPath();
            for (let point = 0; point < 8; point++) {
                const radius = point % 2 === 0 ? bullet.width / 2 : bullet.width / 3.1;
                const angle = point * Math.PI / 4;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                if (point === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = "#f7d8ff";
            ctx.beginPath();
            ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
            ctx.fill();
        } else if (bullet.type === "bolt") {
            ctx.shadowColor = "#ff5478";
            ctx.shadowBlur = 12;
            ctx.fillStyle = "#ff5478";
            ctx.beginPath();
            ctx.moveTo(0, -bullet.height);
            ctx.lineTo(bullet.width / 2, 0);
            ctx.lineTo(0, bullet.height);
            ctx.lineTo(-bullet.width / 2, 0);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = "#ffd0dc";
            ctx.fillRect(-1, -bullet.height / 2, 2, bullet.height);
        } else {
            ctx.shadowColor = "#ffe766";
            ctx.shadowBlur = 10;
            ctx.fillStyle = "#ffe766";
            ctx.beginPath();
            ctx.moveTo(0, -bullet.height);
            ctx.lineTo(bullet.width / 2, 0);
            ctx.lineTo(0, bullet.height);
            ctx.lineTo(-bullet.width / 2, 0);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    });
}

//=====================
//DESENHO INIMIGOS
//=====================

function drawBackground() {
    ctx.fillStyle = spaceGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const star of stars) {
        star.y += star.speed * frameScale;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }

        ctx.globalAlpha = star.opacity * (0.75 + Math.sin(Date.now() / 500 + star.x) * 0.25);
        ctx.fillStyle = "#d9f5ff";
        ctx.fillRect(star.x, star.y, star.size, star.size);
    }
    ctx.globalAlpha = 1;
}

function drawEnemies() {
    enemies.forEach((enemy) => {
        if (!enemy.alive) return;

        ctx.save();
        ctx.translate(enemy.x, enemy.y);

        const centerX = enemy.width / 2;
        const centerY = enemy.height / 2;
        const style = ENEMY_STYLES[enemy.type];

        ctx.shadowColor = style.color;
        ctx.shadowBlur = 13;
        ctx.fillStyle = style.color;
        ctx.strokeStyle = style.color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        if (enemy.type === "bomber") {
            ctx.moveTo(centerX, 2);
            ctx.lineTo(enemy.width - 3, 8);
            ctx.lineTo(enemy.width - 1, centerY + 3);
            ctx.lineTo(enemy.width - 8, enemy.height - 1);
            ctx.lineTo(8, enemy.height - 1);
            ctx.lineTo(1, centerY + 3);
            ctx.lineTo(3, 8);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#702f53";
            ctx.beginPath();
            ctx.ellipse(centerX, centerY + 1, 7, 9, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = style.core;
            ctx.beginPath();
            ctx.arc(centerX, centerY + 1, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#ffd166";
            ctx.fillRect(5, 5, 5, 3);
            ctx.fillRect(enemy.width - 10, 5, 5, 3);
        } else if (enemy.type === "drone") {
            ctx.moveTo(centerX, 1);
            ctx.lineTo(enemy.width - 2, centerY - 2);
            ctx.lineTo(centerX + 9, centerY + 2);
            ctx.lineTo(centerX, enemy.height - 1);
            ctx.lineTo(centerX - 9, centerY + 2);
            ctx.lineTo(2, centerY - 2);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#154e66";
            ctx.beginPath();
            ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = style.core;
            ctx.beginPath();
            ctx.arc(centerX, centerY, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = style.color;
            ctx.beginPath();
            ctx.moveTo(8, centerY);
            ctx.lineTo(3, enemy.height - 1);
            ctx.moveTo(enemy.width - 8, centerY);
            ctx.lineTo(enemy.width - 3, enemy.height - 1);
            ctx.stroke();
        } else if (enemy.type === "striker") {
            ctx.moveTo(centerX, 1);
            ctx.lineTo(enemy.width - 2, enemy.height - 2);
            ctx.lineTo(centerX, enemy.height - 8);
            ctx.lineTo(2, enemy.height - 2);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#392164";
            ctx.beginPath();
            ctx.moveTo(centerX, 7);
            ctx.lineTo(centerX + 6, centerY);
            ctx.lineTo(centerX, enemy.height - 4);
            ctx.lineTo(centerX - 6, centerY);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = style.core;
            ctx.fillRect(centerX - 2, centerY - 2, 4, 4);
            ctx.strokeStyle = style.color;
            ctx.beginPath();
            ctx.moveTo(8, 8);
            ctx.lineTo(2, 3);
            ctx.moveTo(enemy.width - 8, 8);
            ctx.lineTo(enemy.width - 2, 3);
            ctx.stroke();
        } else {
            ctx.ellipse(centerX, centerY + 2, centerX - 2, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#57294c";
            ctx.beginPath();
            ctx.arc(centerX, centerY - 1, 7, Math.PI, 0);
            ctx.fill();
            ctx.fillStyle = style.core;
            for (const eyeX of [centerX - 8, centerX + 8]) {
                ctx.beginPath();
                ctx.ellipse(eyeX, centerY + 2, 3, 4, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillStyle = "#32134d";
            for (const eyeX of [centerX - 8, centerX + 8]) {
                ctx.beginPath();
                ctx.arc(eyeX, centerY + 2, 1.3, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.strokeStyle = style.color;
            ctx.beginPath();
            ctx.moveTo(8, enemy.height - 3);
            ctx.lineTo(3, enemy.height);
            ctx.moveTo(enemy.width - 8, enemy.height - 3);
            ctx.lineTo(enemy.width - 3, enemy.height);
            ctx.moveTo(centerX, 6);
            ctx.lineTo(centerX, 1);
            ctx.stroke();
        }

        ctx.restore();
    });
}

//=====================
//HUD
//=====================

function drawHUD() {
    ctx.save();
    ctx.fillStyle = "rgba(6, 13, 37, 0.88)";
    ctx.strokeStyle = "rgba(112, 183, 255, 0.32)";
    ctx.lineWidth = 1;
    roundedRect(18, 16, canvas.width - 36, 58, 12);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = "11px Arial";
    ctx.fillStyle = "#8fa9d9";
    ctx.fillText("CRÉDITOS", 38, 33);
    ctx.fillText("ONDA", canvas.width / 2 - 27, 33);
    ctx.fillText("VIDAS", canvas.width - 165, 33);

    ctx.font = "bold 20px Arial";
    ctx.fillStyle = "#f4f8ff";
    ctx.fillText(String(score).padStart(5, "0"), 38, 55);
    ctx.fillText(String(wave).padStart(2, "0"), canvas.width / 2 - 27, 55);

    for (let i = 0; i < MAX_LIVES; i++) {
        const x = canvas.width - 165 + i * 24;
        ctx.fillStyle = i < lives ? "#46e5cf" : "rgba(143, 169, 217, 0.25)";
        ctx.shadowColor = i < lives ? "#46e5cf" : "transparent";
        ctx.shadowBlur = i < lives ? 8 : 0;
        ctx.beginPath();
        ctx.moveTo(x + 9, 47);
        ctx.lineTo(x + 18, 58);
        ctx.lineTo(x + 9, 55);
        ctx.lineTo(x, 58);
        ctx.closePath();
        ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.textAlign = "center";
    ctx.font = "11px Arial";
    ctx.fillStyle = shieldCharges > 0 ? "#80bdff" : "#68779a";
    ctx.fillText(`ESCUDO ${shieldCharges}`, canvas.width - 267, 51);
    ctx.textAlign = "left";
    ctx.restore();
}

function roundedRect(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
}

function drawStartScreen() {
    ctx.fillStyle = "rgba(2, 5, 19, 0.68)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "#46e5cf";
    ctx.shadowBlur = 24;
    ctx.fillStyle = "#f4f8ff";
    ctx.font = "bold 54px Arial";
    ctx.fillText("SPACE INVADERS", canvas.width / 2, canvas.height / 2 - 90);

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#aabce5";
    ctx.font = "17px Arial";
    ctx.fillText("Defenda a galáxia e sobreviva às ondas inimigas", canvas.width / 2, canvas.height / 2 - 43);
    ctx.font = "14px Arial";
    ctx.fillText("Mova: setas ou W A S D     Atire: ESPAÇO", canvas.width / 2, canvas.height / 2 + 20);

    const button = getStartButtonBounds();
    ctx.fillStyle = "#1bd8ff";
    ctx.shadowColor = "#1bd8ff";
    ctx.shadowBlur = 18;
    roundedRect(button.x, button.y, button.width, button.height, 12);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#061126";
    ctx.font = "bold 18px Arial";
    ctx.fillText("INICIAR JOGO", button.x + button.width / 2, button.y + button.height / 2);

    const catalogButton = getCatalogButtonBounds();
    ctx.fillStyle = "rgba(20, 35, 75, 0.96)";
    ctx.strokeStyle = "#46e5cf";
    ctx.lineWidth = 2;
    roundedRect(catalogButton.x, catalogButton.y, catalogButton.width, catalogButton.height, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#46e5cf";
    ctx.font = "bold 18px Arial";
    ctx.fillText("CATÁLOGO", catalogButton.x + catalogButton.width / 2, catalogButton.y + catalogButton.height / 2);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
}

function drawCatalog() {
    ctx.fillStyle = "rgba(2, 5, 19, 0.92)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#f4f8ff";
    ctx.shadowColor = "#46e5cf";
    ctx.shadowBlur = 16;
    ctx.font = "bold 34px Arial";
    ctx.fillText("CATÁLOGO GALÁCTICO", canvas.width / 2, 63);
    ctx.shadowBlur = 0;
    ctx.font = "14px Arial";
    ctx.fillStyle = "#aabce5";
    ctx.fillText("Equipamentos, classes inimigas e skins disponíveis", canvas.width / 2, 94);

    const columns = [
        { x: 24, title: "LOJA", color: "#46e5cf" },
        { x: 280, title: "INIMIGOS", color: "#ff9a4a" },
        { x: 536, title: "SKINS", color: "#ba73ff" },
    ];
    for (const column of columns) {
        ctx.fillStyle = "rgba(11, 20, 51, 0.9)";
        ctx.strokeStyle = "rgba(112, 183, 255, 0.3)";
        roundedRect(column.x, 120, 240, 376, 12);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = column.color;
        ctx.font = "bold 16px Arial";
        ctx.fillText(column.title, column.x + 120, 145);
    }

    ctx.textAlign = "left";
    ctx.font = "bold 12px Arial";
    shopItems.forEach((item, index) => {
        const y = 174 + index * 34;
        ctx.fillStyle = item.color;
        ctx.fillText(item.title, 38, y);
        ctx.font = "10px Arial";
        ctx.fillStyle = "#aabce5";
        ctx.fillText(item.description, 38, y + 14, 210);
        ctx.font = "bold 12px Arial";
    });

    const enemyCatalog = [
        ["SCOUT", "Persegue sua nave com agulhas."],
        ["BOMBARDEIRO", "Dispara uma salva de orbes."],
        ["DRONE", "Avança e lança minas giratórias."],
        ["STRIKER", "Rápido, lança raios em pares."],
    ];
    enemyCatalog.forEach(([name, description], index) => {
        const y = 184 + index * 70;
        ctx.fillStyle = ENEMY_STYLES[ENEMY_TYPES[index]].color;
        ctx.font = "bold 13px Arial";
        ctx.fillText(name, 294, y);
        ctx.fillStyle = "#aabce5";
        ctx.font = "11px Arial";
        ctx.fillText(description, 294, y + 20, 210);
        ctx.fillStyle = ENEMY_STYLES[ENEMY_TYPES[index]].color;
        ctx.beginPath();
        ctx.arc(496, y, 5, 0, Math.PI * 2);
        ctx.fill();
    });

    Object.entries(playerSkins).forEach(([id, skin], index) => {
        const y = 184 + index * 66;
        ctx.fillStyle = skin.hull;
        ctx.beginPath();
        ctx.moveTo(552, y - 8);
        ctx.lineTo(563, y + 8);
        ctx.lineTo(552, y + 4);
        ctx.lineTo(541, y + 8);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#f4f8ff";
        ctx.font = "bold 12px Arial";
        ctx.fillText(skin.name, 572, y - 3);
        ctx.fillStyle = selectedSkin === id ? "#46e5cf" : ownedSkins.has(id) ? "#aabce5" : "#ff9ba7";
        ctx.font = "10px Arial";
        ctx.fillText(
            selectedSkin === id ? "EQUIPADA" : ownedSkins.has(id) ? "ADQUIRIDA" : "À VENDA NA LOJA",
            572,
            y + 13
        );
    });

    const closeButton = getCatalogCloseBounds();
    ctx.fillStyle = "#1bd8ff";
    ctx.shadowColor = "#1bd8ff";
    ctx.shadowBlur = 12;
    roundedRect(closeButton.x, closeButton.y, closeButton.width, closeButton.height, 10);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.textAlign = "center";
    ctx.fillStyle = "#061126";
    ctx.font = "bold 16px Arial";
    ctx.fillText("VOLTAR AO MENU", canvas.width / 2, closeButton.y + closeButton.height / 2);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
}

function drawGameOver() {
    ctx.fillStyle = "rgba(2, 5, 19, 0.72)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#f4f8ff";
    ctx.font = "bold 48px Arial";
    ctx.fillText("FIM DE JOGO", canvas.width / 2, canvas.height / 2 - 75);
    ctx.fillStyle = "#aabce5";
    ctx.font = "18px Arial";
    ctx.fillText(`Pontuação final: ${String(score).padStart(5, "0")}`, canvas.width / 2, canvas.height / 2 - 25);

    const button = getRestartButtonBounds();
    ctx.fillStyle = "#1bd8ff";
    ctx.shadowColor = "#1bd8ff";
    ctx.shadowBlur = 18;
    roundedRect(button.x, button.y, button.width, button.height, 12);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#061126";
    ctx.font = "bold 18px Arial";
    ctx.fillText("JOGAR NOVAMENTE", button.x + button.width / 2, button.y + button.height / 2);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
}

function drawShop() {
    ctx.fillStyle = "rgba(2, 5, 19, 0.86)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#f4f8ff";
    ctx.shadowColor = "#46e5cf";
    ctx.shadowBlur = 18;
    ctx.font = "bold 32px Arial";
    ctx.fillText("LOJA DE APRIMORAMENTOS", canvas.width / 2, 67);

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#aabce5";
    ctx.font = "14px Arial";
    ctx.fillText(`Onda ${wave} concluída  ·  Créditos disponíveis: ${score}`, canvas.width / 2, 105);
    ctx.fillText("Clique para comprar ou equipar. Elimine inimigos para ganhar mais créditos.", canvas.width / 2, 126);

    shopItems.forEach((item, index) => {
        const card = getShopCardBounds(index);
        const cost = getPowerUpCost(item);
        const isSkin = item.id.startsWith("skin-");
        const skinId = isSkin ? item.id.slice(5) : null;
        const isOwnedSkin = isSkin && ownedSkins.has(skinId);
        const soldOut = isItemMaxed(item);
        const canAfford = isOwnedSkin || (score >= cost && !soldOut);

        ctx.fillStyle = "rgba(11, 20, 51, 0.96)";
        ctx.strokeStyle = canAfford ? item.color : "rgba(143, 169, 217, 0.28)";
        ctx.lineWidth = 2;
        roundedRect(card.x, card.y, card.width, card.height, 14);
        ctx.fill();
        ctx.stroke();

        if (isSkin) {
            const skin = playerSkins[skinId];
            ctx.fillStyle = skin.hull;
            ctx.beginPath();
            ctx.moveTo(card.x + 20, card.y + 17);
            ctx.lineTo(card.x + 31, card.y + 33);
            ctx.lineTo(card.x + 20, card.y + 29);
            ctx.lineTo(card.x + 9, card.y + 33);
            ctx.closePath();
            ctx.fill();
        }

        ctx.fillStyle = item.color;
        ctx.font = "bold 13px Arial";
        ctx.fillText(item.title, card.x + card.width / 2, card.y + 24, card.width - 18);

        ctx.fillStyle = "#c4d0eb";
        ctx.font = "11px Arial";
        ctx.fillText(item.description, card.x + card.width / 2, card.y + 47, card.width - 18);

        ctx.fillStyle = isOwnedSkin
            ? (selectedSkin === skinId ? "#46e5cf" : "#ffffff")
            : soldOut ? "#7e8aa8" : canAfford ? "#ffffff" : "#ff9ba7";
        ctx.font = "bold 12px Arial";
        ctx.fillText(
            isOwnedSkin
                ? (selectedSkin === skinId ? "EQUIPADA" : "CLIQUE PARA EQUIPAR")
                : soldOut ? "LIMITE ATINGIDO" : `${cost} CRÉDITOS`,
            card.x + card.width / 2,
            card.y + 70,
            card.width - 12
        );
        ctx.fillStyle = "#8fa9d9";
        ctx.font = "10px Arial";
        ctx.fillText(getItemLevel(item), card.x + card.width / 2, card.y + 88);
    });

    const button = getContinueButtonBounds();
    ctx.fillStyle = "#1bd8ff";
    ctx.shadowColor = "#1bd8ff";
    ctx.shadowBlur = 16;
    roundedRect(button.x, button.y, button.width, button.height, 12);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#061126";
    ctx.font = "bold 17px Arial";
    ctx.fillText("PRÓXIMA ONDA  ›", canvas.width / 2, button.y + button.height / 2);
    ctx.fillStyle = "#8fa9d9";
    ctx.font = "12px Arial";
    ctx.fillText("ou pressione ENTER", canvas.width / 2, button.y + button.height + 18);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
}

//=====================
//GAME OVER
//=====================

//=====================
//RESET
//=====================

function resetGame() {
    score = 0;
    lives = 3;
    gameOver = false;
    gameStarted = true;
    shopOpen = false;
    wave = 1;
    rapidFireLevel = 0;
    spreadShotLevel = 0;
    speedLevel = 0;
    creditLevel = 0;
    shieldCharges = 0;
    applySkinStats();
    bullets.length = 0;
    enemyBullets.length = 0;
    enemySpeed = 1;
    enemyDirection = 1;
    keys.Space = false;
    playerInvulnerableUntil = 0;
    nextPlayerShotAt = 0;
    nextEnemyShotAt = Date.now() + 900;
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - 70;
    createEnemies();
}

//=====================
//RENDERIZAÇÃO
//=====================

function draw() {
    drawBackground();

    if (!gameStarted) {
        if (catalogOpen) {
            drawCatalog();
        } else {
            drawStartScreen();
        }
    } else {
        if (Date.now() < playerInvulnerableUntil && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.35;
        }
        drawPlayer();
        ctx.globalAlpha = 1;
        drawBullets();
        drawEnemies();
        drawHUD();

        if (gameOver) {
            drawGameOver();
        } else if (shopOpen) {
            drawShop();
        }
    }   
}

//=====================
//LOOP PRINCIPAL
//=====================

function gameLoop(timestamp) {
    frameScale = previousFrameTime
        ? Math.min((timestamp - previousFrameTime) / (1000 / 60), 2)
        : 1;
    previousFrameTime = timestamp;

    if (gameStarted && !gameOver && !shopOpen) {
        updatePlayer();
        if (keys.Space) {
            const shotInterval = Math.max(150, 450 - rapidFireLevel * 85);
            if (Date.now() >= nextPlayerShotAt) {
                shoot();
                nextPlayerShotAt = Date.now() + shotInterval;
            }
        }
        updateBullets();
        updateEnemies();
        detectCollisions();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

//=====================
//INICIALIZAÇÃO
//=====================

createEnemies();
gameLoop();