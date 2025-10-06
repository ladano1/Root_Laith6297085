// === Neon Title Glow ===
const titleEl = document.getElementById("main-title");
let glowLevel = 0;
let direction = 1;
setInterval(() => {
  glowLevel += direction;
  if (glowLevel > 20 || glowLevel < 0) direction *= -1;
  if (titleEl) {
    titleEl.style.textShadow = `0 0 ${glowLevel}px #00ffcc, 0 0 ${glowLevel * 1.5}px #00ffcc`;
  }
}, 80);

// === Audio Setup ===
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

const typeSound = new Audio("./Typewritter.wav");
typeSound.volume = 0.4;
typeSound.preload = "auto";

const clickSound = new Audio("./Digital touch.wav");
clickSound.volume = 0.5;
clickSound.preload = "auto";

let soundUnlocked = false;
let skipPressed = false;

async function unlockAudioContext() {
  if (audioCtx.state === 'suspended') {
    try {
      await audioCtx.resume();
      soundUnlocked = true;
      playTypeSoundOnce();
    } catch (e) {
      console.warn("Audio context resume failed:", e);
    }
  } else {
    soundUnlocked = true;
    playTypeSoundOnce();
  }
}

function playTypeSoundOnce() {
  try {
    typeSound.currentTime = 0;
    typeSound.play();
  } catch (e) {
    console.warn("Initial type sound play failed:", e);
  }
}

unlockAudioContext();
document.addEventListener("click", unlockAudioContext);
document.addEventListener("keydown", unlockAudioContext);
document.addEventListener("touchstart", unlockAudioContext);

// === Typewriter ===
async function typewriter(el, text, min = 20, max = 60) {
  el.textContent = "";
  for (let i = 0; i < text.length; i++) {
    if (skipPressed) break;
    el.textContent += text[i];
    if (soundUnlocked && !skipPressed) {
      try {
        typeSound.currentTime = 0;
        typeSound.play();
      } catch (e) {
        console.warn("Type sound play failed:", e);
      }
    }
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise((r) => setTimeout(r, delay));
  }
}

// === Intro Sequence ===
document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const intro = document.getElementById("intro");
  const scrambleOut = document.getElementById("scramble");
  const twOut = document.getElementById("tw");
  const skipBtn = document.getElementById("skip-intro");

  const targetTitle = (document.getElementById("main-title")?.textContent || "Welcome").trim();
  const targetSub = (document.getElementById("sub-title")?.textContent || "").trim();

  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*-+=<>";

  class Scrambler {
    constructor(el) {
      this.el = el;
      this.frame = 0;
      this.queue = [];
      this.isRunning = false;
      this.resolve = null;
    }
    setText(newText) {
      const old = this.el.textContent;
      const length = Math.max(old.length, newText.length);
      this.queue = [];
      for (let i = 0; i < length; i++) {
        const from = old[i] || "";
        const to = newText[i] || "";
        const start = Math.floor(Math.random() * 20);
        const end = start + Math.floor(Math.random() * 20) + 5;
        this.queue.push({ from, to, start, end, char: "" });
      }
      if (!this.isRunning) {
        this.isRunning = true;
        this.frame = 0;
        this.update();
      }
      return new Promise((resolve) => {
        this.resolve = resolve;
      });
    }
    update() {
      let output = "";
      let complete = 0;
      for (const q of this.queue) {
        if (this.frame < q.start) {
          output += q.from || "";
        } else if (this.frame >= q.end) {
          output += q.to;
          complete++;
        } else {
          if (this.frame % 3 === 0 || !q.char) {
            q.char = CHARS[Math.floor(Math.random() * CHARS.length)];
          }
          output += q.char;
        }
      }
      this.el.textContent = output;
      this.frame++;
      if (complete === this.queue.length) {
        this.isRunning = false;
        if (this.resolve) this.resolve();
      } else {
        requestAnimationFrame(this.update.bind(this));
      }
    }
  }

  async function finishIntro() {
    intro.classList.add("hidden");
    body.classList.remove("intro-active");

    const heroTitle = document.getElementById("main-title");
    const heroTitleTW = document.getElementById("main-title-tw");
    const heroSub = document.getElementById("sub-title");
    const heroSubTW = document.getElementById("sub-title-tw");

    const targetTitle = heroTitle.textContent.trim();
    const targetSub = heroSub.textContent.trim();

    heroTitle.classList.add("hidden");
    heroSub.classList.add("hidden");
    heroTitleTW.classList.remove("hidden");
    heroSubTW.classList.remove("hidden");

    await new Promise((r) => setTimeout(r, 400));
    await typewriter(heroTitleTW, targetTitle, 25, 55);
    await typewriter(heroSubTW, targetSub, 18, 40);
  }

  skipBtn?.addEventListener("click", () => {
    skipPressed = true;
    typeSound.pause();
    typeSound.currentTime = 0;
    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});
    finishIntro();
  });

  const scrambler = new Scrambler(scrambleOut);
  (async () => {
    await scrambler.setText(targetTitle.toUpperCase());
    await new Promise((r) => setTimeout(r, 250));
    await typewriter(twOut, targetSub);
    await new Promise((r) => setTimeout(r, 400));
    finishIntro();
  })();

  // === Light/Dark Mode Setup (after DOM ready) ===
  const modeToggle = document.getElementById("mode-toggle");
  const savedMode = localStorage.getItem("color-mode");
  if (savedMode === "light") {
    document.body.classList.add("light-mode");
    modeToggle.textContent = "☀️";
  } else {
    modeToggle.textContent = "🌙";
  }

  modeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");
    const isLight = document.body.classList.contains("light-mode");
    localStorage.setItem("color-mode", isLight ? "light" : "dark");
    modeToggle.textContent = isLight ? "☀️" : "🌙";
  });
});

