const cards = document.querySelectorAll(".glass-card");




cards.forEach((card, index) => {
  card.style.opacity = "0";
  card.style.transform = "translateY(40px)";

  setTimeout(() => {
    card.style.transition =
      "opacity 0.6s ease, transform 0.6s ease";

    card.style.opacity = "1";
    card.style.transform = "translateY(0)";
  }, index * 120);
});




cards.forEach((card) => {

  card.addEventListener("mousemove", (event) => {

    const rect = card.getBoundingClientRect();

    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX =
      ((mouseY - centerY) / centerY) * -8;

    const rotateY =
      ((mouseX - centerX) / centerX) * 8;

    card.style.transition =
      "transform 0.1s ease";

    card.style.transform = `
      translateY(-10px)
      rotateX(${rotateX}deg)
      rotateY(${rotateY}deg)
      scale(1.02)
    `;
  });



  card.addEventListener("mouseleave", () => {

    card.style.transition =
      "transform 0.4s ease";

    card.style.transform = `
      translateY(0)
      rotateX(0deg)
      rotateY(0deg)
      scale(1)
    `;
  });

});


const navLinks = document.querySelectorAll(
  'a[href^="#"]'
);

navLinks.forEach((link) => {

  link.addEventListener("click", (event) => {

    const targetId =
      link.getAttribute("href");

    if (targetId === "#") {
      return;
    }

    const target =
      document.querySelector(targetId);

    if (target) {

      event.preventDefault();

      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    }

  });

});
