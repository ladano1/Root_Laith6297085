// ======= CANVAS SETUP =======
const gameBox = document.getElementById("gameBox");
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
gameBox.appendChild(canvas);

// ======= BACKGROUND =======
const backgroundImage = new Image();
backgroundImage.src = "img/new background.png";
let bgLoaded = false;
backgroundImage.onload = () => (bgLoaded = true);

// ======= CHARACTER ANIMATION =======
const charFrames = [
    "img/character-01 1.png",
    "img/character-02 1.png",
    "img/character-03 1.png",
    "img/character-04 1.png"
];
let charImages = [];
let charLoaded = false;
let charIndex = 0;
let charTimer = 0;
let charAnimating = false;

// ===== CHARACTER SETTINGS (SLOWED DOWN, HIGHER JUMP) =====
let charX = canvas.width / 2;
let charY = 0;
let charVy = 0;
let charVx = 0;
const gravity = 0.8;
const jumpForce = -26; // higher jump
const moveSpeed = 6;
let isJumping = false;

// Cat size & rock sit offset
const CAT_HEIGHT = 150;
const CAT_SIT_OFFSET = 20; // how much the cat sinks into the rock

// Keyboard state for left/right movement
let leftPressed = false;
let rightPressed = false;

// Facing direction: 1 = normal, -1 = flipped horizontally
let facing = 1;

// ===== ROCKS =======
const rockImgs = [new Image(), new Image()];
rockImgs[0].src = "img/rocks-01 1.png";
rockImgs[1].src = "img/rocks-02 1.png";

let rockLoadedCount = 0;
let rockLoaded = false;
let rockSizes = [];

// How far apart rocks are vertically (smaller = closer)
const rockVerticalOffset = 60;

// Each rock in the stack has its own x + y
let rockStack = [];

// ======= FALLING OBJECTS =======
const goodyImg = new Image();
goodyImg.src = "img/orbs 1.png";

const baddieImg = new Image();
baddieImg.src = "img/bats 1.png";

// keep bats & goodies inside the central cave area (not behind black walls)
function getPlayableX(objWidth = 0) {
    const margin = canvas.width * 0.2; // 20% margin on each side
    const usableWidth = canvas.width - 2 * margin - objWidth;
    return margin + Math.random() * Math.max(usableWidth, 0);
}

let goodies = [];
let baddies = [];

// ---- BADDIE CORRECT SIZE (KEEPS REAL ASPECT RATIO) ----
let baddieWidth = 80;
let baddieHeight = 80;

baddieImg.onload = () => {
    const aspect = baddieImg.width / baddieImg.height; // ~1.7 (wider than tall)
    baddieHeight = 80;               // control height here
    baddieWidth = baddieHeight * aspect; // width scaled by aspect ratio
};

function spawnGoody() {
    const size = 80;
    goodies.push({
        x: getPlayableX(size),
        y: -50,
        size: size,
        speed: 2 + Math.random() * 1.5
    });
}

function spawnBaddie() {
    baddies.push({
        x: getPlayableX(baddieWidth), // left position, considers width
        y: -baddieHeight,
        width: baddieWidth,
        height: baddieHeight,
        speed: 2.5 + Math.random() * 1.5
    });
}

// ======= GAME VARIABLES =======
let score = 0;
let gameOver = false;
let frameCount = 0;

// ======= WIN / GAME OVER STATE =======
let gameWon = false;
// Winning is based on how HIGH the rock stack is:
const winRockY = canvas.height * 0.3; // when top rock's y <= this (near top), you win
let winTimer = 0;
let gameOverTimer = 0;

// ======= READY FLAG =======
let gameReady = false;  // becomes true after rocks are initialized

// ======= SOUNDS =======
const winSound = new Audio("audio/Gun sound.wav");
const gameOverSound = new Audio("audio/game-over.mp3");