// === Canvas Effects ===
const canvas = document.getElementById('circuitCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const binary = '01';
const fontSize = 16;
const columns = Math.floor(window.innerWidth / fontSize);
const drops = Array(columns).fill(1);
let t = 0;

function drawVerticalCircuitLines(isLightMode) {
  ctx.lineWidth = 1;
  ctx.strokeStyle = isLightMode ? '#009146ff' : '#23be9fff';
  ctx.shadowColor = isLightMode ? '#00a537ff' : '#016723ff';
  ctx.shadowBlur = 8;

  const spacing = 120;
  for (let x = 0; x < canvas.width; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();

    const y1 = Math.random() * canvas.height;
    const y2 = y1 + 30;
    ctx.beginPath();
    ctx.moveTo(x, y1);
    ctx.lineTo(x + spacing, y2);
    ctx.stroke();
  }

  ctx.shadowBlur = 0;
}

function drawWaveLines(isLightMode) {
  const waveColor = isLightMode ? "rgba(0, 133, 71, 0.5)" : "#00ffcc33";
  const waveAmplitude = 30;
  const waveFrequency = 0.02;

  ctx.beginPath();
  ctx.lineWidth = 1;
  ctx.strokeStyle = waveColor;

  for (let y = 0; y < canvas.height; y += 40) {
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x++) {
      const yOffset = Math.sin(x * waveFrequency + t) * waveAmplitude;
      ctx.lineTo(x, y + yOffset);
    }
    ctx.stroke();
  }

  t += 0.02;
}

function drawCircuitEffect() {
  const isLightMode = document.body.classList.contains("light-mode");

  ctx.fillStyle = isLightMode ? '#ffffff5b' : '#00000012';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = isLightMode ? '#000000ff' : '#03f8c7ff';
  ctx.font = `${fontSize}px monospace`;

  for (let i = 0; i < drops.length; i++) {
    const text = binary[Math.floor(Math.random() * binary.length)];
    ctx.fillText(text, i * fontSize, drops[i] * fontSize);

    if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
      drops[i] = 0;
    }
    drops[i]++;
  }

  drawVerticalCircuitLines(isLightMode);
  drawWaveLines(isLightMode);
}

setInterval(drawCircuitEffect, 50);
