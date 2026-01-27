// ======= CANVAS SETUP =======
const gameBox = document.getElementById("gameBox");
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
gameBox.appendChild(canvas);



// ======= FONT CONFIGURATION =======
// To change fonts, replace the font names in quotes below:
const TITLE_FONT = "'Rosalia', serif";  // Titles will use Rosalia first
const BODY_FONT = "'Poppins', sans-serif";        // Change this to your DaFont font name
const GAME_FONT = "'Press Start 2P'";             // Change this to your DaFont font name
 
// ======= HELPERS =======
function isMobile() {
    return window.innerWidth <= 768 || 'ontouchstart' in window;
}

function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

// ======= DOWNLOAD ZIP (ADDED) =======
function downloadPromoZip() {
    // Put your zip file inside your website folder at:
    // downloads/Trousse_Promotionnelle.zip
    const url = "downloads/Trousse_Promotionnelle.zip";

    const a = document.createElement("a");
    a.href = url;
    a.download = "Trousse_Promotionnelle.zip";
    document.body.appendChild(a);
    a.click();
    a.remove();
}

// ======= BACKGROUND =======
const backgroundImage = new Image();
backgroundImage.src = "img/new background.png";
let bgLoaded = false;
backgroundImage.onload = () => (bgLoaded = true);

// ======= WIN / LOSE GRAPHICS =======
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

// ======= CHARACTER SETTINGS =======
let charX = canvas.width / 2;
let charY = 0;
let charVy = 0;
let charVx = 0;
const gravity = 0.8;
const jumpForce = -26;
let moveSpeed = 6;
let isJumping = false;

let CAT_HEIGHT = 150;
const CAT_SIT_OFFSET = 20;

let leftPressed = false;
let rightPressed = false;
let facing = 1;

// ======= ROCKS =======
const rockImgs = [new Image(), new Image()];
rockImgs[0].src = "img/rocks-01 1.png";
rockImgs[1].src = "img/rocks-02 1.png";

let rockLoadedCount = 0;
let rockLoaded = false;
let rockSizes = [];
let rockVerticalOffset = 60;
let rockStack = [];

// ======= OBJECT IMAGES =======
const goodyImg = new Image();
goodyImg.src = "img/orbs 1.png";

const baddieImg = new Image();
baddieImg.src = "img/bats 1.png";

let blocks = [];
let goodies = [];
let baddies = [];

let baddieWidth = 80;
let baddieHeight = 80;
let baddieAspect = 1;

function updateBaddieSize() {
    baddieHeight = isMobile() ? 50 : 80;
    baddieWidth = baddieHeight * baddieAspect;
}

baddieImg.onload = () => {
    baddieAspect = baddieImg.width / baddieImg.height || 1;
    updateBaddieSize();
};

// ======= GAME VARIABLES =======
let score = 0;
let health = 3;
const maxHealth = 3;
let frameCount = 0;

// ======= GAME STATE =======
let gameState = "menu";
let winRockY = canvas.height * 0.3;
let winTimer = 0;
let gameOverTimer = 0;
let gameReady = false;

// ======= SOUNDS =======
const winSound = new Audio("audio/Gun sound.wav");
const gameOverSound = new Audio("audio/game-over.mp3");

// ======= RESIZE CANVAS =======
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    winRockY = canvas.height * 0.3;

    moveSpeed = isMobile() ? 8 : 6;
    CAT_HEIGHT = isMobile() ? 120 : 150;
    rockVerticalOffset = isMobile() ? 50 : 60;

    blocks = [];
    goodies = [];
    baddies = [];
    updateBaddieSize();

    if (rockLoaded && rockSizes[0] && gameState === "playing") {
        initRocks();
    }
}
window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", () => {
    setTimeout(resizeCanvas, 100);
});

