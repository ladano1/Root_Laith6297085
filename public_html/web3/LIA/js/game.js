// ======= CANVAS SETUP =======
const gameBox = document.getElementById("gameBox");
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
gameBox.appendChild(canvas);

// ======= HELPERS (for responsiveness) =======
function isMobile() {
    return window.innerWidth <= 768;
}

function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

// ======= BACKGROUND =======
const backgroundImage = new Image();
backgroundImage.src = "img/new background.png";
let bgLoaded = false;
backgroundImage.onload = () => (bgLoaded = true);

// ======= WIN / LOSE GRAPHICS (NEW) =======
const winCatImage = new Image();
winCatImage.src = "img/win-cat.png";
let winCatLoaded = false;
winCatImage.onload = () => (winCatLoaded = true);

const loseRockImage = new Image();
loseRockImage.src = "img/lose-rock.png";
let loseRockLoaded = false;
loseRockImage.onload = () => (loseRockLoaded = true);

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

// ======= OBJECT IMAGES =======
const goodyImg = new Image();
goodyImg.src = "img/orbs 1.png";

const baddieImg = new Image();
baddieImg.src = "img/bats 1.png";

let goodies = [];
let baddies = [];

// ---- BADDIE CORRECT SIZE (KEEPS REAL ASPECT RATIO) + RESPONSIVE ----
let baddieWidth = 80;
let baddieHeight = 80;
let baddieAspect = 1;

function updateBaddieSize() {
    // smaller on mobile
    baddieHeight = isMobile() ? 60 : 80;
    baddieWidth = baddieHeight * baddieAspect;
}

baddieImg.onload = () => {
    baddieAspect = baddieImg.width / baddieImg.height || 1;
    updateBaddieSize();
};

// ======= GAME VARIABLES =======
let score = 0;
let gameOver = false;
let frameCount = 0;

// ======= WIN / GAME OVER STATE =======
let gameWon = false;
// Winning is based on how HIGH the rock stack is:
let winRockY = canvas.height * 0.3; // updated on resize
let winTimer = 0;
let gameOverTimer = 0;

// ======= READY FLAG =======
let gameReady = false;  // becomes true after rocks are initialized

// ======= SOUNDS =======
const winSound = new Audio("audio/Gun sound.wav");
const gameOverSound = new Audio("audio/game-over.mp3");

// ======= RESPONSIVE: RESIZE CANVAS =======
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    winRockY = canvas.height * 0.3;

    // reset moving objects so nothing is stuck offscreen
    goodies = [];
    baddies = [];

    // update baddie size for this screen
    updateBaddieSize();

    // re-init rocks & reposition cat if rocks already loaded
    if (rockLoaded && rockSizes[0]) {
        initRocks();
    }
}
window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", resizeCanvas);

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

// ======= SIDEWAYS SPAWN HELPERS =======
// random Y band where objects travel (middle of screen)
function getPlayableY(objHeight = 0) {
    const topBand = canvas.height * 0.25;
    const bandHeight = canvas.height * 0.5 - objHeight;
    return topBand + Math.random() * Math.max(bandHeight, 0);
}

// responsive goody size
function getGoodySize() {
    // smaller on mobile
    return isMobile() ? 60 : 80;
}

// ======= SLOWER SPEEDS (both mobile & desktop) =======
function getGoodySpeed() {
    return isMobile()
        ? 0.4 + Math.random() * 0.5   // 0.4 – 0.9 (much slower)
        : 0.8 + Math.random() * 0.6;  // 0.8 – 1.4
}

function getBaddieSpeed() {
    return isMobile()
        ? 0.5 + Math.random() * 0.6   // 0.5 – 1.1
        : 1.0 + Math.random() * 0.7;  // 1.0 – 1.7
}

// goodies come from left or right edges, move horizontally
function spawnGoody() {
    const size = getGoodySize();
    const fromLeft = Math.random() < 0.5;
    const speed = getGoodySpeed();

    goodies.push({
        x: fromLeft ? -size : canvas.width,
        y: getPlayableY(size),
        size: size,
        vx: fromLeft ? speed : -speed
    });
}

