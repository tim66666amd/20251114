let circles = [];
let explosions = [];
let score = 0;
let explosionSound; // 新增：爆破音效變數

// 新增計時器相關變數
let gameStarted = false;
let timer = 30; // 秒
let startTime = 0;
let showStartText = true;

// 爆炸效果類別
class Explosion {
  constructor(x, y, color) {
    this.particles = [];
    this.lifetime = 40; // 爆炸持續幀數
    for (let i = 0; i < 20; i++) {
      let angle = random(TWO_PI);
      let speed = random(2, 7);
      let vx = cos(angle) * speed;
      let vy = sin(angle) * speed;
      let r = random(6, 16);
      this.particles.push({
        x, y,
        vx, vy,
        r,
        alpha: 255,
        color: color
      });
    }
    this.age = 0;
  }
  update() {
    for (let p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.alpha *= 0.93;
    }
    this.age++;
  }
  draw() {
    for (let p of this.particles) {
      let col = color(p.color);
      col.setAlpha(p.alpha);
      fill(col);
      noStroke();
      ellipse(p.x, p.y, p.r, p.r);
    }
  }
  isDone() {
    return this.age > this.lifetime;
  }
}
let colors = [
  '#52b788', '#74c69d', '#95d5b2', '#b7e4c7',
  '#4361ee', '#4895ef', '#4cc9f0'
];

// --- 新增排行榜相關變數 ---
let leaderboard = [];
const LB_KEY = 'p5_leaderboard_v1';
let leaderboardSaved = false;

function preload() {
  // 載入爆破音效（檔名為 y826.mp3，請放在同一資料夾）
  explosionSound = loadSound('y826.mp3');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  background('#0d1b2a');
  setupCircles();
  loadLeaderboard(); // 載入排行榜
}

function setupCircles() {
  circles = [];
  let cols = 15;
  let rows = 8;
  let cellW = width / cols;
  let cellH = height / rows;
  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let x = c * cellW + random(cellW * 0.2, cellW * 0.8);
      let y = r * cellH + random(cellH * 0.2, cellH * 0.8);
      let w = random(40, 120);
      let h = w;
      let alpha = random(50, 255);
      let speed = map(w, 40, 120, 1, 8);
      let color = colors[int(random(colors.length))];
      circles.push({ x, y, w, h, alpha, speed, color });
      idx++;
      if (idx >= 80) break;
    }
    if (idx >= 80) break;
  }
}

function draw() {
  background('#c1d3fe');
  noStroke();

  // 遊戲未開始時顯示倒數
  if (!gameStarted) {
    fill(30, 30, 30, 220);
    rect(width/2-180, height/2-90, 360, 180, 30);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(38);
    text("點擊開始遊戲", width/2, height/2-30);
    textSize(24);
    text("30秒內點擊圓圈得分", width/2, height/2+20);
    return;
  }

  // 遊戲進行中
  // 計算剩餘時間
  let elapsed = (millis() - startTime) / 1000;
  let timeLeft = max(0, timer - floor(elapsed));

  // 畫圓
  for (let c of circles) {
    let col = color(c.color);
    col.setAlpha(c.alpha);
    fill(col);
    ellipse(c.x, c.y, c.w, c.h);

    // 右上角圓角正方形
    let boxSize = c.w / 7;
    let margin = 2;
    let angle = -PI/4;
    let radius = c.w/2 - boxSize/2 - margin;
    let boxCenterX = c.x + cos(angle) * radius;
    let boxCenterY = c.y + sin(angle) * radius;
    let boxX = boxCenterX - boxSize/2;
    let boxY = boxCenterY - boxSize/2;
    noStroke();
    fill(255, 90);
    rect(boxX, boxY, boxSize, boxSize, boxSize * 0.35);

    c.y -= c.speed * 0.5; // 將速度減慢（原本是0.9，現在改為0.5）
    if (c.y < -c.h/2) {
      c.y = height + c.h/2;
    }
  }

  // 畫爆炸
  for (let i = explosions.length - 1; i >= 0; i--) {
    let e = explosions[i];
    e.update();
    e.draw();
    if (e.isDone()) {
      explosions.splice(i, 1);
    }
  }

    // 計分器與倒數
  // 左上角：時間
  fill(30, 30, 30, 200);
  noStroke();
  rect(18, 18, 130, 38, 12); // 時間區塊
  fill(255);
  textSize(24);
  textAlign(LEFT, TOP);
  text('Time: ' + timeLeft, 28, 26);

  // 右上角：分數
  fill(30, 30, 30, 200);
  noStroke();
  rect(width - 148, 18, 130, 38, 12); // 分數區塊
  fill(255);
  textSize(24);
  textAlign(RIGHT, TOP);
  text('Score: ' + score, width - 28, 26);

  // 時間到顯示結束
  if (timeLeft <= 0) {
    // 先顯示結束畫面
    fill(30, 30, 30, 220);
    rect(width/2-180, height/2-90, 360, 180, 30);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(38);
    text("時間到！", width/2, height/2-30);
    textSize(24);
    text("恭喜你獲得：" + score, width/2, height/2+20);

    // 只在第一次達到結束時詢問名稱並儲存排行榜
    if (!leaderboardSaved) {
      let name = prompt('遊戲結束！輸入名稱以儲存分數（最多 5 名）', '玩家');
      if (name === null) name = '匿名';
      addToLeaderboard(name.trim().substring(0, 20), score);
      leaderboardSaved = true;
    }

    // 在結束畫面下方或左側顯示排行榜
    drawLeaderboard(width/2 - 180, height/2 + 110);

    noLoop();
  }
}

