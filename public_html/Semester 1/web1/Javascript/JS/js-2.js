console.log("JS 2 is INSANE");

//Step 1 - selecting your element 
const myTriangle = document.getElementById("triangle-right");

//Step 2 - adding a click event 

// myTriangle.addEventListener("click", function() {
//
// });

myTriangle.addEventListener("click", () => {
    // myTriangle.style.borderLeft = "100px solid blue";
    myTriangle.classList.toggle("change-me");
})