const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
resizeCanvas();

const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const pauseBtn = document.getElementById('pauseBtn');
const muteBtn = document.getElementById('muteBtn');
const restartBtn = document.getElementById('restartBtn');
const themeSel = document.getElementById('theme');
const difficultySel = document.getElementById('difficulty');

// audio
const AudioCtx = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioCtx();
let muted = false;

function beep(freq, time=0.08, type='sine', gain=0.06){
  if(muted) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.value = gain;
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + time);
}

// game state
let running = true;
let balls = [], paddle, blocks = [];
let score=0, lives=3;
let speedFactor = 1.0;

function rand(min,max){return Math.random()*(max-min)+min}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}

class Paddle {
  constructor(){
    this.w=120; this.h=14;
    this.x=(canvas.width-this.w)/2; this.y=canvas.height-40;
    this.speed=8;
    this.color='#fff';
  }
  draw(){ctx.fillStyle=this.color;ctx.fillRect(this.x,this.y,this.w,this.h);}
}
class Ball {
  constructor(x,y,vx,vy,r=10){this.x=x;this.y=y;this.vx=vx*speedFactor;this.vy=vy*speedFactor;this.r=r;this.alive=true;}
  draw(){ctx.beginPath();ctx.arc(this.x,this.y,this.r,0,Math.PI*2);ctx.fillStyle='#ffdd57';ctx.fill();}
  update(dt){
    this.x+=this.vx*dt; this.y+=this.vy*dt;
    if(this.x<this.r||this.x>canvas.width-this.r){this.vx*=-1;beep(220,0.04);}
    if(this.y<this.r){this.vy*=-1;beep(260,0.04);}
    if(this.y+this.r>paddle.y&&this.x>paddle.x&&this.x<paddle.x+paddle.w&&this.vy>0){
      this.vy*=-1; beep(440,0.03); addScore(5);
    }
    if(this.y-this.r>canvas.height){this.alive=false; beep(110,0.3);}
    for(let i=blocks.length-1;i>=0;i--){
      let b=blocks[i];
      if(this.x> b.x&&this.x<b.x+b.w&&this.y> b.y&&this.y<b.y+b.h){
        this.vy*=-1; addScore(10); blocks.splice(i,1); break;
      }
    }
  }
}
class Block{constructor(x,y,w,h){this.x=x;this.y=y;this.w=w;this.h=h;}
  draw(){ctx.fillStyle='#7bed9f';ctx.fillRect(this.x,this.y,this.w,this.h);}}

function initLevel(){
  blocks=[]; balls=[];
  let rows=4,cols=8; let bw=(canvas.width-80)/cols;
  for(let r=0;r<rows;r++){for(let c=0;c<cols;c++){blocks.push(new Block(40+c*bw,60+r*36,bw-8,28));}}
  balls.push(new Ball(canvas.width/2,canvas.height-120,rand(-150,150)/100,-2.8,10));
  paddle=new Paddle(); score=0; lives=3;
}

function addScore(n){score=Math.max(0,score+n);scoreEl.textContent=score;}
function updateHUD(){scoreEl.textContent=score;livesEl.textContent=lives;}

let keys={};
window.addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;});
window.addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});

function loop(){
  if(!running){requestAnimationFrame(loop);return;}
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(keys['arrowleft']||keys['a'])paddle.x=Math.max(0,paddle.x-paddle.speed);
  if(keys['arrowright']||keys['d'])paddle.x=Math.min(canvas.width-paddle.w,paddle.x+paddle.speed);
  for(let b of balls)b.update(1);
  balls=balls.filter(b=>b.alive);
  if(balls.length===0){lives--;updateHUD();if(lives<=0){running=false;alert('Game Over! Score:'+score);}else{balls.push(new Ball(canvas.width/2,canvas.height-120,2,-2.8,10));}}
  if(blocks.length===0){initLevel();addScore(500);}
  for(let b of blocks)b.draw();
  paddle.draw();
  for(let b of balls)b.draw();
  requestAnimationFrame(loop);
}

pauseBtn.addEventListener('click',()=>{running=!running;pauseBtn.textContent=running?'Pause':'Resume';});
muteBtn.addEventListener('click',()=>{muted=!muted;muteBtn.textContent=muted?'Unmute':'Mute';});
restartBtn.addEventListener('click',()=>{initLevel();running=true;});
themeSel.addEventListener('change',()=>{
  document.body.classList.remove('theme-classic','theme-neon','theme-space');
  if(themeSel.value==='neon')document.body.classList.add('theme-neon');
  if(themeSel.value==='space')document.body.classList.add('theme-space');
});
difficultySel.addEventListener('change',()=>{
  if(difficultySel.value==='easy') speedFactor=2.0;
  if(difficultySel.value==='medium') speedFactor=5.0;
  if(difficultySel.value==='hard') speedFactor=10.0;
});

function resizeCanvas(){canvas.width=window.innerWidth;canvas.height=window.innerHeight-60;}
window.addEventListener('resize',resizeCanvas);

function start(){initLevel();running=true;requestAnimationFrame(loop);}
start();updateHUD();
