//=====================
//CONFIGURAÇÃO INICIAL
//=====================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const keys = {};

let score = 0;
let gameOver = false;
let gameStarted = false;
let shopOpen = false;
let wave = 1;
let lives = 3;
let playerInvulnerableUntil = 0;
let nextPlayerShotAt = 0;
let nextEnemyShotAt = 0;
let rapidFireLevel = 0;
let spreadShotLevel = 0;
const MAX_LIVES = 5;
const stars = Array.from({ length: 90 }, () => ({
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
];

//=====================
//INIMIGOS
//=====================

const enemies = [];
const ENEMY_ROWS = 3;
const ENEMY_COLS = 8;
const ENEMY_WIDTH = 40;

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
    const button = getStartButtonBounds();

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
        x: canvas.width / 2 - 110,
        y: canvas.height / 2 + 54,
        width: 220,
        height: 56,
    };
}

function getShopCardBounds(index) {
    const width = 210;
    const gap = 18;
    return {
        x: canvas.width / 2 - (width * 3 + gap * 2) / 2 + index * (width + gap),
        y: canvas.height / 2 - 48,
        width,
        height: 150,
    };
}

function getContinueButtonBounds() {
    return {
        x: canvas.width / 2 - 120,
        y: canvas.height / 2 + 135,
        width: 240,
        height: 52,
    };
}

function getPowerUpCost(item) {
    const level = item.id === "rapid" ? rapidFireLevel : spreadShotLevel;
    return item.baseCost * (item.id === "life" ? 1 : level + 1);
}

function purchasePowerUp(item) {
    if (
        (item.id === "life" && lives >= MAX_LIVES) ||
        (item.id === "rapid" && rapidFireLevel >= 4) ||
        (item.id === "spread" && spreadShotLevel >= 2)
    ) return;

    const cost = getPowerUpCost(item);
    if (score < cost) return;

    score -= cost;
    if (item.id === "rapid") {
        rapidFireLevel++;
    } else if (item.id === "spread") {
        spreadShotLevel++;
    } else if (item.id === "life") {
        lives++;
    }
}

