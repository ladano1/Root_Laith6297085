// ================================
//  Neon Particle Field (No Red, No Brightness)
// ================================
const canvas = document.querySelector('.background-canvas');
const ctx = canvas.getContext('2d');
let width, height;
let mouse = { x: 0, y: 0 };

function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Mouse parallax effect
window.addEventListener('mousemove', e => {
  mouse.x = (e.clientX / width - 0.5) * 2;
  mouse.y = (e.clientY / height - 0.5) * 2;
});

// Particle layers for depth
const layers = [
  { count: 700, depth: 300 },
  { count: 500, depth: 600 },
  { count: 300, depth: 900 }
];

// Neon color palette WITHOUT RED
const colors = [
  [0, 255, 204],   // Cyan
  [0, 255, 84],    // Neon green
  [0, 140, 255]    // Bright blue
];

let particles = [];
for (const layer of layers) {
  for (let i = 0; i < layer.count; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    particles.push({
      x: Math.random() * width * 2 - width,
      y: Math.random() * height * 2 - height,
      z: Math.random() * layer.depth,
      layer,
      color
    });
  }
}

 
function animate() {
  // Background with subtle fading for trail effect
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.fillRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2;

  for (let p of particles) {
    const { depth } = p.layer;
    p.z -= 1.3;
    if (p.z <= 1) {
      p.z = depth;
      p.x = Math.random() * width * 2 - width;
      p.y = Math.random() * height * 2 - height;
    }

    const scale = 300 / p.z;
    const x2d = (p.x * scale) + cx + mouse.x * 120;
    const y2d = (p.y * scale) + cy + mouse.y * 60;

    const [r, g, b] = p.color;
    const color = `rgb(${r},${g},${b})`; // Fixed color, no brightness

    ctx.shadowBlur = 0; // No glow
    ctx.fillStyle = color;

    const size = scale * 0.9;
    ctx.beginPath();
    ctx.arc(x2d, y2d, size, 0, Math.PI * 2);
    ctx.fill();
  }

  requestAnimationFrame(animate);
}

animate();
