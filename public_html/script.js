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

// === Audio Setup with Web Audio API Unlock ===
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

const typeSound = new Audio("./Typewritter.wav");
typeSound.volume = 0.4;
typeSound.preload = "auto";

const clickSound = new Audio("./Digital touch.wav");
clickSound.volume = 0.5;
clickSound.preload = "auto";

// === Audio Unlock & Control Flags ===
let soundUnlocked = false;
let skipPressed = false;

// Try to unlock audio context immediately on load
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

// Play typewriter sound once to unlock playback
function playTypeSoundOnce() {
  try {
    typeSound.currentTime = 0;
    typeSound.play();
  } catch (e) {
    console.warn("Initial type sound play failed:", e);
  }
}

unlockAudioContext();

// Also unlock on user interaction (fallback)
function unlockOnInteraction() {
  if (!soundUnlocked) {
    audioCtx.resume().then(() => {
      soundUnlocked = true;
      playTypeSoundOnce();
    });
  }
}
document.addEventListener("click", unlockOnInteraction);
document.addEventListener("keydown", unlockOnInteraction);
document.addEventListener("touchstart", unlockOnInteraction);

// === Typewriter with Sound (updated) ===
async function typewriter(el, text, min = 20, max = 60) {
  el.textContent = "";
  for (let i = 0; i < text.length; i++) {
    if (skipPressed) break; // Stop if skip was pressed

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

  // Characters used during scramble
  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*-+=<>";

  // Scrambler Effect
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

  // End Intro and show hero content with typing
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

  // Skip button — updated to stop sounds and animation immediately
  skipBtn?.addEventListener("click", () => {
    skipPressed = true; // Stop typewriter animation & sounds

    // Immediately stop any playing typing sound
    typeSound.pause();
    typeSound.currentTime = 0;

    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});

    finishIntro();
  });

  // Run intro sequence
  const scrambler = new Scrambler(scrambleOut);
  (async () => {
    await scrambler.setText(targetTitle.toUpperCase());
    await new Promise((r) => setTimeout(r, 250));
    await typewriter(twOut, targetSub);
    await new Promise((r) => setTimeout(r, 400));
    finishIntro();
  })();
});


// === Circuit Animation Background (Existing + Enhanced with Wave Lines) ===
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

// === WAVE LINES - NEW ADDITION ===
let t = 0;
function drawWaveLines() {
  const waveColor = "#00ffcc33";
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

// === DRAW FUNCTION COMBINED ===
function drawCircuitEffect() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.07)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw binary rain
  ctx.fillStyle = '#03f8c7ff';
  ctx.font = `${fontSize}px monospace`;

  for (let i = 0; i < drops.length; i++) {
    const text = binary[Math.floor(Math.random() * binary.length)];
    ctx.fillText(text, i * fontSize, drops[i] * fontSize);

    if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
      drops[i] = 0;
    }
    drops[i]++;
  }

  // Draw vertical circuit lines
  drawVerticalCircuitLines();

  // Draw horizontal wave lines
  drawWaveLines();
}

// === EXISTING FUNCTION UNCHANGED ===
function drawVerticalCircuitLines() {
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#23be9fff';
  ctx.shadowColor = '#016723ff';
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

setInterval(drawCircuitEffect, 50);

// === Light/Dark Mode Toggle Logic ===
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