// ======= INITIALIZE ROCKS =======
function initRocks() {
    gameReady = false;
    rockStack = [];
    if (!rockLoaded || !rockSizes[0]) return;

    const bottomImgIndex = 0;
    const bottomSize = rockSizes[bottomImgIndex];
    const scaleFactor = isMobile() ? 0.7 : 1;
    const scaledWidth = bottomSize.width * scaleFactor;
    const scaledHeight = bottomSize.height * scaleFactor;
    
    const bottomY = canvas.height - scaledHeight;
    const bottomX = canvas.width / 2 - scaledWidth / 2;

    rockStack.push({
        imgIndex: bottomImgIndex,
        x: bottomX,
        y: bottomY,
        width: scaledWidth,
        height: scaledHeight
    });

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
            if (gameState === "playing") {
                initRocks();
            }
        }
    };
});

// ======= CHARACTER POSITION =======
function resetCharPosition() {
    const topRock = rockStack[rockStack.length - 1];
    if (!topRock) {
        charY = canvas.height - (CAT_HEIGHT - CAT_SIT_OFFSET);
    } else {
        charY = topRock.y - (CAT_HEIGHT - CAT_SIT_OFFSET);
    }
    charVy = 0;
    isJumping = false;
    charAnimating = false;
    charIndex = 0;
    charTimer = 0;
    facing = 1;
}

function getPlayableY(objHeight = 0) {
    const topBand = canvas.height * 0.1;   // start higher
    const bandHeight = canvas.height * 0.8 - objHeight; // extend lower
    return topBand + Math.random() * Math.max(bandHeight, 0);
}

function getGoodySize() {
    return isMobile() ? 50 : 80;
}

function getBlockSpeed() {
    return isMobile()
        ? 1.2 + Math.random() * 0.5
        : 1.5 + Math.random() * 0.8;
}

function getGoodySpeed() {
    return isMobile()
        ? 0.8 + Math.random() * 0.5
        : 1.0 + Math.random() * 0.6;
}

function getBaddieSpeed() {
    return isMobile()
        ? 0.7 + Math.random() * 0.6
        : 1.0 + Math.random() * 0.7;
}

function spawnBlock() {
    if (!rockLoaded || rockStack.length === 0) return;
    
    const nextRockIndex = rockStack.length % rockImgs.length;
    let size = rockSizes[nextRockIndex];
    if (!size) size = rockSizes[0];
    if (!size) return;

    const scaleFactor = isMobile() ? 0.7 : 1;
    const scaledWidth = size.width * scaleFactor;
    const scaledHeight = size.height * scaleFactor;

    const fromLeft = Math.random() < 0.5;
    const speed = getBlockSpeed();

    blocks.push({
        x: fromLeft ? -scaledWidth : canvas.width,
        y: getPlayableY(scaledHeight),
        width: scaledWidth,
        height: scaledHeight,
        imgIndex: nextRockIndex,
        vx: fromLeft ? speed : -speed
    });
}

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

