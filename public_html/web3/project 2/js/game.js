// --- Canvas Setup ---
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.querySelector("#gameBox").appendChild(canvas);

// --- Load Images ---
var bgImage = new Image(); bgImage.src = "images/background.png";
var sunImage = new Image(); sunImage.src = "images/sun.png";
var cloudImage = new Image(); cloudImage.src = "images/cloud.png";
var grassImage = new Image(); grassImage.src = "images/grass.png";
var treeImage = new Image(); treeImage.src = "images/tree.png";
var playerRImage = new Image(); playerRImage.src = "images/player.png"; 
var playerLImage = new Image(); playerLImage.src = "images/player.png"; 
var goodyImage = new Image(); goodyImage.src = "images/goody.png";
var baddieImage = new Image(); baddieImage.src = "images/baddie.png";
var winImage = new Image(); winImage.src = "images/win.png";

var imagesReady = { bg:false,sun:false,cloud:false,grass:false,tree:false,playerR:false,playerL:false,goody:false,baddie:false,win:false };
bgImage.onload=()=>imagesReady.bg=true;
sunImage.onload=()=>imagesReady.sun=true;
cloudImage.onload=()=>imagesReady.cloud=true;
grassImage.onload=()=>imagesReady.grass=true;
treeImage.onload=()=>imagesReady.tree=true;
playerRImage.onload=()=>imagesReady.playerR=true;
playerLImage.onload=()=>imagesReady.playerL=true;
goodyImage.onload=()=>imagesReady.goody=true;
baddieImage.onload=()=>imagesReady.baddie=true;
winImage.onload=()=>imagesReady.win=true;

// --- Player & Sizes ---
var basePlayerSize=120;
var baddieSize=90;
var player={speed:8,width:basePlayerSize,height:basePlayerSize,x:0,y:0};
var playerCurrentImage=playerRImage;

var goodies=[],baddies=[];
var vX=0,vY=0;
var life=100;
var collectedGoodies=0;

// --- Controls ---
addEventListener("keydown",function(e){
    if(e.keyCode===38){vX=0;vY=-player.speed;}
    if(e.keyCode===40){vX=0;vY=player.speed;}
    if(e.keyCode===37){vX=-player.speed;vY=0;playerCurrentImage=playerLImage;}
    if(e.keyCode===39){vX=player.speed;vY=0;playerCurrentImage=playerRImage;}
    if(e.keyCode===32){vX=0;vY=0;}
},false);

function getGrassHeight(){return imagesReady.grass?grassImage.height:0;}
function checkCollision(obj1,obj2){return obj1.x<obj2.x+obj2.width&&obj1.x+obj1.width>obj2.x&&obj1.y<obj2.y+obj2.height&&obj1.y+obj1.height>obj2.y;}
function checkLose(){return life<1;}
function checkWin(){return collectedGoodies>=4;}

function spawnGoody(){
    var g={width:basePlayerSize,height:basePlayerSize,x:Math.random()*(canvas.width-basePlayerSize),y:-basePlayerSize,speedY:3+Math.random()*3};
    goodies.push(g);
}
function spawnBaddie(){
    var b={width:baddieSize,height:baddieSize,x:Math.random()*(canvas.width-baddieSize),y:-baddieSize,speedY:4+Math.random()*4};
    baddies.push(b);
}

function init(){
    player.x=(canvas.width-player.width)/2;
    player.y=(canvas.height-player.height)/2;
    goodies.length=0;baddies.length=0;collectedGoodies=0;
    for(let i=0;i<3;i++)spawnGoody();
    spawnBaddie();
    life=100;
    vX=0;vY=0;
    playerCurrentImage=playerRImage;
    gameRunning=true;
}


var gameRunning=true;
var gameOverAnimProgress=0;
var winAnimProgress=0;

// --- Confetti ---
const confettiPieces=[];
const confettiCount=150;

