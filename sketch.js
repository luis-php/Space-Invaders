//=====================
//CONFIGURAÇÃO INICIAL
//=====================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const spaceGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
spaceGradient.addColorStop(0, "#10232c");
spaceGradient.addColorStop(0.48, "#081820");
spaceGradient.addColorStop(1, "#040b10");
const HUD_FONT = '"Bahnschrift", "Arial Narrow", "Trebuchet MS", sans-serif';
const PALETTE = {
    accent: "#75e6ca",
    accentBright: "#b2ffe9",
    amber: "#f2b96f",
    text: "#e1f0ee",
    muted: "#89a6a6",
    panel: "rgba(8, 24, 30, 0.94)",
    panelLight: "rgba(15, 39, 45, 0.96)",
    line: "rgba(117, 230, 202, 0.38)",
};

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
let pulseLevel = 0;
let missileLevel = 0;
let shieldCharges = 0;
let frameScale = 1;
let previousFrameTime = 0;
const MAX_LIVES = 5;
const MAX_PLAYER_BULLETS = 90;
const MAX_ENEMY_BULLETS = 60;
const MAX_OBSTACLE_HEALTH = 8;
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
        hull: "#72e3d0",
        trim: "#d6fff4",
        wing: "#f2b96f",
        engine: "#ffe1a0",
    },
    neon: {
        name: "NEON",
        style: "sleek",
        hull: "#83d9d0",
        trim: "#dcfff6",
        wing: "#53a7aa",
        engine: "#b9ffe8",
    },
    crimson: {
        name: "CRIMSON",
        style: "heavy",
        hull: "#df816d",
        trim: "#ffe1bd",
        wing: "#a9584f",
        engine: "#ffd18d",
    },
    gold: {
        name: "ORO",
        style: "royal",
        hull: "#e5bd72",
        trim: "#fff0c4",
        wing: "#a88b53",
        engine: "#ffe3a3",
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
const obstacles = [];
const bulletSpeed = 10;
let shotSequence = 0;
const shopItems = [
    { id: "rapid", title: "TIRO RÁPIDO", description: "Dispare com mais frequência", baseCost: 100, color: "#75e6ca" },
    { id: "spread", title: "TIRO TRIPLO", description: "Lance três projéteis por vez", baseCost: 150, color: "#a9b9e0" },
    { id: "life", title: "NAVE EXTRA", description: "Recupere uma vida", baseCost: 200, color: "#ef977c" },
    { id: "shield", title: "ESCUDO", description: "Bloqueia um acerto", baseCost: 160, color: "#82c6dc" },
    { id: "speed", title: "MOTOR TURBO", description: "Aumenta sua velocidade", baseCost: 130, color: "#f2b96f" },
    { id: "credits", title: "BÔNUS DE CRÉDITOS", description: "Mais créditos por inimigo", baseCost: 180, color: "#a9d79b" },
    { id: "skin-neon", title: "SKIN NEON", description: "Nave ágil, visual neon", baseCost: 220, color: "#83d9d0" },
    { id: "skin-crimson", title: "SKIN CRIMSON", description: "Nave pesada, visual rubi", baseCost: 260, color: "#df816d" },
    { id: "skin-gold", title: "SKIN ORO", description: "Nave real, visual dourado", baseCost: 300, color: "#e5bd72" },
    { id: "pulse", title: "CANHÃO DE PULSO", description: "Pulso pesado perfurante", baseCost: 240, color: "#75e6ca" },
    { id: "missile", title: "MÍSSIL GUIADO", description: "Projétil que busca alvos", baseCost: 280, color: "#f2b96f" },
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
    scout: { color: "#ef977c", core: "#ffe5b2" },
    bomber: { color: "#e0b46a", core: "#fff0c8" },
    drone: { color: "#72d7c3", core: "#d7fff3" },
    striker: { color: "#9eacdb", core: "#e2e9ff" },
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
    } else if (event.code === "Escape" && gameStarted) {
        returnToMenu();
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

    if (gameStarted) {
        const homeButton = getHomeButtonBounds();
        if (
            clickX >= homeButton.x &&
            clickX <= homeButton.x + homeButton.width &&
            clickY >= homeButton.y &&
            clickY <= homeButton.y + homeButton.height
        ) {
            returnToMenu();
            return;
        }
    }

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
            resetGame();
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

function getHomeButtonBounds() {
    return {
        x: canvas.width - 96,
        y: 23,
        width: 72,
        height: 40,
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
        y: 145 + row * 91,
        width,
        height: 82,
    };
}

function getContinueButtonBounds() {
    return {
        x: canvas.width / 2 - 120,
        y: 523,
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
        pulse: pulseLevel,
        missile: missileLevel,
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
        (item.id === "credits" && creditLevel >= 3) ||
        (item.id === "pulse" && pulseLevel >= 3) ||
        (item.id === "missile" && missileLevel >= 1)
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
        pulse: pulseLevel,
        missile: missileLevel,
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
        (item.id === "credits" && creditLevel >= 3) ||
        (item.id === "pulse" && pulseLevel >= 3) ||
        (item.id === "missile" && missileLevel >= 1)
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
    } else if (item.id === "pulse") {
        pulseLevel++;
    } else if (item.id === "missile") {
        missileLevel++;
    } else if (skinId) {
        ownedSkins.add(skinId);
        selectedSkin = skinId;
    }
    applySkinStats();
}

function startNextWave() {
    shopOpen = false;
    createEnemies();
    createObstacles();
    nextEnemyShotAt = Date.now() + 900;
}

function returnToMenu() {
    gameStarted = false;
    gameOver = false;
    shopOpen = false;
    catalogOpen = false;
    keys.Space = false;
    bullets.length = 0;
    enemyBullets.length = 0;
    shotSequence = 0;
    obstacles.length = 0;
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

function createObstacles() {
    obstacles.length = 0;
    const positions = [
        { x: 112, y: 318 },
        { x: 282, y: 354 },
        { x: 452, y: 318 },
        { x: 622, y: 354 },
    ];
    positions.forEach((position, index) => {
        obstacles.push({
            x: position.x,
            y: position.y,
            width: 54,
            height: 28,
            health: MAX_OBSTACLE_HEALTH,
            variant: index,
        });
    });
}

//=====================
//ATIRAR
//=====================

function shoot() {
    shotSequence++;
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

    if (pulseLevel > 0 && bullets.length < MAX_PLAYER_BULLETS) {
        bullets.push({
            x: player.x + player.width / 2 - 4,
            y: player.y - 2,
            width: 8,
            height: 23,
            color: "#9affea",
            speed: 11 + pulseLevel * 0.8,
            hits: 0,
            maxHits: 1 + pulseLevel + (selectedSkin === "crimson" ? 1 : 0),
            kind: "pulse",
        });
    }

    if (missileLevel > 0 && shotSequence % 3 === 0 && bullets.length < MAX_PLAYER_BULLETS) {
        bullets.push({
            x: player.x + player.width / 2 - 5,
            y: player.y - 6,
            width: 10,
            height: 15,
            color: "#ffc879",
            vx: 0,
            vy: -5.4,
            speed: 5.4,
            hits: 0,
            maxHits: 1,
            kind: "missile",
        });
    }
}

//=====================
//MOVIMENTO JOGADOR
//=====================

function updatePlayer() {
    const previousX = player.x;
    const previousY = player.y;
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

    if (obstacles.some(obstacle => isColliding(player, obstacle))) {
        player.x = previousX;
        player.y = previousY;
    }
}

//=====================
//MOVIMENTO TIROS
//=====================

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        if (bullet.kind === "missile") {
            const target = enemies.find(enemy => enemy.alive);
            if (target) {
                const targetX = target.x + target.width / 2;
                const bulletX = bullet.x + bullet.width / 2;
                bullet.vx += Math.max(-0.22, Math.min(0.22, (targetX - bulletX) * 0.003));
                bullet.vx = Math.max(-3.2, Math.min(3.2, bullet.vx));
                bullet.vy = -Math.max(3.8, bullet.speed - Math.abs(bullet.vx) * 0.28);
            }
        }
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
        } else {
            const obstacle = obstacles.find(candidate => candidate.health > 0 && isColliding(bullet, candidate));
            if (obstacle) {
                obstacle.health--;
                enemyBullets.splice(i, 1);
                continue;
            }
            if (
                Date.now() >= playerInvulnerableUntil &&
                isColliding(bullet, player)
            ) {
                enemyBullets.splice(i, 1);
                damagePlayer();
                return;
            }
        }
    }
    removeDestroyedObstacles();
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
        const bullet = bullets[b];
        const obstacle = obstacles.find(candidate => candidate.health > 0 && isColliding(bullet, candidate));
        if (obstacle) {
            obstacle.health -= bullet.kind === "pulse" ? 2 : 1;
            bullets.splice(b, 1);
            continue;
        }

        for (const enemy of enemies) {
            if (enemy.alive && isColliding(bullet, enemy)) {
                enemy.alive = false;
                const reward = { scout: 20, bomber: 45, drone: 35, striker: 50 }[enemy.type] || 20;
                const skinBonus = selectedSkin === "gold" ? 1.25 : 1;
                score += Math.round(reward * (1 + creditLevel * 0.25) * skinBonus);
                bullet.hits++;
                if (bullet.hits >= bullet.maxHits) {
                    bullets.splice(b, 1);
                    break;
                }
                break;
            }
        }
    }

    removeDestroyedObstacles();
    const remainingEnemies = enemies.filter(enemy => enemy.alive);
    if (remainingEnemies.length === 0 && !shopOpen) {
        wave++;
        enemySpeed = Math.min(enemySpeed + 0.5, 6);
        enemyBullets.length = 0;
        shopOpen = true;
    }
}

