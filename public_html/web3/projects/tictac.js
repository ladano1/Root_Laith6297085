console.log("all ready to go 😁");

let boxes = document.querySelectorAll(".box");
let resetbutton = document.querySelector(".reset");
let panelMessage = document.querySelector(".message");

let msgX = document.getElementById("X");
let msgO = document.getElementById("O");

let playerX = true;
const points = [
    [0, 1, 2],
    [0, 3, 6],
    [0, 4, 8],
    [1, 4, 7],
    [2, 5, 8],
    [2, 4, 6],
    [3, 4, 5],
    [6, 7, 8]
];

// Setup click events for each box
for (let box of boxes) {
    box.active = true;
    box.addEventListener("click", () => {
        if (box.active) {
            box.innerText = playerX ? "X" : "O";
            playerX = !playerX;
            box.active = false;
        }
        valid();
    });
}

// Function to check for a winner
const valid = function () {
    const existingPopup = document.querySelector(".popup");
    if (existingPopup) {
        existingPopup.remove();
    }

    for (let combo of points) {
        let [a, b, c] = combo;
        let val1 = boxes[a].innerText;
        let val2 = boxes[b].innerText;
        let val3 = boxes[c].innerText;

        if (val1 && val1 === val2 && val1 === val3) {
            // Add glow effect
            boxes[a].classList.add("winner");
            boxes[b].classList.add("winner");
            boxes[c].classList.add("winner");

            // Draw strike line
            drawStrike(a, c);

            // Show winner message
            let popup = document.createElement("div");
            popup.classList.add("popup");
            popup.innerText = `${val1} Gagne! 🎉`;
            document.body.appendChild(popup);

            // Disable all boxes
            for (let box of boxes) {
                box.active = false;
            }

            break;
        }
    }
};

// Function to draw a strike line between two boxes
function drawStrike(start, end) {
    const board = document.querySelector(".board");
    let strike = document.createElement("div");
    strike.classList.add("strike");

    let rect1 = boxes[start].getBoundingClientRect();
    let rect2 = boxes[end].getBoundingClientRect();

    let x1 = rect1.left + rect1.width / 2;
    let y1 = rect1.top + rect1.height / 2;
    let x2 = rect2.left + rect2.width / 2;
    let y2 = rect2.top + rect2.height / 2;

    let length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    let angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

    strike.style.width = length + "px";
    strike.style.left = x1 + "px";
    strike.style.top = y1 + "px";
    strike.style.transform = `rotate(${angle}deg)`;

    document.body.appendChild(strike);
}

// Function to clear the board
const resetGame = function () {
    for (let box of boxes) {
        box.classList.remove("winner");
        box.innerText = "";
        box.active = true;
    }

    const popup = document.querySelector(".popup");
    if (popup) {
        popup.remove();
    }

    const strike = document.querySelector(".strike");
    if (strike) {
        strike.remove();
    }

    panelMessage.innerText = "";
    playerX = true; // Reset starting player
};

// Reset button handler
resetbutton.addEventListener("click", () => {
    resetGame(); // ✅ This will now remove glow and reset everything
});