function createConfetti(){
    confettiPieces.length=0;
    for(let i=0;i<confettiCount;i++){
        confettiPieces.push({
            x:Math.random()*canvas.width,
            y:Math.random()*canvas.height,
            size:5+Math.random()*5,
            speedY:1+Math.random()*3,
            speedX:(Math.random()-0.5)*2,
            color:`hsl(${Math.random()*360},100%,60%)`,
            rotation:Math.random()*360,
            rotationSpeed:(Math.random()-0.5)*10
        });
    }
}
function drawConfetti(){confettiPieces.forEach(p=>{ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rotation*Math.PI/180);ctx.fillStyle=p.color;ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size);ctx.restore();});}
function updateConfetti(){confettiPieces.forEach(p=>{p.y+=p.speedY;p.x+=p.speedX;p.rotation+=p.rotationSpeed;if(p.y>canvas.height){p.y=-p.size;p.x=Math.random()*canvas.width;}if(p.x>canvas.width)p.x=0;else if(p.x<0)p.x=canvas.width;});}

// --- CRAZY WIN ANIMATION ---
function animateWin(){
    if(winAnimProgress===0)createConfetti();
    winAnimProgress+=0.03;

    ctx.clearRect(0,0,canvas.width,canvas.height);

    let flash=(Math.sin(winAnimProgress*10)+1)/2;
    ctx.fillStyle=`hsl(${120+flash*60},100%,${40+20*flash}%)`;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    updateConfetti();
    drawConfetti();

    ctx.textAlign="center";
    ctx.fillStyle="white";
    ctx.font="100px 'Press Start 2P', monospace";
    ctx.fillText("VOUS GAGNEZ !",canvas.width/2,canvas.height/2);

    ctx.beginPath();
    ctx.strokeStyle=`rgba(255,255,255,${1-(winAnimProgress%1)})`;
    ctx.lineWidth=8;
    ctx.arc(canvas.width/2,canvas.height/2,winAnimProgress*300,0,Math.PI*2);
    ctx.stroke();

    ctx.font="22px 'Press Start 2P', monospace";
    ctx.fillStyle=`rgba(255,255,255,${0.7+0.3*Math.sin(winAnimProgress*5)})`;
    ctx.fillText("Cliquez pour rejouer",canvas.width/2,canvas.height/2+120);

    canvas.onclick=()=>{
        init(); gameRunning=true; winAnimProgress=0;
        canvas.onclick=null; window.requestAnimationFrame(main);
    };

    if(!gameRunning)window.requestAnimationFrame(animateWin);
}

// --- CRAZY GAME OVER ANIMATION ---
function animateGameOver(){
    gameOverAnimProgress+=0.08;
    ctx.clearRect(0,0,canvas.width,canvas.height);

    let flicker=Math.sin(gameOverAnimProgress*20)*50;
    ctx.fillStyle=`rgb(${120+flicker},0,0)`;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    for(let i=0;i<8;i++){
        ctx.strokeStyle=`rgba(255,0,0,${Math.random()*0.8})`;
        ctx.beginPath();
        ctx.moveTo(Math.random()*canvas.width,0);
        for(let j=0;j<4;j++){
            ctx.lineTo(Math.random()*canvas.width,Math.random()*canvas.height);
        }
        ctx.stroke();
    }

    ctx.textAlign="center";
    ctx.fillStyle="white";
    ctx.font="90px 'Press Start 2P', monospace";
    ctx.fillText("JEU TERMINÉ !",canvas.width/2,canvas.height/2);

    for(let i=0;i<80;i++){
        ctx.fillStyle=`rgba(255,${Math.random()*100},${Math.random()*100},0.8)`;
        ctx.fillRect(canvas.width/2+Math.random()*400-200,canvas.height/2+Math.random()*300-150,4,4);
    }

    ctx.font="22px 'Press Start 2P', monospace";
    ctx.fillStyle=`rgba(255,255,255,${0.7+0.3*Math.sin(gameOverAnimProgress*5)})`;
    ctx.fillText("Cliquez pour réessayer",canvas.width/2,canvas.height/2+120);

    canvas.onclick=()=>{
        init(); gameRunning=true; gameOverAnimProgress=0;
        canvas.onclick=null; window.requestAnimationFrame(main);
    };

    if(!gameRunning)window.requestAnimationFrame(animateGameOver);
}

function gameOver(){gameRunning=false; gameOverAnimProgress=0; animateGameOver();}

