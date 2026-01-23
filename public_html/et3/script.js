// CURSOR GLOW FOLLOW
const glow = document.querySelector(".cursor-glow");
document.addEventListener("mousemove", e => {
  glow.style.left = e.clientX + "px";
  glow.style.top = e.clientY + "px";
});

// 3D CARD HOVER EFFECT
document.querySelectorAll(".card").forEach(card => {
  card.addEventListener("mousemove", e => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    card.style.transform =
      `rotateX(${ -y / 18 }deg) rotateY(${ x / 18 }deg) translateY(-18px) scale(1.05)`;
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "rotateX(0) rotateY(0)";
  });
});

// STARFIELD CANVAS
const starfield = document.getElementById("starfield");
const ctx = starfield.getContext("2d");
let stars = [];
const STAR_COUNT = 200;

function randomRange(min, max) { return Math.random() * (max - min) + min; }

function createStars() {
  stars = [];
  for(let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * starfield.width,
      y: Math.random() * starfield.height,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random(),
      delta: Math.random() * 0.03 + 0.005,
      speed: randomRange(0.1, 0.6)
    });
  }
}

function drawStars() {
  ctx.clearRect(0, 0, starfield.width, starfield.height);
  for(let star of stars) {
    star.alpha += star.delta;
    if(star.alpha <= 0 || star.alpha >= 1) star.delta = -star.delta;

    star.y -= star.speed;
    if(star.y < 0) star.y = starfield.height;

    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${Math.floor(0+255*Math.random())},255,136,${star.alpha})`;
    ctx.shadowColor = "rgba(0, 255, 136, 1)";
    ctx.shadowBlur = 8;
    ctx.fill();
  }
}

function resizeCanvas() {
  starfield.width = window.innerWidth;
  starfield.height = window.innerHeight;
  createStars();
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function animateStars() {
  drawStars();
  requestAnimationFrame(animateStars);
}
animateStars();

// GALAXY DUST + COMETS
const dustContainer = document.querySelector(".galaxy-dust");

function createDustParticle() {
  const particle = document.createElement("div");
  particle.classList.add("dust-particle");
  particle.style.left = `${Math.random() * 100}%`;
  particle.style.top = `${Math.random() * 100}%`;
  particle.style.animationDuration = `${randomRange(5, 12)}s`;
  particle.style.width = particle.style.height = `${randomRange(2, 6)}px`;
  particle.style.opacity = randomRange(0.3, 0.9);
  dustContainer.appendChild(particle);

  setTimeout(() => { particle.remove(); }, 12000);
}

function createComet() {
  const comet = document.createElement("div");
  comet.classList.add("comet");
  comet.style.left = `${Math.random() * 100}%`;
  comet.style.top = `${Math.random() * 100}%`;
  comet.style.animationDuration = `${randomRange(1.2, 2.5)}s`;
  dustContainer.appendChild(comet);
  setTimeout(() => { comet.remove(); }, 2500);
}

setInterval(createDustParticle, 200);
setInterval(createComet, 800);

// INTRO GLITCH + COLOR SHIFT
function glitchExplosion() {
  const intro = document.getElementById("intro");
  intro.classList.add("glitching");
  setTimeout(() => {
    intro.style.opacity = 0;
    setTimeout(() => {
      intro.style.display = "none";
      document.querySelector("main").classList.add("show");
    }, 1200);
  }, 1000);
}

setTimeout(glitchExplosion, 5000);

// SKIP ON CLICK
document.getElementById("intro").addEventListener("click", glitchExplosion);