// baddies come from left or right edges, move horizontally
function spawnBaddie() {
    const fromLeft = Math.random() < 0.5;
    const speed = getBaddieSpeed();

    baddies.push({
        x: fromLeft ? -baddieWidth : canvas.width,
        y: getPlayableY(baddieHeight),
        width: baddieWidth,
        height: baddieHeight,
        vx: fromLeft ? speed : -speed
    });
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

    // Horizontal movement of cat
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

    // Move goodies & baddies SIDEWAYS
    goodies.forEach(g => g.x += g.vx);
    baddies.forEach(b => b.x += b.vx);

    // Remove when off screen horizontally
    goodies = goodies.filter(
        g => g.x > -g.size - 100 && g.x < canvas.width + 100
    );
    baddies = baddies.filter(
        b => b.x > -b.width - 100 && b.x < canvas.width + 100
    );

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

// === (old neon helpers kept just in case, but unused now) ===
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

        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 25;
        ctx.fillText(text, x + offset, y);

        ctx.shadowBlur = 0;
        ctx.fillStyle = "#e6ffe6";
        ctx.fillText(text, x + offset + 1, y);

        ctx.restore();
    }

    for (let i = 0; i < 30; i++) {
        const px = x + (Math.random() - 0.5) * baseSize * 1.5;
        const py = y + (Math.random() - 0.5) * baseSize;
        const s = 2 + Math.random() * 4;
        ctx.fillStyle = "rgba(0,255,120,0.8)";
        ctx.fillRect(px, py, s, s);
    }
}

// === HELPER: GLOWING NEON RING (unused now) ===
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

