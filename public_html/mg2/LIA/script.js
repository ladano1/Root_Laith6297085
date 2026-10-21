// LIA FINAL PROJECT
// Motion Graphics Card Animations

const cards = document.querySelectorAll(".card");

const reducedMotion = window.matchMedia(
"(prefers-reduced-motion: reduce)"
).matches;

if ("IntersectionObserver" in window && !reducedMotion) {

cards.forEach((card, index) => {
card.style.opacity = "0";
card.style.transform = "translateY(35px)";
card.style.transition =
"opacity 0.8s ease, transform 0.8s ease";
card.style.transitionDelay = `${index * 150}ms`;
});

const observer = new IntersectionObserver(entries => {

entries.forEach(entry => {

if (entry.isIntersecting) {
entry.target.style.opacity = "1";
entry.target.style.transform = "translateY(0)";
observer.unobserve(entry.target);
}

});

}, {
threshold: 0.1
});

cards.forEach(card => observer.observe(card));
}