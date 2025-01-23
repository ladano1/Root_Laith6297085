console.log("🤣📱");

const circles = document.querySelectorAll(".circle");

circles.forEach(function(item, index) {
  item.addEventListener("click", function() {
    console.log("circle clicked: " + (parseInt(index)+1));
    
    if(item.classList.contains("square")) {
      item.classList.toggle("make-round");
    } else {
      item.classList.toggle("move-me");
    }
    
  })
})
// //i = i + 1 will be changed to i++
// for(let i = 0; i < circles.length; i++){

// }

// for (let index= 0; i < circles.length;i++){
// console.log(i);
// circles[i].style.backgroundColor = "Green"
// }