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
            // Add icon image instead of innerText
            const icon = document.createElement("img");
            icon.src = playerX ? "Letter X.svg" : "Letter O.svg";  // Your icon paths
            icon.alt = playerX ? "X Icon" : "O Icon";
            icon.classList.add("icon");
            box.appendChild(icon);

            // Track which player owns the box
            box.setAttribute("data-player", playerX ? "X" : "O");

            playerX = !playerX;
            box.active = false;
        }
        valid();
    });
}

// Typewriter effect function
function typeWriter(element, text, delay = 50, callback) {
    let i = 0;
    element.innerText = "";
    function typing() {
        if (i < text.length) {
            element.innerText += text.charAt(i);
            i++;
            setTimeout(typing, delay);
        } else if (callback) {
            callback();
        }
    }
    typing();
}

const valid = function () {
    // Remove existing popup if any
    const existingPopup = document.querySelector(".popup");
    if (existingPopup) {
        existingPopup.remove();
    }

    for (let combo of points) {
        let [a, b, c] = combo;

        let val1 = boxes[a].getAttribute("data-player");
        let val2 = boxes[b].getAttribute("data-player");
        let val3 = boxes[c].getAttribute("data-player");

        if (val1 && val1 === val2 && val1 === val3) {
            boxes[a].classList.add("winner");
            boxes[b].classList.add("winner");
            boxes[c].classList.add("winner");

            drawStrike(a, c);

            // Create popup div
            let popup = document.createElement("div");
            popup.classList.add("popup");
            document.body.appendChild(popup);

            // Start typewriter effect with the message
typeWriter(popup, `${val1} Gagne ! 🎉`, 75);  // Adjust spacing & speed if needed


            for (let box of boxes) {
                box.active = false;
            }
            break;
        }
    }
};


// Function to draw a strike line between two boxes
function drawStrike(start, end) {
    // Remove any existing strike line first
    const oldStrike = document.querySelector(".strike");
    if (oldStrike) {
        oldStrike.remove();
    }

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
        box.innerHTML = "";  // Clear icons/images inside boxes
        box.removeAttribute("data-player");  // Remove player tracking attribute
        box.active = true;
    }

    // Remove popup and strike line if they exist
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
    resetGame();
});

