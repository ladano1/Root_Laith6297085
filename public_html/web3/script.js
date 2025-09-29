document.addEventListener("DOMContentLoaded", () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const card = entry.target;
        card.classList.add("visible");

        // Typewriter effect on all text elements inside the card
        const elementsToType = card.querySelectorAll("h3, p");
        elementsToType.forEach(el => typeWriter(el));

        observer.unobserve(card);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll(".game-card").forEach(card => observer.observe(card));

  // Also typewriter effect on nav and footer text
  const globalTypeTargets = document.querySelectorAll("nav h1, nav a.btn-main, footer p");
  globalTypeTargets.forEach(el => {
    const delay = el.tagName === 'A' ? 500 : 0; // slight delay for button
    setTimeout(() => typeWriter(el), delay);
  });
});

// Typewriter Effect
function typeWriter(element) {
  const originalText = element.textContent.trim();
  element.textContent = ""; // Clear original text
  let i = 0;

  const crazyType = () => {
    if (i < originalText.length) {
      const span = document.createElement("span");
      span.textContent = originalText.charAt(i);
      element.appendChild(span);

      const delay = Math.floor(Math.random() * 80) + 30; // Typing speed
      i++;
      setTimeout(crazyType, delay);
    }
  };

  crazyType();
}