// ======= INITIALIZE ROCKS =======
function initRocks() {
    gameReady = false;
    rockStack = [];
    if (!rockLoaded || !rockSizes[0]) return;

    // --- ONLY ONE BOTTOM ROCK (image 0) ---
    const bottomImgIndex = 0;
    const bottomSize = rockSizes[bottomImgIndex];
    const bottomY = canvas.height - bottomSize.height;
    const bottomX = canvas.width / 2 - bottomSize.width / 2;

    rockStack.push({
        imgIndex: bottomImgIndex,
        x: bottomX,
        y: bottomY
    });

    // Put the cat on top of the TOP rock
    charX = canvas.width / 2;
    resetCharPosition();

    gameReady = true;
}

// ======= ROCK IMAGE LOADERS =======
rockImgs.forEach((img, i) => {
    img.onload = () => {
        rockSizes[i] = { width: img.width, height: img.height };
        rockLoadedCount++;
        if (rockLoadedCount === rockImgs.length) {
            rockLoaded = true;
            initRocks();
        }
    };
});

// ======= CHARACTER POSITION =======
function resetCharPosition() {
    const topRock = rockStack[rockStack.length - 1];
    if (!topRock) {
        charY = canvas.height - (CAT_HEIGHT - CAT_SIT_OFFSET);
    } else {
        // sit nicely on the rock
        charY = topRock.y - (CAT_HEIGHT - CAT_SIT_OFFSET);
    }
    charVy = 0;
    isJumping = false;
    charAnimating = false;
    charIndex = 0;
    charTimer = 0;
    facing = 1;
}

// ======= MAIN LOOP (ONLY ONCE) =======
function loop() {
    if (!gameReady) {
        drawLoading();
        requestAnimationFrame(loop);
        return;
    }

    if (gameOver) {
        drawGameOver();
        requestAnimationFrame(loop);
        return;
    }

    if (gameWon) {
        updateWin();
        drawWin();
        requestAnimationFrame(loop);
        return;
    }

    update();
    draw();
    requestAnimationFrame(loop);
}

// ======= LOADING SCREEN =======
function drawLoading() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (bgLoaded) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    }
    ctx.fillStyle = "white";
    ctx.font = "20px 'Press Start 2P'";
    ctx.textAlign = "center";
    ctx.fillText("Loading...", canvas.width / 2, canvas.height / 2);
}

// ======= UPDATE (NORMAL GAME) =======
function update() {
    frameCount++;

    if (frameCount % 80 === 0) spawnGoody();
    if (frameCount % 140 === 0) spawnBaddie();

    // Horizontal movement
    charVx = 0;
    if (leftPressed) charVx -= moveSpeed;
    if (rightPressed) charVx += moveSpeed;
    charX += charVx;

    // Stay inside screen
    const halfCat = 75;
    if (charX < halfCat) charX = halfCat;
    if (charX > canvas.width - halfCat) charX = canvas.width - halfCat;

    // Vertical physics
    charVy += gravity;
    charY += charVy;

    // Stay on top of stack / ground
    const topRock = rockStack[rockStack.length - 1];
    const groundLevel = topRock
        ? topRock.y - (CAT_HEIGHT - CAT_SIT_OFFSET)
        : canvas.height - (CAT_HEIGHT - CAT_SIT_OFFSET);

    if (charY > groundLevel) {
        charY = groundLevel;
        charVy = 0;
        isJumping = false;
    }

    // Animation
    if (charAnimating) {
        charTimer++;
        if (charTimer % 10 === 0) {
            charIndex++;
            if (charIndex >= charImages.length) {
                charIndex = 0;
                charAnimating = false;
            }
        }
    } else if ((leftPressed || rightPressed) && !isJumping) {
        charAnimating = true;
        charIndex = 0;
        charTimer = 0;
    }

    // Move goodies & baddies
    goodies.forEach(g => g.y += g.speed);
    baddies.forEach(b => b.y += b.speed);

    goodies = goodies.filter(g => g.y < canvas.height + 100);
    baddies = baddies.filter(b => b.y < canvas.height + 100);

    checkCollisions();
}