// ======= MAIN LOOP =======
function loop() {
    if (!gameReady && gameState !== "menu" && gameState !== "instructions") {
        drawLoading();
        requestAnimationFrame(loop);
        return;
    }

    if (gameState === "menu") {
        drawMenu();
        requestAnimationFrame(loop);
        return;
    }

    if (gameState === "instructions") {
        drawInstructions();
        requestAnimationFrame(loop);
        return;
    }

    if (gameState === "lost") {
        drawGameOver();
        requestAnimationFrame(loop);
        return;
    }

    if (gameState === "won") {
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
    const fontSize = isMobile() ? 16 : 20;
    ctx.font = fontSize + "px 'Press Start 2P'";
    ctx.textAlign = "center";
    ctx.fillText("Chargement...", canvas.width / 2, canvas.height / 2);
}

// ======= UPDATE =======
function update() {
    frameCount++;

const spawnRate = isMobile() ? 1.3 : 1;

// Increase the numbers to reduce spawn frequency
if (frameCount % Math.floor(240 * spawnRate) === 0) spawnBlock();   // was 120
if (frameCount % Math.floor(600 * spawnRate) === 0) spawnGoody();   // was 200
if (frameCount % Math.floor(250 * spawnRate) === 0) spawnBaddie(); // spawn less often


    charVx = 0;
    if (leftPressed) charVx -= moveSpeed;
    if (rightPressed) charVx += moveSpeed;
    charX += charVx;

    const halfCat = isMobile() ? 60 : 75;
    if (charX < halfCat) charX = halfCat;
    if (charX > canvas.width - halfCat) charX = canvas.width - halfCat;

    charVy += gravity;
    charY += charVy;

    const topRock = rockStack[rockStack.length - 1];
    const groundLevel = topRock
        ? topRock.y - (CAT_HEIGHT - CAT_SIT_OFFSET)
        : canvas.height - (CAT_HEIGHT - CAT_SIT_OFFSET);

    if (charY > groundLevel) {
        charY = groundLevel;
        charVy = 0;
        isJumping = false;
    }

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

    blocks.forEach(b => b.x += b.vx);
    goodies.forEach(g => g.x += g.vx);
    baddies.forEach(b => b.x += b.vx);

    blocks = blocks.filter(
        b => b.x > -b.width - 100 && b.x < canvas.width + 100
    );
    goodies = goodies.filter(
        g => g.x > -g.size - 100 && g.x < canvas.width + 100
    );
    baddies = baddies.filter(
        b => b.x > -b.width - 100 && b.x < canvas.width + 100
    );

    checkCollisions();
}

// ======= COLLISIONS =======
function checkCollisions() {
    const catWidth = isMobile() ? 120 : 150;
    const catHalfWidth = catWidth / 2;
    const catLeft = charX - catHalfWidth;
    const catRight = charX + catHalfWidth;
    const catTop = charY;
    const catBottom = charY + CAT_HEIGHT;

    for (let i = blocks.length - 1; i >= 0; i--) {
        const block = blocks[i];
        
        const blockLeft = block.x;
        const blockRight = block.x + block.width;
        const blockTop = block.y;

        if (charVy > 0 && isJumping) {
            const willLandOn = 
                catBottom >= blockTop &&
                catBottom <= blockTop + 30 &&
                catRight > blockLeft + 20 &&
                catLeft < blockRight - 20;

            if (willLandOn) {
                const prevRock = rockStack[rockStack.length - 1];
                const newY = prevRock.y - rockVerticalOffset;
                const newX = canvas.width / 2 - block.width / 2;

                rockStack.push({
                    imgIndex: block.imgIndex,
                    x: newX,
                    y: newY,
                    width: block.width,
                    height: block.height
                });

                charY = newY - (CAT_HEIGHT - CAT_SIT_OFFSET);
                charVy = 0;
                isJumping = false;

                score++;
                blocks.splice(i, 1);

                const topRockNow = rockStack[rockStack.length - 1];
                if (topRockNow && topRockNow.y <= winRockY) {
                    startWin();
                    return;
                }
            }
        }
    }

    for (let i = goodies.length - 1; i >= 0; i--) {
        const g = goodies[i];

        const collides =
            g.x < catRight &&
            g.x + g.size > catLeft &&
            g.y < catBottom &&
            g.y + g.size > catTop;

        if (collides) {
            health = Math.min(health + 1, maxHealth);
            goodies.splice(i, 1);
        }
    }

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
            health--;
            baddies.splice(i, 1);

            if (health <= 0) {
                gameState = "lost";
                gameOverTimer = 0;

                if (gameOverSound) {
                    gameOverSound.pause();
                    gameOverSound.currentTime = 0;
                    gameOverSound.play().catch(() => {});
                }
                return;
            }
        }
    }
}

// ======= WIN LOGIC =======
function startWin() {
    gameState = "won";
    winTimer = 0;

    if (winSound) {
        winSound.currentTime = 0;
        winSound.play().catch(() => {});
    }
}

function updateWin() {
    winTimer++;
}

