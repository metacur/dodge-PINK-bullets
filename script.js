// Canvas要素と描画コンテキストを取得
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ボタンやUI要素を取得
const startBtn = document.getElementById("startBtn");
const retryBtn = document.getElementById("retryBtn");
const scoreDisplay = document.getElementById("score");
const rankingDisplay = document.getElementById("ranking");

// ゲームに必要な変数を宣言
let player, enemies, particles;
let score = 0, gameOver = false, startTime = 0;
let animationId;

// マウスの動きに合わせてプレイヤーの位置を更新
canvas.addEventListener("mousemove", e => {
  const rect = canvas.getBoundingClientRect();
  player.x = e.clientX - rect.left;
  player.y = e.clientY - rect.top;
});

// ゲームの初期化処理
function initGame() {
  // プレイヤーを画面中央に配置
  player = { x: canvas.width / 2, y: canvas.height / 2, r: 15 };
  enemies = [];       // 敵の配列を初期化
  particles = [];     // 粒子の配列を初期化
  score = 0;          // スコアを初期化
  gameOver = false;   // ゲームオーバーフラグを解除
  startTime = Date.now(); // ゲーム開始時間を記録
  spawnEnemy();       // 最初の敵を出現

  // ゲームループを一度だけ開始（重複防止）
  // - setInterval() は呼ぶたびに新しいループを追加してしまう
  // - 例えば initGame() を何度も呼ぶと、複数のループが同時に動き、描画が重複
  // - window.gameLoopStarted フラグを使うことで、一度だけループを開始し、以降は再起動しないように制御

  if (!window.gameLoopStarted) {
    setInterval(gameLoop, 50); // 20fpsでループ
    window.gameLoopStarted = true;
  }
}

// ゲームループ（定期的に画面を更新）
// - Canvasは静的な描画なので、動きを表現するため定期的な再描画が必要
function gameLoop() {
  if (gameOver) return; // ゲームオーバーなら処理停止
  ctx.clearRect(0, 0, canvas.width, canvas.height); // 画面クリア
  drawPlayer();     // プレイヤー描画
  drawEnemies();    // 敵描画
  drawParticles();  // 粒子描画
  updateEnemies();  // 敵の動きと衝突判定
  updateParticles();// 粒子の動き
  updateScore();    // スコア更新
}

// 敵を1体生成する関数
function spawnEnemy() {
  const size = Math.random() * 20 + 10; // 敵のサイズ
  const speed = 5 + Math.random() * 2;  // 敵の速度
  const angle = Math.random() * Math.PI * 2; // 移動方向
  enemies.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    dx: Math.cos(angle) * speed,
    dy: Math.sin(angle) * speed,
    r: size,
    color: "#ff66cc"
  });
}

// プレイヤーを描画する関数
function drawPlayer() {
  if (!player) return;
  ctx.fillStyle = "cyan";
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.fill();
}

// 敵を描画する関数
function drawEnemies() {
  enemies.forEach(e => {
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = e.color;
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

// 粒子を描画する関数
function drawParticles() {
  particles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  });
}

// 粒子の位置と寿命を更新
function updateParticles() {
  particles.forEach(p => {
    p.x += p.dx;
    p.y += p.dy;
    p.life--;
  });
  // 寿命が尽きた粒子を削除
  particles = particles.filter(p => p.life > 0);
}

// 敵の動きと衝突判定を更新
function updateEnemies() {
  enemies.forEach(e => {
    e.x += e.dx;
    e.y += e.dy;

    let bounced = false;

    // 壁にぶつかったら反射
    if (e.x - e.r < 0 || e.x + e.r > canvas.width) {
      e.dx *= -1;
      bounced = true;
    }
    if (e.y - e.r < 0 || e.y + e.r > canvas.height) {
      e.dy *= -1;
      bounced = true;
    }

    // 反射時に粒子を生成
    if (bounced) createParticles(e.x, e.y, e.color);

    // プレイヤーとの衝突判定
    const dx = e.x - player.x;
    const dy = e.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < e.r + player.r) {
      endGame(); // 衝突したらゲーム終了
    }
  });
}

// 粒子を放射状に生成する関数
function createParticles(x, y, color) {
  for (let i = 0; i < 10; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3;
    particles.push({
      x, y,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      r: Math.random() * 3 + 2,
      life: 30,
      color
    });
  }
}

// スコアを更新する関数
function updateScore() {
  const newScore = Math.floor((Date.now() - startTime) / 1000);
  if (newScore !== score) {
    score = newScore;
    scoreDisplay.textContent = `Score: ${score}`;
    scoreDisplay.style.transform = "scale(1.3)";
    setTimeout(() => scoreDisplay.style.transform = "scale(1)", 100);

    // スコアが5の倍数なら敵を追加
    if (score % 5 === 0) spawnEnemy();
  }
}

/* 
より滑らかで効率的な描画ループ（現在は未使用）
 - もし使用する場合は、setInterval() を削除し、update() を initGame() から呼び出す

function update() {
  if (gameOver) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawPlayer();
  drawEnemies();
  drawParticles();
  updateEnemies();
  updateParticles();
  updateScore();
  animationId = requestAnimationFrame(update);
}
*/

// ゲーム終了処理
function endGame() {
  gameOver = true;
  cancelAnimationFrame(animationId); // アニメーション停止
  retryBtn.style.display = "block"; // リトライボタン表示
  saveScore(score);                 // スコア保存
  showRanking();                    // ランキング表示
}

// スコアをローカルストレージに保存
function saveScore(s) {
  let scores = JSON.parse(localStorage.getItem("scoreRanking") || "[]");
  scores.push(s);
  scores.sort((a, b) => b - a); // 降順に並び替え
  scores = scores.slice(0, 3);  // 上位3件のみ保持
  localStorage.setItem("scoreRanking", JSON.stringify(scores));
}

// ランキングを表示
function showRanking() {
  const scores = JSON.parse(localStorage.getItem("scoreRanking") || "[]");
  rankingDisplay.innerHTML = "Ranking:<br>" + scores.map((s, i) => `${i + 1}位：${s}`).join("<br>");
}

// スタートボタンのクリックイベント
startBtn.onclick = () => {
  startBtn.style.display = "none";
  retryBtn.style.display = "none";
  canvas.style.display = "block";
  document.getElementById("ui").style.display = "flex";
  initGame();
};

// リトライボタンのクリックイベント
retryBtn.onclick = () => {
  retryBtn.style.display = "none";
  canvas.style.display = "block";
  document.getElementById("ui").style.display = "flex";
  initGame();
};