function startNextWave() {
    shopOpen = false;
    createEnemies();
    nextEnemyShotAt = Date.now() + 900;
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
            const enterFromSides = wave % 2 === 0;
            const enemy = {
                x: enterFromSides
                    ? (col < ENEMY_COLS / 2 ? -ENEMY_WIDTH - row * 22 : canvas.width + row * 22)
                    : homeX,
                y: enterFromSides ? homeY - 55 : -ENEMY_WIDTH - col * 13,
                homeX,
                homeY,
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
    for (const offset of shotOffsets) {
        bullets.push({
            x: player.x + player.width / 2 - 2.5 + offset,
            y: player.y,
            width: 5,
            height: 12,
        });
    }
}

//=====================
//MOVIMENTO JOGADOR
//=====================

function updatePlayer() {
    if ((keys["ArrowLeft"] || keys["KeyA"]) && player.x > 0) {
        player.x -= player.speed;
    }
    if ((keys["ArrowRight"] || keys["KeyD"]) && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }
    if ((keys["ArrowUp"] || keys["KeyW"]) && player.y > PLAYER_TOP_BOUNDARY) {
        player.y -= player.speed;
    }
    if ((keys["ArrowDown"] || keys["KeyS"]) && player.y < canvas.height - player.height - 16) {
        player.y += player.speed;
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
        bullets[i].y -= bulletSpeed;

        if (bullets[i].y < 0) {
            bullets.splice(i, 1);
        }

        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            const bullet = enemyBullets[i];
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            if (bullet.y > canvas.height || bullet.x < 0 || bullet.x > canvas.width) {
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
                enemy.x += (dx / distance) * entrySpeed;
                enemy.y += (dy / distance) * entrySpeed;
            }
        }
    }

    for (const enemy of enemies) {
        if (enemy.alive && !enemy.entering) {
            enemy.x += enemySpeed * enemyDirection;

            if (enemy.x <= 0 || enemy.x + enemy.width >= canvas.width) {
                shouldChangeDirection = true;
            }
        }
    }

    if (shouldChangeDirection) {
        enemyDirection *= -1;
        for (const enemy of enemies) {
            if (enemy.alive && !enemy.entering) {
                enemy.y += 20;
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

    const fireInterval = Math.max(520, 1700 - (wave - 1) * 115);
    if (now >= nextEnemyShotAt) {
        const shooters = enemies.filter(enemy => enemy.alive && !enemy.entering);
        if (shooters.length > 0) {
            const shooter = shooters[Math.floor(Math.random() * shooters.length)];
            const deltaX = player.x + player.width / 2 - (shooter.x + shooter.width / 2);
            const deltaY = player.y - (shooter.y + shooter.height);
            const distance = Math.hypot(deltaX, deltaY) || 1;
            const shotSpeed = 3.5 + Math.min(wave * 0.35, 4);
            enemyBullets.push({
                x: shooter.x + shooter.width / 2 - 2,
                y: shooter.y + shooter.height,
                width: 4,
                height: 12,
                vx: (deltaX / distance) * shotSpeed,
                vy: (deltaY / distance) * shotSpeed,
            });
        }
        nextEnemyShotAt = now + fireInterval;
    }
}

function damagePlayer() {
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
                bullets.splice(b, 1);
                score += 10;
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
    const flameLength = 9 + Math.sin(Date.now() / 70) * 4;

    ctx.shadowColor = "#45e7ff";
    ctx.shadowBlur = 16;
    ctx.fillStyle = "#1bd8ff";
    ctx.beginPath();
    ctx.moveTo(centerX, -8);
    ctx.lineTo(player.width - 4, player.height - 3);
    ctx.lineTo(centerX, player.height - 9);
    ctx.lineTo(4, player.height - 3);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#d8faff";
    ctx.beginPath();
    ctx.moveTo(centerX, -4);
    ctx.lineTo(player.width - 10, player.height - 6);
    ctx.lineTo(centerX, player.height - 12);
    ctx.lineTo(10, player.height - 6);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ff4f9a";
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

    ctx.fillStyle = "#2479d8";
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

    ctx.fillStyle = "#ffb52e";
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
}

//=====================
//DESENHO TIROS
//=====================

function drawBullets() {
    ctx.save();
    ctx.shadowColor = "#ffe766";
    ctx.shadowBlur = 10;
    ctx.fillStyle = "#ffe766";
    bullets.forEach((bullet) => {
        ctx.fillRect(
            bullet.x, 
            bullet.y, 
            bullet.width, 
            bullet.height
        );
    });
    ctx.restore();

    ctx.save();
    ctx.shadowColor = "#ff5478";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#ff5478";
    enemyBullets.forEach((bullet) => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
    ctx.restore();
}

//=====================
//DESENHO INIMIGOS
//=====================

function drawBackground() {
    const background = ctx.createLinearGradient(0, 0, 0, canvas.height);
    background.addColorStop(0, "#101b4d");
    background.addColorStop(0.55, "#080e29");
    background.addColorStop(1, "#02040d");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const star of stars) {
        star.y += star.speed;
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
        const rowColor = ["#ff548c", "#ba73ff", "#46e5cf", "#ffc857", "#54a0ff"][enemy.row % 5];

        ctx.shadowColor = rowColor;
        ctx.shadowBlur = 12;
        ctx.fillStyle = rowColor;
        ctx.beginPath();
        ctx.moveTo(centerX, 1);
        ctx.lineTo(enemy.width - 3, 8);
        ctx.lineTo(enemy.width - 1, centerY + 5);
        ctx.lineTo(enemy.width - 8, enemy.height - 2);
        ctx.lineTo(6, enemy.height - 2);
        ctx.lineTo(1, centerY + 5);
        ctx.lineTo(3, 8);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = "#17245a";
        ctx.beginPath();
        ctx.moveTo(8, 9);
        ctx.lineTo(centerX, 5);
        ctx.lineTo(enemy.width - 8, 9);
        ctx.lineTo(enemy.width - 11, centerY + 1);
        ctx.lineTo(11, centerY + 1);
        ctx.closePath();
        ctx.fill();

        for (const eyeX of [centerX - 7, centerX + 7]) {
            ctx.fillStyle = "#fff29a";
            ctx.beginPath();
            ctx.ellipse(eyeX, centerY, 3, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#32134d";
            ctx.beginPath();
            ctx.arc(eyeX, centerY, 1.3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.strokeStyle = rowColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(8, enemy.height - 5);
        ctx.lineTo(3, enemy.height);
        ctx.moveTo(enemy.width - 8, enemy.height - 5);
        ctx.lineTo(enemy.width - 3, enemy.height);
        ctx.moveTo(centerX, 4);
        ctx.lineTo(centerX, 0);
        ctx.stroke();

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
    ctx.fillText("Mova: setas ou W A S D     Atire: ESPAÇO", canvas.width / 2, canvas.height / 2 + 32);

    const button = getStartButtonBounds();
    ctx.fillStyle = "#1bd8ff";
    ctx.shadowColor = "#1bd8ff";
    ctx.shadowBlur = 18;
    roundedRect(button.x, button.y, button.width, button.height, 12);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#061126";
    ctx.font = "bold 18px Arial";
    ctx.fillText("INICIAR JOGO", canvas.width / 2, button.y + button.height / 2);
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

    const button = getStartButtonBounds();
    ctx.fillStyle = "#1bd8ff";
    ctx.shadowColor = "#1bd8ff";
    ctx.shadowBlur = 18;
    roundedRect(button.x, button.y, button.width, button.height, 12);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#061126";
    ctx.font = "bold 18px Arial";
    ctx.fillText("JOGAR NOVAMENTE", canvas.width / 2, button.y + button.height / 2);
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
    ctx.font = "bold 38px Arial";
    ctx.fillText("LOJA DE APRIMORAMENTOS", canvas.width / 2, 112);

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#aabce5";
    ctx.font = "16px Arial";
    ctx.fillText(`Onda ${wave} concluída  ·  Créditos disponíveis: ${score}`, canvas.width / 2, 151);
    ctx.fillText("Clique em um item para comprar. Os créditos são sua pontuação.", canvas.width / 2, 180);

    shopItems.forEach((item, index) => {
        const card = getShopCardBounds(index);
        const cost = getPowerUpCost(item);
        const soldOut = (item.id === "life" && lives >= MAX_LIVES) ||
            (item.id === "rapid" && rapidFireLevel >= 4) ||
            (item.id === "spread" && spreadShotLevel >= 2);
        const canAfford = score >= cost && !soldOut;

        ctx.fillStyle = "rgba(11, 20, 51, 0.96)";
        ctx.strokeStyle = canAfford ? item.color : "rgba(143, 169, 217, 0.28)";
        ctx.lineWidth = 2;
        roundedRect(card.x, card.y, card.width, card.height, 14);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = item.color;
        ctx.font = "bold 16px Arial";
        ctx.fillText(item.title, card.x + card.width / 2, card.y + 34);

        ctx.fillStyle = "#c4d0eb";
        ctx.font = "13px Arial";
        ctx.fillText(item.description, card.x + card.width / 2, card.y + 68);

        ctx.fillStyle = soldOut ? "#7e8aa8" : canAfford ? "#ffffff" : "#ff9ba7";
        ctx.font = "bold 15px Arial";
        ctx.fillText(
            soldOut ? "LIMITE ATINGIDO" : `${cost} CRÉDITOS`,
            card.x + card.width / 2,
            card.y + 112
        );
        ctx.fillStyle = "#8fa9d9";
        ctx.font = "12px Arial";
        const upgradeLevel = item.id === "rapid" ? rapidFireLevel : spreadShotLevel;
        if (item.id !== "life") {
            ctx.fillText(
                soldOut ? "NÍVEL MÁXIMO" : `Nível atual: ${upgradeLevel}`,
                card.x + card.width / 2,
                card.y + 134
            );
        }
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
        drawStartScreen();
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

function gameLoop() {
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