// ======= MENU SCREEN =======
function drawMenu() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (bgLoaded) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = "#050522";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const centerX = canvas.width / 2;
    const titleY = isMobile() ? canvas.height * 0.20 : canvas.height * 0.25;
    const btnY = isMobile() ? canvas.height * 0.50 : canvas.height * 0.55;

    const titleSize = clamp(canvas.height * (isMobile() ? 0.06 : 0.09), 28, 100);
    ctx.fillStyle = "#E2E4FF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = titleSize + "px 'Rosalia', serif";
    ctx.fillText("Au Cœur des Abysses", centerX, titleY);

    const subtitleSize = clamp(canvas.height * (isMobile() ? 0.025 : 0.03), 12, 26);
    ctx.fillStyle = "#D2D4F7";
    ctx.font = subtitleSize + "px 'Poppins', sans-serif";
    ctx.fillText("Atteindre la surface!", centerX, titleY + titleSize * 0.8);

    const btnWidth = canvas.width * (isMobile() ? 0.50 : 0.30);
    const btnHeight = canvas.height * (isMobile() ? 0.08 : 0.10);
    const btnX = centerX - btnWidth / 2;
    const btnCenterY = btnY + btnHeight / 2;

    ctx.fillStyle = "#D5D6FB";
    drawRoundedRect(btnX, btnY, btnWidth, btnHeight, btnHeight / 2);
    ctx.fill();

    const btnFontSize = clamp(canvas.height * (isMobile() ? 0.028 : 0.032), 16, 28);
    ctx.fillStyle = "#1A1636";
    ctx.font = btnFontSize + "px 'Playfair Display', serif";
    ctx.fillText("Jouer", centerX, btnCenterY);

    const instBtnY = btnY + btnHeight + (isMobile() ? 20 : 30);
    const instBtnCenterY = instBtnY + btnHeight / 2;

    ctx.fillStyle = "rgba(213, 214, 251, 0.6)";
    drawRoundedRect(btnX, instBtnY, btnWidth, btnHeight, btnHeight / 2);
    ctx.fill();

    ctx.fillStyle = "#1A1636";
    ctx.fillText("Instructions", centerX, instBtnCenterY);

    // ======= DOWNLOAD BUTTON (ADDED) =======
    const dlBtnY = instBtnY + btnHeight + (isMobile() ? 20 : 30);
    const dlBtnCenterY = dlBtnY + btnHeight / 2;

    ctx.fillStyle = "rgba(213, 214, 251, 0.85)";
    drawRoundedRect(btnX, dlBtnY, btnWidth, btnHeight, btnHeight / 2);
    ctx.fill();

    ctx.fillStyle = "#1A1636";
    ctx.fillText("Télécharger", centerX, dlBtnCenterY);
}



// ======= INSTRUCTIONS SCREEN =======
function drawInstructions() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#050522";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const startY = canvas.height * (isMobile() ? 0.12 : 0.15);
    const lineHeight = canvas.height * (isMobile() ? 0.06 : 0.08);

    const titleSize = clamp(canvas.height * (isMobile() ? 0.045 : 0.06), 20, 60);
    ctx.fillStyle = "#E2E4FF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = titleSize + "px 'Playfair Display', serif";
    ctx.fillText("Comment Jouer", centerX, startY);

    const textSize = clamp(canvas.height * (isMobile() ? 0.018 : 0.022), 10, 20);
    ctx.fillStyle = "#D2D4F7";
    ctx.font = textSize + "px 'Poppins', sans-serif";
    
    const instructions = [
        "Saute sur les blocs qui arrivent",
        "des côtés pour construire ta tour",
        "",
        "Évite les chauves-souris!",
        "Elles te font perdre de la santé",
        "",
        "Collecte les orbes pour te soigner",
        "Pour esquiver, vous devez appuyer sur D",
        isMobile() ? "Touche en haut: sauter" : "Flèche haut: sauter",
        isMobile() ? "Touche en bas: bouger" : "Flèches gauche/droite: bouger"
    ];

    instructions.forEach((line, i) => {
        ctx.fillText(line, centerX, startY + titleSize + (i + 1) * lineHeight * 0.5);
    });

    const btnY = canvas.height * (isMobile() ? 0.85 : 0.80);
    const btnWidth = canvas.width * (isMobile() ? 0.50 : 0.30);
    const btnHeight = canvas.height * (isMobile() ? 0.08 : 0.10);
    const btnX = centerX - btnWidth / 2;
    const btnCenterY = btnY + btnHeight / 2;

    ctx.fillStyle = "#D5D6FB";
    drawRoundedRect(btnX, btnY, btnWidth, btnHeight, btnHeight / 2);
    ctx.fill();

    const btnFontSize = clamp(canvas.height * (isMobile() ? 0.028 : 0.032), 16, 28);
    ctx.fillStyle = "#1A1636";
    ctx.font = btnFontSize + "px 'Playfair Display', serif";
    ctx.fillText("Retour", centerX, btnCenterY);
}

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

