// ======= CANVAS SETUP =======
const gameBox = document.getElementById("gameBox");
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
gameBox.appendChild(canvas);

// ======= GAME VARIABLES =======
let stack = [];
let speed = 6;
let direction = 1;
let currentLayer;
let gameOver = false;
let score = 0;

const blockHeight = 40;
const baseWidth = Math.min(canvas.width * 0.6, 400);
const colors = ["#FF008C", "#FF8C00", "#FFD300", "#00FF6A", "#00CFFF", "#9D00FF"];

let animationFrame;

// ======= INITIALIZE =======
function init() {
    // Base block
    const baseY = canvas.height - blockHeight;
    stack.push({
        x: canvas.width / 2 - baseWidth / 2,
        y: baseY,
        width: baseWidth,
        color: colors[0]
    });

    // First moving block
    addLayer();
    draw();
    window.addEventListener("keydown", handleInput);
    window.addEventListener("click", handleInput);
    loop();
}

// ======= ADD NEW MOVING LAYER =======
function addLayer() {
    const y = canvas.height - blockHeight * (stack.length + 1);
    const width = stack[stack.length - 1].width;
    const color = colors[stack.length % colors.length];

    currentLayer = {
        x: 0,
        y: y,
        width: width,
        color: color
    };
}

// ======= MAIN LOOP =======
function loop() {
    if (gameOver) {
        drawGameOver();
        return;
    }

    currentLayer.x += direction * speed;
    if (currentLayer.x + currentLayer.width > canvas.width || currentLayer.x < 0) {
        direction *= -1; // bounce
    }

    draw();
    animationFrame = requestAnimationFrame(loop);
}

// ======= INPUT HANDLER =======
function handleInput(e) {
    if (gameOver) {
        restart();
        return;
    }

    const prev = stack[stack.length - 1];
    const overlap = Math.min(
        currentLayer.x + currentLayer.width,
        prev.x + prev.width
    ) - Math.max(currentLayer.x, prev.x);

    if (overlap > 0) {
        // Trim the layer to overlap size
        const newX = Math.max(currentLayer.x, prev.x);
        currentLayer.width = overlap;
        currentLayer.x = newX;

        stack.push(currentLayer);
        score++;
        addLayer();
    } else {
        // Missed completely
        gameOver = true;
    }
}

// ======= DRAW EVERYTHING =======
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw existing stack
    stack.forEach(layer => {
        ctx.fillStyle = layer.color;
        ctx.fillRect(layer.x, layer.y, layer.width, blockHeight);
    });

    // Draw moving layer
    ctx.fillStyle = currentLayer.color;
    ctx.fillRect(currentLayer.x, currentLayer.y, currentLayer.width, blockHeight);

    // Draw score
    ctx.fillStyle = "white";
    ctx.font = "20px 'Press Start 2P'";
    ctx.fillText("SCORE: " + score, 20, 40);
}

// ======= GAME OVER =======
function drawGameOver() {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = "30px 'Press Start 2P'";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 40);
    ctx.font = "20px 'Press Start 2P'";
    ctx.fillText("Score: " + score, canvas.width / 2, canvas.height / 2);
    ctx.fillText("Press any key or click to restart", canvas.width / 2, canvas.height / 2 + 60);
}

// ======= RESTART =======
function restart() {
    cancelAnimationFrame(animationFrame);
    stack = [];
    speed = 6;
    direction = 1;
    gameOver = false;
    score = 0;
    init();
}

// ======= START =======
init();
