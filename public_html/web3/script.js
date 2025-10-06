// ==== Typewriter + Scroll Observer Effect ====
document.addEventListener("DOMContentLoaded", () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const card = entry.target;
        card.classList.add("visible");

        const elementsToType = card.querySelectorAll("h3, p");
        elementsToType.forEach(el => typeWriter(el));

        observer.unobserve(card);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll(".game-card").forEach(card => observer.observe(card));

  const globalTypeTargets = document.querySelectorAll("nav h1, nav a.btn-main, footer p");
  globalTypeTargets.forEach(el => {
    const delay = el.tagName === 'A' ? 500 : 0;
    setTimeout(() => typeWriter(el), delay);
  });
});

function typeWriter(element) {
  const originalText = element.textContent.trim();
  element.textContent = "";
  let i = 0;
  const crazyType = () => {
    if (i < originalText.length) {
      const span = document.createElement("span");
      span.textContent = originalText.charAt(i);
      element.appendChild(span);
      const delay = Math.floor(Math.random() * 80) + 30;
      i++;
      setTimeout(crazyType, delay);
    }
  };
  crazyType();
}

// ==== PlayStation Background Animation ====

const waveCanvas = document.getElementById('waveCanvas');
const waveCtx = waveCanvas.getContext('2d');
const shapeCanvas = document.getElementById('shapeCanvas');
const shapeCtx = shapeCanvas.getContext('2d');

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  waveCanvas.width = window.innerWidth * dpr;
  waveCanvas.height = window.innerHeight * dpr;
  waveCanvas.style.width = window.innerWidth + 'px';
  waveCanvas.style.height = window.innerHeight + 'px';
  waveCtx.setTransform(1, 0, 0, 1, 0, 0);
  waveCtx.scale(dpr, dpr);

  shapeCanvas.width = window.innerWidth * dpr;
  shapeCanvas.height = window.innerHeight * dpr;
  shapeCanvas.style.width = window.innerWidth + 'px';
  shapeCanvas.style.height = window.innerHeight + 'px';
  shapeCtx.setTransform(1, 0, 0, 1, 0, 0);
  shapeCtx.scale(dpr, dpr);
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

let waveOffset = 0;
const waveConfigs = [
  { amplitude: 60, frequency: 0.008, speed: 2.5, color: '#00ff6eff', lineWidth: 4 },
  { amplitude: 40, frequency: 0.012, speed: 2.9, color: '#00ff54', lineWidth: 2 },
  { amplitude: 20, frequency: 0.012, speed: 5.8, color: '#00ff54', lineWidth: 1 }
];

function drawWaves() {
  const width = waveCanvas.width / (window.devicePixelRatio || 1);
  const height = waveCanvas.height / (window.devicePixelRatio || 1);

  waveCtx.clearRect(0, 0, width, height);

  waveConfigs.forEach(config => {
    waveCtx.beginPath();
    for (let x = 0; x <= width; x++) {
      const y = config.amplitude * Math.sin(config.frequency * (x + waveOffset * config.speed)) + height * 0.65;
      if (x === 0) {
        waveCtx.moveTo(x, y);
      } else {
        waveCtx.lineTo(x, y);
      }
    }
    waveCtx.strokeStyle = config.color;
    waveCtx.lineWidth = config.lineWidth;
    waveCtx.shadowColor = config.color;
    waveCtx.shadowBlur = 20;
    waveCtx.stroke();
  });

  waveOffset += 1.5;
  requestAnimationFrame(drawWaves);
}
drawWaves();

const colors = {
  circle: '#ff2a2a',
  cross: '#00a2ff',
  square: '#ff00f2',
  triangle: '#00ff99'
};
const shapes = [];
for (let i = 0; i < 20; i++) {
  shapes.push({
    type: ['circle', 'cross', 'square', 'triangle'][Math.floor(Math.random() * 4)],
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    size: Math.random() * 30 + 20,
    speedY: Math.random() * 0.3 + 0.1,
    rotation: Math.random() * 360,
    rotationSpeed: Math.random() * 0.5 - 0.25
  });
}

function drawShape(ctx, shape) {
  ctx.save();
  ctx.translate(shape.x, shape.y);
  ctx.rotate(shape.rotation * Math.PI / 180);
  ctx.lineWidth = 2;
  ctx.strokeStyle = colors[shape.type];
  ctx.shadowColor = colors[shape.type];
  ctx.shadowBlur = 15;

  switch (shape.type) {
    case 'circle':
      ctx.beginPath();
      ctx.arc(0, 0, shape.size / 2, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case 'cross':
      ctx.beginPath();
      const len = shape.size / 2;
      ctx.moveTo(-len, -len);
      ctx.lineTo(len, len);
      ctx.moveTo(len, -len);
      ctx.lineTo(-len, len);
      ctx.stroke();
      break;
    case 'square':
      const s = shape.size;
      ctx.strokeRect(-s / 2, -s / 2, s, s);
      break;
    case 'triangle':
      ctx.beginPath();
      const h = shape.size;
      ctx.moveTo(0, -h / 2);
      ctx.lineTo(-h / 2, h / 2);
      ctx.lineTo(h / 2, h / 2);
      ctx.closePath();
      ctx.stroke();
      break;
  }

  ctx.restore();
}

function animateShapes() {
  const height = shapeCanvas.height / (window.devicePixelRatio || 1);

  shapeCtx.clearRect(0, 0, shapeCanvas.width, shapeCanvas.height);

  for (let shape of shapes) {
    shape.y -= shape.speedY;
    shape.rotation += shape.rotationSpeed;
    if (shape.y < -50) {
      shape.y = height + 50;
      shape.x = Math.random() * (shapeCanvas.width / (window.devicePixelRatio || 1));
    }
    drawShape(shapeCtx, shape);
  }

  requestAnimationFrame(animateShapes);
}
animateShapes();

document.addEventListener("DOMContentLoaded", () => {
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