// ======= WIN SCREEN =======
function drawWin() {
    const centerX = canvas.width / 2;
    const titleY = canvas.height * (isMobile() ? 0.15 : 0.18);
    const artY = canvas.height * (isMobile() ? 0.35 : 0.40);
    const subtitleY = canvas.height * (isMobile() ? 0.58 : 0.62);
    const btnY = canvas.height * (isMobile() ? 0.68 : 0.72);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#050522";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const titleSize = clamp(canvas.height * (isMobile() ? 0.055 : 0.07), 24, 80);
    ctx.fillStyle = "#E2E4FF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = titleSize + "px 'Playfair Display', serif";
    ctx.fillText("Gagnant!", centerX, titleY);

    const bob = Math.sin(winTimer / 25) * 8;
    const rot = Math.sin(winTimer / 60) * 0.06;

    ctx.save();
    ctx.translate(centerX, artY + bob);
    ctx.rotate(rot);

    if (winCatLoaded) {
        const desiredWidth = canvas.width * (isMobile() ? 0.60 : 0.35);
        const scale = desiredWidth / winCatImage.width;
        const imgW = winCatImage.width * scale;
        const imgH = winCatImage.height * scale;
        ctx.drawImage(winCatImage, -imgW / 2, -imgH / 2, imgW, imgH);
    } else {
        ctx.fillStyle = "#FF6688";
        ctx.beginPath();
        ctx.arc(0, 0, 80, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();

    const subtitleSize = clamp(canvas.height * (isMobile() ? 0.022 : 0.027), 10, 22);
    ctx.fillStyle = "#D2D4F7";
    ctx.font = subtitleSize + "px 'Poppins', sans-serif";
    ctx.fillText("Tu as atteint la surface!", centerX, subtitleY);

    const btnWidth = canvas.width * (isMobile() ? 0.45 : 0.25);
    const btnHeight = canvas.height * (isMobile() ? 0.08 : 0.10);
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

    const btnFontSize = clamp(canvas.height * (isMobile() ? 0.024 : 0.028), 12, 24);
    ctx.fillStyle = "#1A1636";
    ctx.font = btnFontSize + "px 'Playfair Display', serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Rejouer", centerX, btnCenterY);

    ctx.restore();
}

// ======= INPUT =======
function handleJump() {
    if (gameState !== "playing") return;

    if (!isJumping) {
        isJumping = true;
        charVy = jumpForce;
        charAnimating = true;
        charIndex = 0;
        charTimer = 0;
    }
}

window.addEventListener("keydown", e => {
    if (gameState !== "playing") return;

    if (e.key === "ArrowUp") {
        handleJump();
    } else if (e.key === "ArrowLeft") {
        leftPressed = true;
        facing = 1;
    } else if (e.key === "ArrowRight") {
        rightPressed = true;
        facing = -1;
    }
    else if (e.key === "d" || e.key === "D") { // D key for dodge
    handleDodge();
}

});

window.addEventListener("keyup", e => {
    if (e.key === "ArrowLeft") {
        leftPressed = false;
    } else if (e.key === "ArrowRight") {
        rightPressed = false;
    }
});

window.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (gameState === "menu") {
        handleMenuClick(x, y);
    } else if (gameState === "instructions") {
        handleInstructionsClick(x, y);
    } else if (gameState === "lost" || gameState === "won") {
        restart();
    } else if (gameState === "playing" && !isMobile()) {
        handleJump();
    }
});
function handleDodge() {
    if (gameState !== "playing") return;
    if (!isJumping) {
        isJumping = true;
        charVy = jumpForce * 1.2; // make it slightly higher than normal jump
        charAnimating = true;
        charIndex = 0;
        charTimer = 0;
    }
}

