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
const typeSound = new Audio("./sounds/typewriter.wav");
typeSound.volume = 0.4;
typeSound.preload = "auto";

const clickSound = new Audio("./Digital touch.wav");
clickSound.volume = 0.5;
clickSound.preload = "auto";

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

  // Typewriter with Sound
  async function typewriter(el, text, min = 20, max = 60) {
    el.textContent = "";
    for (let i = 0; i < text.length; i++) {
      el.textContent += text[i];
      typeSound.currentTime = 0;
      typeSound.play().catch(() => {}); // Handle autoplay restrictions silently
      const jitter = Math.floor(Math.random() * (max - min + 1)) + min;
      await new Promise((r) => setTimeout(r, jitter));
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

  // Skip button
  skipBtn?.addEventListener("click", () => {
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