function mousePressed() {
  // 遊戲未開始時，點擊開始
  if (!gameStarted) {
    gameStarted = true;
    score = 0;
    setupCircles();
    explosions = [];
    startTime = millis();
    loop();
    return;
  }

  // 遊戲結束時不再加分
  let elapsed = (millis() - startTime) / 1000;
  if (elapsed >= timer) return;

  // 定義扣分顏色集合（藍色系）
  const penalize = ['#4361ee', '#4895ef', '#4cc9f0'];

  for (let i = circles.length - 1; i >= 0; i--) {
    let c = circles[i];
    let d = dist(mouseX, mouseY, c.x, c.y);
    if (d < c.w / 2) {
      // 產生爆炸效果並移除圓
      explosions.push(new Explosion(c.x, c.y, c.color));
      circles.splice(i, 1);

      // 播放爆破音效（若已載入）
      if (explosionSound && explosionSound.isLoaded && explosionSound.isLoaded()) {
        explosionSound.play();
      } else if (explosionSound) {
        // 若尚未 isLoaded（保險），嘗試直接播放
        try { explosionSound.play(); } catch (e) {}
      }

      // 根據顏色加或扣分
      if (penalize.includes(c.color)) {
        score = max(0, score - 1);
      } else {
        score++;
      }
      break;
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  background('#0d1b2a');
}

// 新增：載入 / 儲存 / 新增排行榜函式
function loadLeaderboard() {
  try {
    const raw = localStorage.getItem(LB_KEY);
    if (raw) leaderboard = JSON.parse(raw);
  } catch (e) {
    leaderboard = [];
  }
}

function saveLeaderboard() {
  try {
    localStorage.setItem(LB_KEY, JSON.stringify(leaderboard));
  } catch (e) {
    // ignore
  }
}

function addToLeaderboard(name, sc) {
  leaderboard.push({ name: name || '匿名', score: sc, time: Date.now() });
  leaderboard.sort((a, b) => b.score - a.score || a.time - b.time);
  leaderboard = leaderboard.slice(0, 5); // 只保留前 5 名
  saveLeaderboard();
}

function drawLeaderboard(x, y) {
  fill(30, 30, 30, 220);
  rect(x, y, 320, 28 + leaderboard.length * 28, 12);
  fill(255);
  textSize(20);
  textAlign(LEFT, TOP);
  text('排行榜（前 5 名）', x + 12, y + 6);
  textSize(16);
  for (let i = 0; i < leaderboard.length; i++) {
    let item = leaderboard[i];
    text(`${i + 1}. ${item.name} — ${item.score}`, x + 12, y + 36 + i * 24);
  }
}