// ======= COLLISIONS (FIXED HITBOX) =======
function checkCollisions() {
    // --- CAT HITBOX (matches how we draw it) ---
    const catWidth = 150;
    const catHalfWidth = catWidth / 2;
    const catLeft = charX - catHalfWidth;
    const catRight = charX + catHalfWidth;
    const catTop = charY;
    const catBottom = charY + CAT_HEIGHT; // 150

    // ===== GOODIES =====
    for (let i = goodies.length - 1; i >= 0; i--) {
        const g = goodies[i];

        const collides =
            g.x < catRight &&
            g.x + g.size > catLeft &&
            g.y < catBottom &&
            g.y + g.size > catTop;

        if (collides) {
            if (!rockLoaded || rockStack.length === 0) {
                score++;
                goodies.splice(i, 1);
                continue;
            }

            const nextRockIndex = rockStack.length % rockImgs.length;
            let size = rockSizes[nextRockIndex];
            if (!size) size = rockSizes[0];
            if (!size) {
                score++;
                goodies.splice(i, 1);
                continue;
            }

            const prevRock = rockStack[rockStack.length - 1];
            const newY = prevRock.y - rockVerticalOffset;
            const newX = canvas.width / 2 - size.width / 2;

            // Add new rock to stack
            rockStack.push({
                imgIndex: nextRockIndex,
                x: newX,
                y: newY
            });

            // Cat on the new top rock
            charY = newY - (CAT_HEIGHT - CAT_SIT_OFFSET);
            charVy = 0;
            isJumping = false;

            score++;
            goodies.splice(i, 1);

            // ✅ WIN CONDITION based on top rock height
            const topRockNow = rockStack[rockStack.length - 1];
            if (!gameWon && topRockNow && topRockNow.y <= winRockY) {
                startWin();
                return;
            }
        }
    }

    // ===== BADDIES =====
    for (let i = baddies.length - 1; i >= 0; i--) {
        const b = baddies[i];

        const bLeft = b.x;
        const bRight = b.x + b.width;
        const bTop = b.y;
        const bBottom = b.y + b.height;

        const collides =
            bLeft < catRight &&
            bRight > catLeft &&
            bTop < catBottom &&
            bBottom > catTop;

        if (collides) {
            gameOver = true;
            gameOverTimer = 0;

            // GAME OVER SOUND
            if (gameOverSound) {
                gameOverSound.pause();
                gameOverSound.currentTime = 0;
                gameOverSound.play().catch(() => {});
            }

            return;
        }
    }
}

// ======= WIN LOGIC =======
function startWin() {
    gameWon = true;
    winTimer = 0;

    if (winSound) {
        winSound.currentTime = 0;
        winSound.play().catch(() => {});
    }
}

function updateWin() {
    winTimer++;
}