function handleMenuClick(x, y) {
    const centerX = canvas.width / 2;
    const btnY = isMobile() ? canvas.height * 0.50 : canvas.height * 0.55;
    const btnWidth = canvas.width * (isMobile() ? 0.50 : 0.30);
    const btnHeight = canvas.height * (isMobile() ? 0.08 : 0.10);
    const btnX = centerX - btnWidth / 2;

    if (x >= btnX && x <= btnX + btnWidth && y >= btnY && y <= btnY + btnHeight) {
        gameState = "playing";
        initRocks();
    }

    const instBtnY = btnY + btnHeight + (isMobile() ? 20 : 30);
    if (x >= btnX && x <= btnX + btnWidth && y >= instBtnY && y <= instBtnY + btnHeight) {
        gameState = "instructions";
    }

    // ======= DOWNLOAD BUTTON CLICK (ADDED) =======
    const dlBtnY = instBtnY + btnHeight + (isMobile() ? 20 : 30);
    if (x >= btnX && x <= btnX + btnWidth && y >= dlBtnY && y <= dlBtnY + btnHeight) {
        downloadPromoZip();
    }
}

function handleInstructionsClick(x, y) {
    const centerX = canvas.width / 2;
    const btnY = canvas.height * (isMobile() ? 0.85 : 0.80);
    const btnWidth = canvas.width * (isMobile() ? 0.50 : 0.30);
    const btnHeight = canvas.height * (isMobile() ? 0.08 : 0.10);
    const btnX = centerX - btnWidth / 2;

    if (x >= btnX && x <= btnX + btnWidth && y >= btnY && y <= btnY + btnHeight) {
        gameState = "menu";
    }
}

// ======= TOUCH CONTROLS =======
let touchStartY = 0;