// === HELPER: ROUNDED RECTANGLE ===
function drawRoundedRect(x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// ======= WIN SCREEN (NEW STYLE, RESPONSIVE) =======
function drawWin() {
    const centerX = canvas.width / 2;
    const titleY = canvas.height * 0.18;
    const artY = canvas.height * 0.40;
    const subtitleY = canvas.height * 0.62;
    const btnY = canvas.height * 0.72;

    // background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#050522"; // deep night blue
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title "Gagnant!" (slightly smaller so it never touches edges)
    const titleSize = clamp(canvas.height * 0.07, 28, 80);
    ctx.fillStyle = "#E2E4FF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${titleSize}px 'Playfair Display', serif`;
    ctx.fillText("Gagnant!", centerX, titleY);

    // Cat graphic with gentle bob + rotation
    const bob = Math.sin(winTimer / 25) * 8;
    const rot = Math.sin(winTimer / 60) * 0.06;

    ctx.save();
    ctx.translate(centerX, artY + bob);
    ctx.rotate(rot);

    if (winCatLoaded) {
        // wider on mobile so it fills nicely
        const desiredWidth = canvas.width * (isMobile() ? 0.55 : 0.35);
        const scale = desiredWidth / winCatImage.width;
        const imgW = winCatImage.width * scale;
        const imgH = winCatImage.height * scale;
        ctx.drawImage(winCatImage, -imgW / 2, -imgH / 2, imgW, imgH);
    } else {
        // simple placeholder circle if image not loaded
        ctx.fillStyle = "#FF6688";
        ctx.beginPath();
        ctx.arc(0, 0, 80, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();

    // Subtitle "Tu as atteint la surface!" (a bit smaller)
    const subtitleSize = clamp(canvas.height * 0.027, 12, 22);
    ctx.fillStyle = "#D2D4F7";
    ctx.font = `${subtitleSize}px 'Poppins', sans-serif`;
    ctx.fillText("Tu as atteint la surface!", centerX, subtitleY);

    // Button "Rejouer" (taller + smaller font so text stays inside)
    const btnWidth = canvas.width * 0.25;
    const btnHeight = canvas.height * 0.10; // slightly taller
    const btnX = centerX - btnWidth / 2;

    const pulse = 1 + Math.sin(winTimer / 30) * 0.03;
    const btnCenterY = btnY + btnHeight / 2;

    ctx.save();
    ctx.translate(centerX, btnCenterY);
    ctx.scale(pulse, pulse);
    ctx.translate(-centerX, -btnCenterY);

    ctx.fillStyle = "#D5D6FB";
    drawRoundedRect(btnX, btnY, btnWidth, btnHeight, btnHeight / 2);
    ctx.fill();

    const btnFontSize = clamp(canvas.height * 0.028, 14, 24);
    ctx.fillStyle = "#1A1636";
    ctx.font = `${btnFontSize}px 'Playfair Display', serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Rejouer", centerX, btnCenterY);

    ctx.restore();
}

// ======= GAME OVER SCREEN (NEW STYLE, RESPONSIVE) =======
function drawGameOver() {
    gameOverTimer++;

    const centerX = canvas.width / 2;
    const titleY = canvas.height * 0.18;
    const artY = canvas.height * 0.40;
    const subtitleY = canvas.height * 0.62;
    const btnY = canvas.height * 0.72;

    // background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#050522";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title "Perdant..." (same treatment as win)
    const titleSize = clamp(canvas.height * 0.07, 28, 80);
    ctx.fillStyle = "#E2E4FF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${titleSize}px 'Playfair Display', serif`;
    ctx.fillText("Perdant...", centerX, titleY);

    // Rock graphic with small shake (responsive width)
    const shakeX = Math.sin(gameOverTimer / 12) * 6;
    const shakeRot = Math.sin(gameOverTimer / 18) * 0.05;

    ctx.save();
    ctx.translate(centerX + shakeX, artY);
    ctx.rotate(shakeRot);

    if (loseRockLoaded) {
        const desiredWidth = canvas.width * (isMobile() ? 0.5 : 0.30);
        const scale = desiredWidth / loseRockImage.width;
        const imgW = loseRockImage.width * scale;
        const imgH = loseRockImage.height * scale;
        ctx.drawImage(loseRockImage, -imgW / 2, -imgH / 2, imgW, imgH);
    } else {
        // placeholder rectangle
        ctx.fillStyle = "#555A8E";
        ctx.fillRect(-80, -40, 160, 80);
    }
    ctx.restore();

    // Subtitle "La tour s’est effondrée..." (smaller)
    const subtitleSize = clamp(canvas.height * 0.027, 12, 22);
    ctx.fillStyle = "#D2D4F7";
    ctx.font = `${subtitleSize}px 'Poppins', sans-serif`;
    ctx.fillText("La tour s'est effondrée...", centerX, subtitleY);

    // Button "Rejouer" (same fix as win)
    const btnWidth = canvas.width * 0.25;
    const btnHeight = canvas.height * 0.10;
    const btnX = centerX - btnWidth / 2;

    const pulse = 1 + Math.sin(gameOverTimer / 28) * 0.03;
    const btnCenterY = btnY + btnHeight / 2;

    ctx.save();
    ctx.translate(centerX, btnCenterY);
    ctx.scale(pulse, pulse);
    ctx.translate(-centerX, -btnCenterY);

    ctx.fillStyle = "#D5D6FB";
    drawRoundedRect(btnX, btnY, btnWidth, btnHeight, btnHeight / 2);
    ctx.fill();

    const btnFontSize = clamp(canvas.height * 0.028, 14, 24);
    ctx.fillStyle = "#1A1636";
    ctx.font = `${btnFontSize}px 'Playfair Display', serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Rejouer", centerX, btnCenterY);

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

// Keyboard controls (desktop)
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

// Mouse click: jump or restart (desktop)
window.addEventListener("click", () => {
    if (gameOver || gameWon) {
        restart();
    } else {
        handleJump();
    }
});

// ======= TOUCH CONTROLS (MOBILE) =======
function handleTouchStart(e) {
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;

    // prevent scrolling on mobile while playing
    e.preventDefault();

    if (gameOver || gameWon) {
        restart();
        return;
    }

    const w = canvas.width;
    const h = canvas.height;

    // Top half = jump
    if (y < h * 0.4) {
        handleJump();
        leftPressed = false;
        rightPressed = false;
    } else {
        // bottom half: left / right move
        if (x < w * 0.5) {
            leftPressed = true;
            rightPressed = false;
            facing = 1;
        } else {
            rightPressed = true;
            leftPressed = false;
            facing = -1;
        }
    }
}

function handleTouchEnd(e) {
    e.preventDefault();
    leftPressed = false;
    rightPressed = false;
}

canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
canvas.addEventListener("touchend", handleTouchEnd, { passive: false });
canvas.addEventListener("touchcancel", handleTouchEnd, { passive: false });

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

// ======= KICK THINGS OFF =======
resizeCanvas(); // set initial size + winRockY
loop();