// === GLITCHY NEON TEXT DRAW (supports color) ===
function drawGlitchText(text, x, y, baseSize, color = "#00ff66") {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${baseSize}px 'Press Start 2P'`;

    const sliceCount = 12;
    const glitchStrength = 10;

    for (let i = 0; i < sliceCount; i++) {
        const sliceHeight = baseSize / sliceCount;
        const sliceY = y - baseSize / 2 + i * sliceHeight;

        const offset = (Math.random() - 0.5) * glitchStrength;

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, sliceY, canvas.width, sliceHeight);
        ctx.clip();

        // soft glow behind
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 25;
        ctx.fillText(text, x + offset, y);

        // main bright core
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#e6ffe6";
        ctx.fillText(text, x + offset + 1, y);

        ctx.restore();
    }

    // random little neon pixels around
    for (let i = 0; i < 30; i++) {
        const px = x + (Math.random() - 0.5) * baseSize * 1.5;
        const py = y + (Math.random() - 0.5) * baseSize;
        const s = 2 + Math.random() * 4;
        ctx.fillStyle = "rgba(0,255,120,0.8)";
        ctx.fillRect(px, py, s, s);
    }
}

// === HELPER: GLOWING NEON RING (color is "r,g,b") ===
function drawGlowRing(x, y, radius, thickness, alpha, color = "0,255,140") {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.lineWidth = thickness;
    ctx.shadowColor = `rgba(${color},1)`;
    ctx.shadowBlur = 25;
    ctx.strokeStyle = `rgba(${color},${alpha})`;
    ctx.stroke();
    ctx.restore();
}

// ======= WIN SCREEN (slowed down) =======
function drawWin() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height * 0.35;

    const shakeStrength = 4;
    const shakeX = (Math.random() - 0.5) * shakeStrength;
    const shakeY = (Math.random() - 0.5) * shakeStrength;

    ctx.save();
    ctx.translate(shakeX, shakeY);

    const t = winTimer / 80;

    const grad = ctx.createRadialGradient(
        centerX, centerY, 50,
        centerX, centerY, canvas.height * 0.8
    );
    grad.addColorStop(0, "rgba(0, 255, 140, 0.28)");
    grad.addColorStop(0.4, "rgba(0, 40, 80, 1)");
    grad.addColorStop(1, "rgba(0, 5, 20, 1)");

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(0,0,0,0.40)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const ringBaseRadius = 140;
    const ringCount = 3;
    for (let i = 0; i < ringCount; i++) {
        const r = ringBaseRadius + i * 18 + Math.sin(t * 2 + i) * 6;
        const alpha = 0.25 + 0.12 * Math.sin(t * 3 + i);
        drawGlowRing(centerX, centerY, r, 5, alpha, "0,255,140");
    }

    ctx.fillStyle = "rgba(0,0,30,0.18)";
    for (let y = 0; y < canvas.height; y += 4) {
        ctx.fillRect(0, y, canvas.width, 1);
    }

    const baseSize = 80;
    const yOffset = Math.sin(winTimer / 40) * 4;

    drawGlitchText("VOUS GAGNEZ", centerX - 2, centerY + yOffset, baseSize, "#ff66ff");
    drawGlitchText("VOUS GAGNEZ", centerX + 2, centerY + yOffset + 1, baseSize, "#00ffff");
    drawGlitchText("VOUS GAGNEZ", centerX, centerY + yOffset, baseSize, "#00ff66");

    if (winTimer % 2 === 0) {
        const particleCount = 40;
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 20 + Math.random() * 140;
            const px = centerX + Math.cos(angle) * dist * (0.6 + 0.4 * Math.sin(t * 3 + i));
            const py = centerY + Math.sin(angle) * dist * (0.6 + 0.4 * Math.cos(t * 2 + i));
            const size = 2 + Math.random() * 3;

            ctx.fillStyle = `hsla(${120 + Math.random() * 60}, 100%, 60%, 0.75)`;
            ctx.fillRect(px, py, size, size);
        }
    }

    const btnWidth = 520;
    const btnHeight = 70;
    const btnX = centerX - btnWidth / 2;
    const btnY = canvas.height * 0.62 - btnHeight / 2;

    const glowPulse = 18 + 8 * Math.sin(winTimer / 30);

    ctx.save();
    ctx.shadowColor = "#00ff88";
    ctx.shadowBlur = glowPulse;
    ctx.fillStyle = "rgba(0, 20, 60, 0.9)";
    ctx.fillRect(btnX, btnY, btnWidth, btnHeight);
    ctx.restore();

    ctx.lineWidth = 4;
    ctx.strokeStyle = "#00ff88";
    ctx.strokeRect(btnX, btnY, btnWidth, btnHeight);

    ctx.strokeStyle = "rgba(0,255,160,0.4)";
    ctx.strokeRect(
        btnX + Math.sin(winTimer / 40) * 2,
        btnY + Math.cos(winTimer / 50) * 2,
        btnWidth,
        btnHeight
    );

    ctx.fillStyle = "#eaffff";
    ctx.font = "14px 'Press Start 2P'";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const btnText = "CLIQUEZ POUR REJOUER";

    const waveOffset = Math.sin(winTimer / 35) * 3;
    ctx.save();
    ctx.translate(centerX, btnY + btnHeight / 2 + waveOffset);
    ctx.fillText(btnText, 0, 0);
    ctx.restore();

    ctx.restore();
}

// ======= CRAZY (BUT SLOWER) GAME OVER SCREEN =======
function drawGameOver() {
    gameOverTimer++;

    const centerX = canvas.width / 2;
    const centerY = canvas.height * 0.35;

    const shakeStrength = 8;
    const shakeX = (Math.random() - 0.5) * shakeStrength;
    const shakeY = (Math.random() - 0.5) * shakeStrength;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(Math.sin(gameOverTimer / 16) * 0.03);
    ctx.translate(-centerX, -centerY);
    ctx.translate(shakeX, shakeY);

    const t = gameOverTimer / 80;

    const grad = ctx.createRadialGradient(
        centerX, centerY, 40,
        centerX, centerY, canvas.height * 0.9
    );
    grad.addColorStop(0, "rgba(255, 80, 140, 0.5)");
    grad.addColorStop(0.4, "rgba(60, 0, 40, 1)");
    grad.addColorStop(1, "rgba(5, 0, 10, 1)");

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const ringBaseRadius = 140;
    const ringCount = 4;
    for (let i = 0; i < ringCount; i++) {
        const r = ringBaseRadius + i * 25 + Math.sin(t * 3 + i) * 9;
        const alpha = 0.4 + 0.18 * Math.sin(t * 4 + i);
        drawGlowRing(centerX, centerY, r, 7, alpha, "255,40,80");
    }

    ctx.fillStyle = "rgba(0,0,0,0.3)";
    for (let y = 0; y < canvas.height; y += 4) {
        ctx.fillRect(0, y, canvas.width, 2);
    }

    for (let i = 0; i < 8; i++) {
        const barX = Math.random() * canvas.width;
        const barW = 10 + Math.random() * 40;
        const barAlpha = 0.08 + Math.random() * 0.18;
        ctx.fillStyle = `rgba(255, 80, 160, ${barAlpha})`;
        ctx.fillRect(barX, 0, barW, canvas.height);
    }

    for (let i = 0; i < 8; i++) {
        const ry = Math.random() * canvas.height;
        const rh = 3 + Math.random() * 7;
        const rx = (Math.random() - 0.5) * 50;
        ctx.fillStyle = "rgba(255,255,255,0.07)";
        ctx.fillRect(rx, ry, canvas.width, rh);
    }

    if (gameOverTimer % 60 < 5) {
        ctx.fillStyle = "rgba(255,0,40,0.18)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const baseSize = 80;
    const yOffset = Math.sin(gameOverTimer / 14) * 6;

    drawGlitchText("JEU TERMINÉ", centerX - 4, centerY + yOffset, baseSize, "#ff3366");
    drawGlitchText("JEU TERMINÉ", centerX + 4, centerY + yOffset + 2, baseSize, "#ff66ff");
    drawGlitchText("JEU TERMINÉ", centerX, centerY + yOffset, baseSize, "#ff0033");

    const particleCount = 70;
    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 20 + Math.random() * 170;
        const px = centerX + Math.cos(angle) * dist * (0.55 + 0.45 * Math.sin(t * 3 + i));
        const py = centerY + Math.sin(angle) * dist * (0.55 + 0.45 * Math.cos(t * 2 + i));
        const size = 2 + Math.random() * 4;

        ctx.fillStyle = `hsla(${330 + Math.random() * 40}, 100%, 60%, 0.9)`;
        ctx.fillRect(px, py, size, size);
    }

    const btnWidth = 520;
    const btnHeight = 70;
    const btnX = centerX - btnWidth / 2;
    const btnY = canvas.height * 0.62 - btnHeight / 2;

    const glowPulse = 24 + 10 * Math.sin(gameOverTimer / 14);

    ctx.save();
    ctx.shadowColor = "#ff3366";
    ctx.shadowBlur = glowPulse;
    ctx.fillStyle = "rgba(40, 0, 20, 0.95)";
    ctx.fillRect(btnX, btnY, btnWidth, btnHeight);
    ctx.restore();

    ctx.lineWidth = 4;
    ctx.strokeStyle = "#ff3366";
    ctx.strokeRect(btnX, btnY, btnWidth, btnHeight);

    ctx.strokeStyle = "rgba(255,150,200,0.5)";
    ctx.strokeRect(
        btnX + Math.sin(gameOverTimer / 16) * 2,
        btnY + Math.cos(gameOverTimer / 18) * 2,
        btnWidth,
        btnHeight
    );

    ctx.fillStyle = "#ffeaf5";
    ctx.font = "14px 'Press Start 2P'";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const btnText = "CLIQUEZ POUR REJOUER";

    const waveOffset = Math.sin(gameOverTimer / 22) * 4;
    ctx.save();
    ctx.translate(centerX, btnY + btnHeight / 2 + waveOffset);
    ctx.fillText(btnText, 0, 0);
    ctx.restore();

    ctx.restore();
}

// ======= INPUT =======
function handleJump() {
    if (gameOver || gameWon) {
        return;
    }

    if (!isJumping) {
        isJumping = true;
        charVy = jumpForce;
        charAnimating = true;
        charIndex = 0;
        charTimer = 0;
    }
}

window.addEventListener("keydown", e => {
    if (gameOver || gameWon) {
        return;
    }

    if (e.key === "ArrowUp") {
        handleJump();
    } else if (e.key === "ArrowLeft") {
        leftPressed = true;
        facing = 1;   // face left (normal)
    } else if (e.key === "ArrowRight") {
        rightPressed = true;
        facing = -1;  // face right (flipped)
    }
});

window.addEventListener("keyup", e => {
    if (e.key === "ArrowLeft") {
        leftPressed = false;
    } else if (e.key === "ArrowRight") {
        rightPressed = false;
    }
});

// Mouse / touch click = jump OR restart if win/lose
window.addEventListener("click", () => {
    if (gameOver || gameWon) {
        restart();
    } else {
        handleJump();
    }
});

// ======= DRAW (NORMAL) =======
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (bgLoaded) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    }

    if (rockLoaded && rockStack.length) {
        rockStack.forEach(rock => {
            const img = rockImgs[rock.imgIndex];
            ctx.drawImage(img, rock.x, rock.y);
        });
    }

    goodies.forEach(g => ctx.drawImage(goodyImg, g.x, g.y, g.size, g.size));

    // draw baddies with correct aspect ratio
    baddies.forEach(b =>
        ctx.drawImage(baddieImg, b.x, b.y, b.width, b.height)
    );

    if (charLoaded && charImages[charIndex]) {
        ctx.save();
        ctx.translate(charX, charY);
        ctx.scale(facing, 1);
        ctx.drawImage(charImages[charIndex], -75, 0, 150, 150);
        ctx.restore();
    }

    // SCORE at bottom-left
    ctx.fillStyle = "white";
    ctx.font = "24px 'Press Start 2P'";
    ctx.textAlign = "left";
    ctx.fillText("SCORE: " + score, 20, canvas.height - 30);
}

// ======= RESTART (NO NEW LOOP) =======
function restart() {
    goodies = [];
    baddies = [];
    score = 0;
    gameOver = false;
    gameWon = false;
    frameCount = 0;
    winTimer = 0;
    gameOverTimer = 0;
    leftPressed = false;
    rightPressed = false;
    facing = 1;

    // stop sounds
    if (winSound) {
        winSound.pause();
        winSound.currentTime = 0;
    }
    if (gameOverSound) {
        gameOverSound.pause();
        gameOverSound.currentTime = 0;
    }

    initRocks();
}

// ======= LOAD CHARACTER IMAGES =======
function loadCharacter() {
    let loaded = 0;
    charFrames.forEach((src, i) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            loaded++;
            if (loaded === charFrames.length) charLoaded = true;
        };
        charImages[i] = img;
    });
}
loadCharacter();

// ======= START GAME =======
loop();