function handleTouchStart(e) {
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    e.preventDefault();

    touchStartY = y;

    if (gameState === "menu") {
        handleMenuClick(x, y);
        return;
    }

    if (gameState === "instructions") {
        handleInstructionsClick(x, y);
        return;
    }

    if (gameState === "lost" || gameState === "won") {
        restart();
        return;
    }

    if (gameState === "playing") {
        const w = canvas.width;
        const h = canvas.height;

        if (y < h * 0.5) {
            handleJump();
            leftPressed = false;
            rightPressed = false;
        } else {
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
}

function handleTouchMove(e) {
    if (e.touches.length === 0 || gameState !== "playing") return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    e.preventDefault();

    if (y >= canvas.height * 0.5) {
        if (x < canvas.width * 0.5) {
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
canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
canvas.addEventListener("touchend", handleTouchEnd, { passive: false });
canvas.addEventListener("touchcancel", handleTouchEnd, { passive: false });

// ======= DRAW =======
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (bgLoaded) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    }

    if (rockLoaded && rockStack.length) {
        rockStack.forEach(rock => {
            const img = rockImgs[rock.imgIndex];
            ctx.drawImage(img, rock.x, rock.y, rock.width, rock.height);
        });
    }

    if (rockLoaded) {
        blocks.forEach(block => {
            const img = rockImgs[block.imgIndex];
            ctx.drawImage(img, block.x, block.y, block.width, block.height);
        });
    }

    goodies.forEach(g => ctx.drawImage(goodyImg, g.x, g.y, g.size, g.size));

    baddies.forEach(b =>
        ctx.drawImage(baddieImg, b.x, b.y, b.width, b.height)
    );

    if (charLoaded && charImages[charIndex]) {
        const charDrawWidth = isMobile() ? 120 : 150;
        const charDrawHeight = isMobile() ? 120 : 150;
        ctx.save();
        ctx.translate(charX, charY);
        ctx.scale(facing, 1);
        ctx.drawImage(charImages[charIndex], -charDrawWidth/2, 0, charDrawWidth, charDrawHeight);
        ctx.restore();
    }

    const fontSize = isMobile() ? 16 : 24;
    ctx.fillStyle = "white";
    ctx.font = fontSize + "px 'Press Start 2P'";
    ctx.textAlign = "left";
    ctx.fillText("SCORE: " + score, isMobile() ? 10 : 20, canvas.height - (isMobile() ? 15 : 30));

    ctx.fillStyle = "white";
    ctx.font = fontSize + "px 'Press Start 2P'";
    ctx.textAlign = "left";
    let healthText = "❤️".repeat(health);
    if (health < maxHealth) {
        healthText += "🖤".repeat(maxHealth - health);
    }
    ctx.fillText(healthText, isMobile() ? 10 : 20, isMobile() ? 30 : 40);
}

// ======= RESTART =======
function restart() {
    blocks = [];
    goodies = [];
    baddies = [];
    score = 0;
    health = maxHealth;
    gameState = "playing";
    frameCount = 0;
    winTimer = 0;
    gameOverTimer = 0;
    leftPressed = false;
    rightPressed = false;
    facing = 1;

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

// ======= LOAD CHARACTER =======
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

// Prevent double-tap zoom on mobile
document.addEventListener('touchstart', function(e) {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

let lastTouchEnd = 0;
document.addEventListener('touchend', function(e) {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, { passive: false });

// Prevent pinch zoom
document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
});

// Assuming resizeCanvas, gameReady, loop are defined
resizeCanvas();
gameReady = true;
loop(); // removed invalid Text() call

// ======= GAME OVER SCREEN =======
function drawGameOver() {
    gameOverTimer++;

    const centerX = canvas.width / 2;
    const titleY = canvas.height * (isMobile() ? 0.15 : 0.18);
    const artY = canvas.height * (isMobile() ? 0.35 : 0.40);
    const subtitleY = canvas.height * (isMobile() ? 0.58 : 0.62);
    const btnY = canvas.height * (isMobile() ? 0.68 : 0.72);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#050522";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const titleSize = clamp(canvas.height * (isMobile() ? 0.055 : 0.07), 24, 80);
    ctx.fillStyle = "#E2E4FF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = titleSize + "px 'Playfair Display', serif";
    ctx.fillText("Perdant...", centerX, titleY);

    const shakeX = Math.sin(gameOverTimer / 12) * 6;
    const shakeRot = Math.sin(gameOverTimer / 18) * 0.05;

    ctx.save();
    ctx.translate(centerX + shakeX, artY);
    ctx.rotate(shakeRot);

    if (loseRockLoaded) {
        const desiredWidth = canvas.width * (isMobile() ? 0.55 : 0.30);
        const scale = desiredWidth / loseRockImage.width;
        const imgW = loseRockImage.width * scale;
        const imgH = loseRockImage.height * scale;
        ctx.drawImage(loseRockImage, -imgW / 2, -imgH / 2, imgW, imgH);
    } else {
        ctx.fillStyle = "#555A8E";
        ctx.fillRect(-80, -40, 160, 80);
    }
    ctx.restore();

    const subtitleSize = clamp(canvas.height * (isMobile() ? 0.022 : 0.027), 10, 22);
    ctx.fillStyle = "#D2D4F7";
    ctx.font = subtitleSize + "px 'Poppins', sans-serif";
    ctx.fillText("La tour s'est effondrée...", centerX, subtitleY);

    const btnWidth = canvas.width * (isMobile() ? 0.45 : 0.25);
    const btnHeight = canvas.height * (isMobile() ? 0.08 : 0.10);
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

    const btnFontSize = clamp(canvas.height * (isMobile() ? 0.024 : 0.028), 12, 24);
    ctx.fillStyle = "#1A1636";
    ctx.font = btnFontSize + "px 'Playfair Display', serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Rejouer", centerX, btnCenterY); // fixed
    ctx.restore();
}
