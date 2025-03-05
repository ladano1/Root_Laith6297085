const panel = document.getElementById("panel");
const sound = new Audio("sounds/door.mp3");

panel.onclick = function() {
     this.classList.toggle("slide-up");
     sound.play();
}