function removeDestroyedObstacles() {
    for (let index = obstacles.length - 1; index >= 0; index--) {
        if (obstacles[index].health <= 0) {
            obstacles.splice(index, 1);
        }
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
    const flameLength = 8 + Math.sin(Date.now() / 85) * 3;

    ctx.shadowColor = skin.hull;
    ctx.shadowBlur = 10;
    ctx.fillStyle = skin.hull;
    ctx.beginPath();
    if (skin.style === "heavy") {
        ctx.moveTo(centerX, -4);
        ctx.lineTo(player.width - 3, 5);
        ctx.lineTo(player.width - 8, player.height - 1);
        ctx.lineTo(centerX + 10, player.height - 4);
        ctx.lineTo(centerX, player.height + 1);
        ctx.lineTo(centerX - 10, player.height - 4);
        ctx.lineTo(8, player.height - 1);
        ctx.lineTo(3, 5);
    } else if (skin.style === "royal") {
        ctx.moveTo(centerX, -10);
        ctx.lineTo(centerX + 8, 2);
        ctx.lineTo(player.width - 1, player.height - 3);
        ctx.lineTo(centerX + 7, player.height - 7);
        ctx.lineTo(centerX, player.height + 1);
        ctx.lineTo(centerX - 7, player.height - 7);
        ctx.lineTo(1, player.height - 3);
        ctx.lineTo(centerX - 8, 2);
    } else if (skin.style === "sleek") {
        ctx.moveTo(centerX, -11);
        ctx.lineTo(centerX + 6, 5);
        ctx.lineTo(player.width - 3, player.height - 1);
        ctx.lineTo(centerX, player.height - 9);
        ctx.lineTo(3, player.height - 1);
        ctx.lineTo(centerX - 6, 5);
    } else {
        ctx.moveTo(centerX, -10);
        ctx.lineTo(centerX + 8, 5);
        ctx.lineTo(player.width - 2, player.height - 2);
        ctx.lineTo(centerX + 6, player.height - 7);
        ctx.lineTo(centerX, player.height - 3);
        ctx.lineTo(centerX - 6, player.height - 7);
        ctx.lineTo(2, player.height - 2);
        ctx.lineTo(centerX - 8, 5);
    }
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = skin.trim;
    ctx.beginPath();
    ctx.moveTo(centerX, -5);
    ctx.lineTo(centerX + 3, 5);
    ctx.lineTo(player.width - 13, player.height - 5);
    ctx.lineTo(centerX, player.height - 11);
    ctx.lineTo(13, player.height - 5);
    ctx.lineTo(centerX - 3, 5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = skin.wing;
    ctx.beginPath();
    ctx.moveTo(8, player.height - 7);
    ctx.lineTo(1, player.height + 2);
    ctx.lineTo(19, player.height - 8);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(player.width - 8, player.height - 7);
    ctx.lineTo(player.width - 1, player.height + 2);
    ctx.lineTo(player.width - 19, player.height - 8);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(238, 255, 250, 0.72)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX, -5);
    ctx.lineTo(centerX, player.height - 9);
    ctx.moveTo(centerX - 13, 16);
    ctx.lineTo(centerX - 7, 19);
    ctx.lineTo(centerX - 2, 16);
    ctx.moveTo(centerX + 13, 16);
    ctx.lineTo(centerX + 7, 19);
    ctx.lineTo(centerX + 2, 16);
    ctx.stroke();

    ctx.fillStyle = "#142c31";
    ctx.beginPath();
    ctx.ellipse(centerX, 7, 3.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = skin.trim;
    ctx.beginPath();
    ctx.ellipse(centerX, 6, 1.5, 2.8, 0, 0, Math.PI * 2);
    ctx.fill();

    for (const engineX of [centerX - 14, centerX + 14]) {
        ctx.fillStyle = "#142c31";
        ctx.beginPath();
        ctx.roundRect(engineX - 3, player.height - 5, 6, 8, 2);
        ctx.fill();
        ctx.fillStyle = skin.engine;
        ctx.beginPath();
        ctx.moveTo(engineX - 2, player.height + 1);
        ctx.lineTo(engineX + 2, player.height + 1);
        ctx.lineTo(engineX, player.height + flameLength);
        ctx.closePath();
        ctx.fill();
    }
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

function drawObstacles() {
    obstacles.forEach((obstacle) => {
        const integrity = obstacle.health / MAX_OBSTACLE_HEALTH;
        ctx.save();
        ctx.translate(obstacle.x, obstacle.y);
        ctx.shadowColor = integrity > 0.5 ? "#68cbbb" : "#e5a66a";
        ctx.shadowBlur = 9;
        ctx.fillStyle = integrity > 0.5 ? "#294d4d" : "#55443a";
        ctx.strokeStyle = integrity > 0.5 ? "#75e6ca" : "#f2b96f";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(5, 2);
        ctx.lineTo(obstacle.width - 9, 0);
        ctx.lineTo(obstacle.width - 2, 7);
        ctx.lineTo(obstacle.width - 5, obstacle.height - 4);
        ctx.lineTo(obstacle.width - 15, obstacle.height - 1);
        ctx.lineTo(8, obstacle.height - 3);
        ctx.lineTo(1, obstacle.height - 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(185, 239, 220, 0.52)";
        ctx.beginPath();
        ctx.moveTo(13 + obstacle.variant * 2, 5);
        ctx.lineTo(23, 12);
        ctx.lineTo(18, 20);
        ctx.moveTo(23, 12);
        ctx.lineTo(38, 8);
        ctx.stroke();
        ctx.fillStyle = PALETTE.accent;
        ctx.fillRect(4, obstacle.height + 4, (obstacle.width - 8) * integrity, 2);
        ctx.restore();
    });
}

function drawBullets() {
    bullets.forEach((bullet) => {
        ctx.save();
        ctx.translate(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2);
        ctx.shadowColor = bullet.color || playerSkins[selectedSkin].hull;
        ctx.shadowBlur = 10;
        ctx.fillStyle = bullet.color || PALETTE.accentBright;
        if (bullet.kind === "pulse") {
            ctx.beginPath();
            ctx.roundRect(-bullet.width / 2, -bullet.height / 2, bullet.width, bullet.height, 3);
            ctx.fill();
            ctx.fillStyle = "#effff8";
            ctx.fillRect(-1.2, -bullet.height / 2 + 3, 2.4, bullet.height - 6);
        } else if (bullet.kind === "missile") {
            ctx.rotate(Math.atan2(bullet.vy, bullet.vx) + Math.PI / 2);
            ctx.beginPath();
            ctx.moveTo(0, -bullet.height / 2);
            ctx.lineTo(bullet.width / 2, 2);
            ctx.lineTo(2, bullet.height / 2);
            ctx.lineTo(-2, bullet.height / 2);
            ctx.lineTo(-bullet.width / 2, 2);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = "#fff1d2";
            ctx.fillRect(-1, -2, 2, 6);
        } else {
            ctx.beginPath();
            ctx.moveTo(0, -bullet.height / 2);
            ctx.lineTo(bullet.width / 2, -bullet.height / 5);
            ctx.lineTo(bullet.width / 2, bullet.height / 2);
            ctx.lineTo(-bullet.width / 2, bullet.height / 2);
            ctx.lineTo(-bullet.width / 2, -bullet.height / 5);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = "#f3fff9";
            ctx.fillRect(-0.8, -bullet.height / 3, 1.6, bullet.height / 2);
        }
        ctx.restore();
    });

    enemyBullets.forEach((bullet) => {
        const centerX = bullet.x + bullet.width / 2;
        const centerY = bullet.y + bullet.height / 2;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(bullet.angle || 0);

        if (bullet.type === "orb") {
            ctx.shadowColor = "#f2b96f";
            ctx.shadowBlur = 9;
            ctx.fillStyle = "#ad654e";
            ctx.beginPath();
            ctx.arc(0, 0, bullet.width / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#e6a86d";
            ctx.beginPath();
            ctx.arc(-1, -1, bullet.width / 3.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#fff0c8";
            ctx.beginPath();
            ctx.arc(-2, -3, bullet.width / 7, 0, Math.PI * 2);
            ctx.fill();
        } else if (bullet.type === "mine") {
            ctx.shadowColor = "#83d9d0";
            ctx.shadowBlur = 15;
            ctx.fillStyle = "#4ca99d";
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
            ctx.fillStyle = "#d7fff3";
            ctx.beginPath();
            ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
            ctx.fill();
        } else if (bullet.type === "bolt") {
            ctx.shadowColor = "#df816d";
            ctx.shadowBlur = 12;
            ctx.fillStyle = "#df816d";
            ctx.beginPath();
            ctx.moveTo(0, -bullet.height);
            ctx.lineTo(bullet.width / 2, 0);
            ctx.lineTo(0, bullet.height);
            ctx.lineTo(-bullet.width / 2, 0);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = "#fff0dc";
            ctx.fillRect(-1, -bullet.height / 2, 2, bullet.height);
        } else {
            ctx.shadowColor = "#f2d390";
            ctx.shadowBlur = 10;
            ctx.fillStyle = "#f2d390";
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
        ctx.fillStyle = "#c3eee5";
        ctx.fillRect(star.x, star.y, star.size, star.size);
    }
    ctx.globalAlpha = 1;

    ctx.strokeStyle = "rgba(117, 230, 202, 0.035)";
    ctx.lineWidth = 1;
    for (let y = 120; y < canvas.height; y += 80) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
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
        ctx.shadowBlur = 8;
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
            ctx.fillStyle = "#70493b";
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
            ctx.fillStyle = "#17443f";
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
            ctx.fillStyle = "#373747";
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
            ctx.moveTo(centerX, 1);
            ctx.lineTo(enemy.width - 5, 7);
            ctx.lineTo(enemy.width - 1, centerY);
            ctx.lineTo(enemy.width - 7, enemy.height - 2);
            ctx.lineTo(centerX + 5, enemy.height - 5);
            ctx.lineTo(centerX, enemy.height - 1);
            ctx.lineTo(centerX - 5, enemy.height - 5);
            ctx.lineTo(7, enemy.height - 2);
            ctx.lineTo(1, centerY);
            ctx.lineTo(5, 7);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#243538";
            ctx.beginPath();
            ctx.moveTo(centerX - 10, centerY - 1);
            ctx.lineTo(centerX - 6, centerY - 6);
            ctx.lineTo(centerX + 6, centerY - 6);
            ctx.lineTo(centerX + 10, centerY - 1);
            ctx.lineTo(centerX + 6, centerY + 5);
            ctx.lineTo(centerX - 6, centerY + 5);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = style.core;
            ctx.fillRect(centerX - 6, centerY - 1, 12, 2);
            ctx.fillStyle = style.color;
            ctx.fillRect(centerX - 2, centerY - 2, 4, 4);
            ctx.strokeStyle = style.color;
            ctx.beginPath();
            ctx.moveTo(8, 9);
            ctx.lineTo(3, 3);
            ctx.lineTo(11, 6);
            ctx.moveTo(enemy.width - 8, 9);
            ctx.lineTo(enemy.width - 3, 3);
            ctx.lineTo(enemy.width - 11, 6);
            ctx.moveTo(7, enemy.height - 3);
            ctx.lineTo(12, enemy.height - 7);
            ctx.moveTo(enemy.width - 7, enemy.height - 3);
            ctx.lineTo(enemy.width - 12, enemy.height - 7);
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
    drawTechPanel(18, 16, canvas.width - 36, 58, PALETTE.accent);

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = `10px ${HUD_FONT}`;
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText("CRÉDITOS", 38, 33);
    ctx.fillText("SETOR / ONDA", canvas.width / 2 - 42, 33);
    ctx.fillText("CASCO", canvas.width - 205, 33);

    ctx.font = `bold 19px ${HUD_FONT}`;
    ctx.fillStyle = PALETTE.text;
    ctx.fillText(String(score).padStart(5, "0"), 38, 55);
    ctx.fillText(String(wave).padStart(2, "0"), canvas.width / 2 - 27, 55);

    for (let i = 0; i < MAX_LIVES; i++) {
        const x = canvas.width - 205 + i * 22;
        ctx.fillStyle = i < lives ? PALETTE.accent : "rgba(143, 169, 169, 0.2)";
        ctx.shadowColor = i < lives ? PALETTE.accent : "transparent";
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
    ctx.font = `10px ${HUD_FONT}`;
    ctx.fillStyle = shieldCharges > 0 ? "#82c6dc" : "#617779";
    ctx.fillText(`SHIELD ${shieldCharges}`, canvas.width - 282, 51);
    ctx.textAlign = "left";
    ctx.restore();
}

function drawHomeButton() {
    drawTechButton(getHomeButtonBounds(), "MENU", false);
}

function roundedRect(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
}

function drawTechPanel(x, y, width, height, accent = PALETTE.accent, fill = PALETTE.panel) {
    const cut = Math.min(12, height / 4, width / 8);
    ctx.beginPath();
    ctx.moveTo(x + cut, y);
    ctx.lineTo(x + width - cut, y);
    ctx.lineTo(x + width, y + cut);
    ctx.lineTo(x + width, y + height - cut);
    ctx.lineTo(x + width - cut, y + height);
    ctx.lineTo(x + cut, y + height);
    ctx.lineTo(x, y + height - cut);
    ctx.lineTo(x, y + cut);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = PALETTE.line;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 2, y + cut + 6);
    ctx.lineTo(x + 2, y + cut);
    ctx.lineTo(x + cut, y + 2);
    ctx.lineTo(x + cut + 14, y + 2);
    ctx.moveTo(x + width - cut - 14, y + 2);
    ctx.lineTo(x + width - cut, y + 2);
    ctx.lineTo(x + width - 2, y + cut);
    ctx.lineTo(x + width - 2, y + cut + 6);
    ctx.stroke();
}

function drawTechButton(bounds, label, primary = true) {
    ctx.save();
    drawTechPanel(
        bounds.x,
        bounds.y,
        bounds.width,
        bounds.height,
        primary ? PALETTE.accent : PALETTE.amber,
        primary ? "rgba(35, 82, 78, 0.96)" : "rgba(11, 30, 36, 0.96)"
    );
    if (primary) {
        ctx.fillStyle = "rgba(117, 230, 202, 0.08)";
        ctx.fillRect(bounds.x + 4, bounds.y + 4, bounds.width - 8, bounds.height - 8);
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = primary ? PALETTE.accentBright : PALETTE.text;
    ctx.font = `bold 15px ${HUD_FONT}`;
    ctx.fillText(label, bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    ctx.restore();
}

function drawStartScreen() {
    ctx.fillStyle = "rgba(3, 12, 16, 0.76)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    drawTechPanel(90, 102, 620, 395, PALETTE.accent, "rgba(6, 19, 24, 0.9)");
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `11px ${HUD_FONT}`;
    ctx.fillText("SISTEMA DE DEFESA ORBITAL  /  TERMINAL 07", canvas.width / 2, 148);
    ctx.shadowColor = PALETTE.accent;
    ctx.shadowBlur = 20;
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 48px ${HUD_FONT}`;
    ctx.fillText("SPACE INVADERS", canvas.width / 2, canvas.height / 2 - 94);
    ctx.shadowBlur = 0;
    ctx.fillStyle = PALETTE.accent;
    ctx.fillRect(canvas.width / 2 - 72, canvas.height / 2 - 61, 144, 2);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `16px ${HUD_FONT}`;
    ctx.fillText("Defenda a galáxia e sobreviva às ondas inimigas", canvas.width / 2, canvas.height / 2 - 43);
    ctx.font = `13px ${HUD_FONT}`;
    ctx.fillStyle = PALETTE.text;
    ctx.fillText("Mova: setas ou W A S D     Atire: ESPAÇO", canvas.width / 2, canvas.height / 2 + 20);

    const button = getStartButtonBounds();
    drawTechButton(button, "INICIAR MISSÃO");
    const catalogButton = getCatalogButtonBounds();
    drawTechButton(catalogButton, "ARQUIVO GALÁCTICO", false);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
}

function drawCatalog() {
    ctx.fillStyle = "rgba(3, 12, 16, 0.94)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = PALETTE.text;
    ctx.shadowColor = PALETTE.accent;
    ctx.shadowBlur = 16;
    ctx.font = `bold 31px ${HUD_FONT}`;
    ctx.fillText("ARQUIVO GALÁCTICO", canvas.width / 2, 63);
    ctx.shadowBlur = 0;
    ctx.font = `13px ${HUD_FONT}`;
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText("Equipamentos, classes inimigas e skins disponíveis", canvas.width / 2, 94);

    const columns = [
        { x: 24, title: "EQUIPAMENTOS", color: PALETTE.accent },
        { x: 280, title: "CONTATOS HOSTIS", color: PALETTE.amber },
        { x: 536, title: "CONFIGURAÇÕES DE NAVE", color: "#a9b9e0" },
    ];
    for (const column of columns) {
        drawTechPanel(column.x, 120, 240, 376, column.color, "rgba(8, 24, 30, 0.92)");
        ctx.fillStyle = column.color;
        ctx.font = `bold 13px ${HUD_FONT}`;
        ctx.fillText(column.title, column.x + 120, 145);
    }

    ctx.textAlign = "left";
    ctx.font = `bold 10px ${HUD_FONT}`;
    shopItems.forEach((item, index) => {
        const y = 170 + index * 27;
        ctx.fillStyle = item.color;
        ctx.font = `bold 10px ${HUD_FONT}`;
        ctx.fillText(item.title, 38, y, 210);
        ctx.font = `9px ${HUD_FONT}`;
        ctx.fillStyle = PALETTE.muted;
        ctx.fillText(item.description, 38, y + 12, 210);
        ctx.font = `bold 10px ${HUD_FONT}`;
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
        ctx.font = `bold 12px ${HUD_FONT}`;
        ctx.fillText(name, 294, y);
        ctx.fillStyle = PALETTE.muted;
        ctx.font = `11px ${HUD_FONT}`;
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
        ctx.fillStyle = PALETTE.text;
        ctx.font = `bold 11px ${HUD_FONT}`;
        ctx.fillText(skin.name, 572, y - 3);
        ctx.fillStyle = selectedSkin === id ? PALETTE.accent : ownedSkins.has(id) ? PALETTE.muted : PALETTE.amber;
        ctx.font = `10px ${HUD_FONT}`;
        ctx.fillText(
            selectedSkin === id ? "EQUIPADA" : ownedSkins.has(id) ? "ADQUIRIDA" : "À VENDA NA LOJA",
            572,
            y + 13
        );
    });

    const closeButton = getCatalogCloseBounds();
    drawTechButton(closeButton, "VOLTAR AO MENU", false);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
}

function drawGameOver() {
    ctx.fillStyle = "rgba(3, 12, 16, 0.84)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    drawTechPanel(170, 185, 460, 240, PALETTE.amber, "rgba(8, 24, 30, 0.96)");
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 40px ${HUD_FONT}`;
    ctx.fillText("SINAL PERDIDO", canvas.width / 2, canvas.height / 2 - 75);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `16px ${HUD_FONT}`;
    ctx.fillText(`Pontuação final: ${String(score).padStart(5, "0")}`, canvas.width / 2, canvas.height / 2 - 25);

    const button = getRestartButtonBounds();
    drawTechButton(button, "REINICIAR MISSÃO");
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
}

function drawShop() {
    ctx.fillStyle = "rgba(3, 12, 16, 0.9)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = PALETTE.text;
    ctx.shadowColor = PALETTE.accent;
    ctx.shadowBlur = 18;
    ctx.font = `bold 30px ${HUD_FONT}`;
    ctx.fillText("BAIA DE EQUIPAMENTOS", canvas.width / 2, 67);

    ctx.shadowBlur = 0;
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `13px ${HUD_FONT}`;
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

        drawTechPanel(
            card.x,
            card.y,
            card.width,
            card.height,
            canAfford ? item.color : "rgba(117, 145, 145, 0.48)",
            "rgba(8, 24, 30, 0.97)"
        );

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
        ctx.font = `bold 11px ${HUD_FONT}`;
        ctx.fillText(item.title, card.x + card.width / 2, card.y + 17, card.width - 18);

        ctx.fillStyle = PALETTE.muted;
        ctx.font = `10px ${HUD_FONT}`;
        ctx.fillText(item.description, card.x + card.width / 2, card.y + 36, card.width - 18);

        ctx.fillStyle = isOwnedSkin
            ? (selectedSkin === skinId ? PALETTE.accent : PALETTE.text)
            : soldOut ? "#7e8aa8" : canAfford ? "#ffffff" : "#ff9ba7";
        ctx.font = `bold 11px ${HUD_FONT}`;
        ctx.fillText(
            isOwnedSkin
                ? (selectedSkin === skinId ? "EQUIPADA" : "CLIQUE PARA EQUIPAR")
                : soldOut ? "LIMITE ATINGIDO" : `${cost} CRÉDITOS`,
            card.x + card.width / 2,
            card.y + 55,
            card.width - 12
        );
        ctx.fillStyle = PALETTE.muted;
        ctx.font = `9px ${HUD_FONT}`;
        ctx.fillText(getItemLevel(item), card.x + card.width / 2, card.y + 70);
    });

    const button = getContinueButtonBounds();
    drawTechButton(button, "INICIAR PRÓXIMO SETOR");
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `11px ${HUD_FONT}`;
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
    pulseLevel = 0;
    missileLevel = 0;
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
    createObstacles();
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
        drawObstacles();
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
        drawHomeButton();
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