// --- Main Game Loop ---
function main(){
    if(!gameRunning)return;

    if(checkLose())return gameOver();
    if(checkWin()){gameRunning=false; winAnimProgress=0; return animateWin();}

    player.x+=vX; player.y+=vY;
    if(player.x<=0){player.x=0;vX=Math.abs(vX); playerCurrentImage=playerRImage;}
    if(player.x+player.width>=canvas.width){player.x=canvas.width-player.width;vX=-Math.abs(vX); playerCurrentImage=playerLImage;}
    if(player.y<=0){player.y=0;vY=Math.abs(vY);}
    if(player.y+player.height>=canvas.height){player.y=canvas.height-player.height;vY=-Math.abs(vY);}

    for(let i=goodies.length-1;i>=0;i--){
        goodies[i].y+=goodies[i].speedY;
        if(checkCollision(player,goodies[i])){
            goodies.splice(i,1); collectedGoodies++; life=Math.min(100,life+5);
            if(collectedGoodies<4)spawnGoody();
        }else if(goodies[i].y>canvas.height){goodies.splice(i,1); if(collectedGoodies<4)spawnGoody();}
    }

    for(let i=baddies.length-1;i>=0;i--){
        baddies[i].y+=baddies[i].speedY;
        if(checkCollision(player,baddies[i])){baddies.splice(i,1); life-=20; spawnBaddie();}
        else if(baddies[i].y>canvas.height){baddies.splice(i,1); spawnBaddie();}
    }

    render();
    window.requestAnimationFrame(main);
}

// --- Render ---
function render(){
    ctx.clearRect(0,0,canvas.width,canvas.height);

    if(imagesReady.bg)ctx.drawImage(bgImage,0,0,canvas.width,canvas.height);
    else{ctx.fillStyle="#87ceeb"; ctx.fillRect(0,0,canvas.width,canvas.height);}

    if(imagesReady.sun){let sunWidth=canvas.width*0.1; let sunHeight=(sunImage.height/sunImage.width)*sunWidth; ctx.drawImage(sunImage,0,0,sunWidth,sunHeight);}
    if(imagesReady.cloud){let cloudWidth=canvas.width*0.15; let cloudHeight=(cloudImage.height/cloudImage.width)*cloudWidth; ctx.drawImage(cloudImage,canvas.width-cloudWidth-20,20,cloudWidth,cloudHeight);}

    let grassHeight=0;
    if(imagesReady.grass){grassHeight=grassImage.height; for(let x=0;x<canvas.width;x+=grassImage.width)ctx.drawImage(grassImage,x,canvas.height-grassHeight);}

    if(imagesReady.tree&&imagesReady.grass){let treeWidth=canvas.width*0.15; let treeHeight=(treeImage.height/treeImage.width)*treeWidth; ctx.drawImage(treeImage,canvas.width-treeWidth-10,canvas.height-grassHeight-treeHeight,treeWidth,treeHeight);}

    if(imagesReady.goody)goodies.forEach(g=>ctx.drawImage(goodyImage,g.x,g.y,g.width,g.height));
    if(imagesReady.baddie)baddies.forEach(b=>ctx.drawImage(baddieImage,b.x,b.y,b.width,b.height));

    if(imagesReady.playerR){
        if(playerCurrentImage===playerLImage){ctx.save();ctx.translate(player.x+player.width/2,player.y+player.height/2);ctx.scale(-1,1);ctx.drawImage(playerCurrentImage,-player.width/2,-player.height/2,player.width,player.height);ctx.restore();}
        else ctx.drawImage(playerCurrentImage,player.x,player.y,player.width,player.height);
    }

    const healthBarWidth=200;
    const healthBarHeight=30;
    const healthBarX=20;
    const healthBarY=canvas.height-120;
    ctx.fillStyle="red"; ctx.fillRect(healthBarX,healthBarY,healthBarWidth,healthBarHeight);
    ctx.fillStyle="limegreen"; ctx.fillRect(healthBarX,healthBarY,(life/100)*healthBarWidth,healthBarHeight);
    ctx.strokeStyle="black"; ctx.lineWidth=2; ctx.strokeRect(healthBarX,healthBarY,healthBarWidth,healthBarHeight);

    ctx.fillStyle="black"; 
    ctx.font="20px 'Press Start 2P', monospace"; 
    ctx.textAlign="left";
    let bottomY=canvas.height-40;
    // Timer removed, so no time display here
    ctx.fillText(`Feuille: ${collectedGoodies}/4`,20,bottomY-30);
}

// --- Start ---
init();
window.requestAnimationFrame(main);
