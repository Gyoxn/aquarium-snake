var canvas = document.getElementById("game_area");
var ctx = canvas.getContext("2d");
var startBtn = document.getElementById('start');
var pauseBtn = document.getElementById('pause');

var bestScoreElement = document.getElementById('best_score');
var myScoreElement = document.getElementById('my_score');

// ✅ 모바일 화면에서는 자동으로 크기 축소
let width = 450;
let height = 350;
if (window.innerWidth <= 600) {
  width = 360;
  height = 280;
}
const snakeSize = 10;

// ── 속도 규칙형 ────────────────────────
const BASE_INTERVAL = 120;
const ACCEL_STEP_SCORE = 10;
const ACCEL_STEP_MS = 6;
const MIN_INTERVAL = 40;

const LS_KEYS = { BEST: "snake_best_score_v1", NAME: "snake_player_name_v1" };

var bestScore = 0;
var direction = " ";

// 🎮 닉네임 관련 요소
const nameInput = document.getElementById('player_name_input');
const nameBtn = document.getElementById('save_name_btn');
const nameDisplay = document.getElementById('player_name_display');

// ────────────────────────────────────────
(function() {
  var upBtn = document.getElementsByClassName("btn");
  upBtn[0].onmousedown = upBtn[0].ontouchstart = function(){ if (direction != "down") direction = "up"; };
  upBtn[1].onmousedown = upBtn[1].ontouchstart = function(){ if (direction != "right") direction = "left"; };
  upBtn[2].onmousedown = upBtn[2].ontouchstart = function(){ if (direction != "left") direction = "right"; };
  upBtn[3].onmousedown = upBtn[3].ontouchstart = function(){ if (direction != "up")   direction = "down"; };

  window.onkeydown = function(event) {
    switch (event.keyCode) {
      case 37: case 65: if (direction != "right") direction = "left";  break;
      case 38: case 87: if (direction != "down")  direction = "up";    break;
      case 39: case 68: if (direction != "left")  direction = "right"; break;
      case 40: case 83: if (direction != "up")    direction = "down";  break;
      case 32:
        event.preventDefault();
        if (startBtn.disabled === false) snakeGame.start();
        else if (pauseBtn.disabled === false) snakeGame.togglePause();
        break;
      default: break;
    }
  };

  window.onload = function() {
    snakeGame.init();
    pauseBtn.disabled = true;
    loadPlayerName();
  };

  startBtn.addEventListener("click", function(){ snakeGame.start(); });
  pauseBtn.addEventListener("click", function(){ snakeGame.togglePause(); });

  nameBtn.addEventListener("click", savePlayerName);
  nameInput.addEventListener("keypress", e => { if (e.key === "Enter") savePlayerName(); });
})();

function loadPlayerName() {
  try {
    const name = localStorage.getItem(LS_KEYS.NAME);
    if (name) {
      nameDisplay.textContent = `PLAYER: ${name}`;
      nameInput.value = name;
    }
  } catch {}
}
function savePlayerName() {
  const name = nameInput.value.trim();
  if (!name) { alert("닉네임을 입력해주세요!"); return; }
  localStorage.setItem(LS_KEYS.NAME, name);
  nameDisplay.textContent = `PLAYER: ${name}`;
}

