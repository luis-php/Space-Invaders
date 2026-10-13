//=====================
//CONFIGURAÇÃO INICIAL
//=====================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const keys = {};

let score = 0;
let gameOver = false;
let lives = 3;

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

//=====================
//TIROS
//=====================

const bullets = [];
const bulletSpeed = 10;

let canShoot = true;

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

    if (event.code === "Space" && canShoot && !gameOver) {
        shoot();
        canShoot = false;
    }

    if (event.code === "KeyR" && gameOver) {
        resetGame();
    }
});

window.addEventListener("keyup", (event) => {
    keys[event.code] = false;
    if (event.code === "Space") {
        canShoot = true;
    }
});

//=====================
//CRIA INIMIGOS
//=====================

function createEnemies() {
    enemies.length = 0;

    const startX = 50;
    const startY = 50;
    const spacingX = 60;
    const spacingY = 50;

    for (let row = 0; row < ENEMY_ROWS; row++) {
        for (let col = 0; col < ENEMY_COLS; col++) {
            const enemy = {
                x: startX + col * spacingX,
                y: startY + row * spacingY,
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
    bullets.push({
        x: player.x + player.width / 2 - 2.5,
        y: player.y,
        width: 5,
        height: 10,
    });
}

//=====================
//MOVIMENTO JOGADOR
//=====================

function updatePlayer() {
    if (keys["ArrowLeft"] && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys["ArrowRight"] && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }
    if (keys["ArrowUp"] && player.y > 0) {
        player.y -= player.speed;
    }
    if (keys["ArrowDown"] && player.y < canvas.height - player.height) {
        player.y += player.speed;
    }
    if (player.x < 0) player.x = 0;
    if (player.y < 0) player.y = 0;

    if (player.x > canvas.width - player.width) player.x = canvas.width - player.width;
    if (player.y > canvas.height - player.height) player.y = canvas.height - player.height;
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
    }
}

//=====================
//MOVIMENTO INIMIGOS
//=====================

function updateEnemies() {
    let shouldChangeDirection = false;
    for (const enemy of enemies) {
        if (enemy.alive) {
            enemy.x += enemySpeed * enemyDirection;

        if (enemy.x <= 0 || enemy.x + enemy.width >= canvas.width) {
                shouldChangeDirection = true;
            }   
        }
    }
    if (shouldChangeDirection) {
        enemyDirection *= -1;
        for (const enemy of enemies) {
            if (enemy.alive) {
                enemy.y += 20;

    if (enemy.y + enemy.height >= player.y) {
        lives--;
        if (lives <= 0) {
            gameOver = true;
        } else {
            bullets.length = 0;
            enemyDirection = 1;
            createEnemies();
            player.x = canvas.width / 2 - player.width / 2;
        }
        return;
        }
        }
        }
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
    if (remainingEnemies.length === 0) {
        createEnemies();
        enemySpeed += 0.5;
    }
}

//=====================
//DESENHO JOGADOR
//=====================

function drawPlayer() {
    ctx.save(); 
    ctx.translate(player.x, player.y);

    // CORPO FOGUETE
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, player.width, player.height);

    // CABEÇA FOGUETE
    ctx.beginPath();
    ctx.moveTo(player.width / 2, -10);
    ctx.lineTo(player.width, 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fillStyle = "red";
    ctx.fill();

    // Asa esquerda
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-10, 10);
    ctx.lineTo(player.width / 2, 10);
    ctx.closePath();
    ctx.fillStyle = "blue";
    ctx.fill();

    // Asa direita
    ctx.beginPath();
    ctx.moveTo(player.width, 0);
    ctx.lineTo(player.width + 10, 10);
    ctx.lineTo(player.width / 2, 10);
    ctx.closePath();
    ctx.fillStyle = "blue";
    ctx.fill();

    // Janela
    ctx.beginPath();
    ctx.arc(player.width / 2, player.height / 2, 5, 0, Math.PI * 2);
    ctx.fillStyle = "lightblue";
    ctx.fill();

    //Chama
    ctx.fillStyle = "orange";
    ctx.beginPath();
    ctx.moveTo(player.width / 2 - 5, player.height);
    ctx.lineTo(player.width / 2 + 5, player.height);
    ctx.lineTo(player.width / 2, player.height + 15);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
} 

//=====================
//DESENHO TIROS
//=====================

function drawBullets() {
    ctx.fillStyle = "yellow";

    bullets.forEach((bullet) => {
        ctx.fillRect(
            bullet.x, 
            bullet.y, 
            bullet.width, 
            bullet.height
        );
    });
}

//=====================
//DESENHO INIMIGOS
//=====================

function drawEnemies() {
    enemies.forEach((enemy) => {
        if (!enemy.alive) return;

        ctx.save();

        ctx.translate(enemy.x, enemy.y);

        // Disco voador
        ctx.fillStyle = "green";
        ctx.beginPath();
        ctx.ellipse(enemy.width / 2, enemy.height / 2, enemy.width / 2, enemy.height / 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // cupula
        ctx.fillStyle = "lightgreen";
        ctx.beginPath();
        ctx.arc(enemy.width / 2, enemy.height / 4, enemy.width / 4, 0, Math.PI, true);
        ctx.fill();

        //luzes
        ctx.fillStyle = "yellow";
        ctx.beginPath();
        ctx.arc(enemy.width / 4, enemy.height / 2, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(enemy.width / 2, enemy.height / 2, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc((3 * enemy.width) / 4, enemy.height / 2, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    });
}

//=====================
//HUD
//=====================

function drawHUD() {
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.fillText(`Lives: ${lives}`, 10, 60);
}

//=====================
//GAME OVER
//=====================

function drawGameOver() {
    ctx.fillStyle = "white";
    ctx.font = "40px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = "20px Arial";
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillText("Press 'R' to Restart", canvas.width / 2, canvas.height / 2 + 50);
    ctx.textAlign = "left";
}

//=====================
//RESET
//=====================

function resetGame() {
    score = 0;
    lives = 3;
    gameOver = false;
    bullets.length = 0;
    enemySpeed = 1;
    player.x = canvas.width / 2 - player.width / 2;
    createEnemies();
}

//=====================
//RENDERIZAÇÃO
//=====================

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawPlayer();
    drawBullets();
    drawEnemies();
    drawHUD();

    if (gameOver) {
        drawGameOver();
    }   
}

//=====================
//LOOP PRINCIPAL
//=====================

function gameLoop() {
    if (!gameOver) {
        updatePlayer();
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