// ────────────────────────────────────────
var snakeGame = (function() {
  var score, mySnake, foodX, foodY;
  var gameInterval, isPaused = false, isGameOver = false;
  var currentInterval = BASE_INTERVAL;

  function loadBestScore() {
    try { var val = localStorage.getItem(LS_KEYS.BEST); return val ? parseInt(val, 10) : 0; }
    catch { return 0; }
  }
  function saveBestScore(value) { try { localStorage.setItem(LS_KEYS.BEST, String(value)); } catch {} }

  var calcInterval = sc => Math.max(MIN_INTERVAL, BASE_INTERVAL - Math.floor(sc / ACCEL_STEP_SCORE) * ACCEL_STEP_MS);
  var setGameLoop = () => { clearInterval(gameInterval); gameInterval = setInterval(updateGame, currentInterval); };
  var updateSpeed = () => { var next = calcInterval(score); if (next !== currentInterval && !isPaused && !isGameOver) { currentInterval = next; setGameLoop(); } };
  var updateScoreDisplay = () => {
    bestScoreElement.textContent = "BEST SCORE: " + bestScore;
    myScoreElement.textContent = "SCORE: " + score;
  };

  var init = function() {
    bestScore = loadBestScore();
    score = 0;
    canvas.width = width; canvas.height = height;
    areaClear(); updateScoreDisplay();
  };

  var areaClear = function() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';

    ctx.clearRect(0,0,width,height);
    ctx.fillStyle='lightgrey';
    ctx.fillRect(0,0,width,height);
    ctx.strokeStyle='black';
    ctx.strokeRect(0,0,width,height);
  };

  var start = function() {
    startBtn.disabled = true;
    pauseBtn.disabled = true;
    areaClear();

    countdown(3, function() {
      areaClear();
      ctx.font="bold 54px Cafe24ProUp";
      ctx.fillStyle="#2c8f3a";
      ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillText("START!",width/2,height/2);

      setTimeout(function(){
        score=0; direction="down"; isPaused=false; isGameOver=false;
        mySnake=new makeSnake(3); createFood(); updateScoreDisplay();
        currentInterval=calcInterval(score);
        pauseBtn.disabled=false; pauseBtn.textContent='PAUSE';
        setGameLoop();
      },700);
    });
  };

  var stop=function(){
    clearInterval(gameInterval);
    if(score>bestScore){bestScore=score;saveBestScore(bestScore);}
    startBtn.disabled=false; pauseBtn.disabled=true;
    pauseBtn.textContent='PAUSE'; direction=" "; isPaused=false; isGameOver=true;
    updateScoreDisplay();
  };

  var togglePause=function(){
    if(startBtn.disabled===false&&!isPaused)return;
    isPaused=!isPaused;
    if(isPaused){ clearInterval(gameInterval); draw.pauseOverlay(); pauseBtn.textContent='RESUME'; }
    else { areaClear(); setGameLoop(); pauseBtn.textContent='PAUSE'; }
  };

  var countdown=function(num,callback){
    areaClear();
    ctx.font="bold 60px Cafe24ProUp";
    ctx.fillStyle="#37558d";
    ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText(num,width/2,height/2);
    if(num>1)setTimeout(()=>countdown(num-1,callback),1000);
    else setTimeout(callback,1000);
  };

  class makeSnake{
    constructor(tail_length){
      this.snake=[];
      for(var i=tail_length;i>=0;i--)this.snake.push({x:i,y:0});
      this.newPos=function(){
        var posX=this.snake[0].x,posY=this.snake[0].y;
        switch(direction){case"left":posX--;break;case"right":posX++;break;case"up":posY--;break;case"down":posY++;break;}
        if(checkCollision(posX,posY,this.snake)){stop();return;}
        this.snake.unshift({x:posX,y:posY});
        if(isThereFood(posX,posY)){score++;createFood();updateScoreDisplay();updateSpeed();}
        else this.snake.pop();
      };
      this.display=function(){for(var i=0;i<this.snake.length;i++)draw.sankeBody(this.snake[i].x,this.snake[i].y);};
    }
  }

  var draw={
    sankeBody(x,y){
      ctx.fillStyle = '#7ec8e3';
      ctx.fillRect(x*snakeSize,y*snakeSize,snakeSize,snakeSize);
      ctx.strokeStyle = '#3a89b7';
      ctx.strokeRect(x*snakeSize,y*snakeSize,snakeSize,snakeSize);
    },
    food(x,y){
      ctx.fillStyle='brown';
      ctx.fillRect(x*snakeSize,y*snakeSize,snakeSize,snakeSize);
      ctx.strokeStyle='black';
      ctx.strokeRect(x*snakeSize,y*snakeSize,snakeSize,snakeSize);
    },
    pauseOverlay(){
      ctx.save();
      ctx.fillStyle="rgba(0,0,0,0.5)";
      ctx.fillRect(0,0,width,height);
      ctx.font="bold 48px Cafe24ProUp";
      ctx.fillStyle="#ffffff";
      ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillText("PAUSED",width/2,height/2-10);
      ctx.font="16px Cafe24ProUp";
      ctx.fillStyle="#cfd1d5";
      ctx.fillText("재개하려면 RESUME 버튼이나 SPACE BAR를 눌러주세요.",width/2,height/2+25);
      ctx.restore();
    },
    gameOverOverlay(){
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
      ctx.fillRect(0, 0, width, height);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "bold 54px Cafe24ProUp";
      ctx.lineWidth = 6;
      ctx.strokeStyle = "rgba(0,0,0,0.6)";
      ctx.strokeText("GAME OVER", width / 2, height / 2 - 18);
      ctx.fillStyle = "#ff5757";
      ctx.fillText("GAME OVER", width / 2, height / 2 - 18);
      ctx.font = "16px Cafe24ProUp";
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 6;
      ctx.fillStyle = "#ffffff";
      ctx.fillText("START 버튼이나 SPACE BAR를 눌러 다시 시작하세요.", width / 2, height / 2 + 24);
      ctx.restore();
    }
  };

  var checkCollision=function(x,y,arr){
    var maxX=Math.floor(width/snakeSize),maxY=Math.floor(height/snakeSize);
    if(x<0||y<0||x>=maxX||y>=maxY)return true;
    for(var i=0;i<arr.length;i++)if(x===arr[i].x&&y===arr[i].y)return true;
    return false;
  };

  var createFood=function(){
    do{
      foodX=Math.floor(Math.random()*(width/snakeSize));
      foodY=Math.floor(Math.random()*(height/snakeSize));
    }while(checkCollision(foodX,foodY,mySnake.snake));
  };
  var isThereFood=(hx,hy)=>hx===foodX&&hy===foodY;

  var updateGame=function(){
    if(isGameOver){ draw.gameOverOverlay(); return; }
    areaClear(); mySnake.newPos();
    if(isGameOver){ draw.gameOverOverlay(); return; }
    mySnake.display(); draw.food(foodX,foodY);
    if(isPaused)draw.pauseOverlay();
  };

  return{init,start,togglePause};
})();
