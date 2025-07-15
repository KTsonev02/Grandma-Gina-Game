const tileSize = 30;
const rows = 21;
const cols = 21;
let maze = [];
let player = { x: 1, y: 1 };
let gina = { x: cols - 2, y: rows - 2 };
let goal = { x: cols - 2, y: rows - 2 };
let gameRunning = true;
let interval;

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const statusText = document.getElementById("status");

// Sounds
const bgMusic = document.getElementById("bgMusic");
const winSound = document.getElementById("winSound");
const loseSound = document.getElementById("loseSound");

// Images
const playerImg = new Image();
playerImg.src = "./assets/player.png";

const ginaImg = new Image();
ginaImg.src = "./assets/gina.png";

const goalImg = new Image();
goalImg.src = "./assets/goal.png";

let assetsLoaded = 0;
const totalAssets = 3;

[playerImg, ginaImg, goalImg].forEach(img => {
  img.onload = () => {
    assetsLoaded++;
    if (assetsLoaded === totalAssets) {
// All images are loaded - we can start the game
      initGame();
    }
  };
  img.onerror = () => {
    console.warn("Could not load image: " + img.src);
    assetsLoaded++;
    if (assetsLoaded === totalAssets) {
      initGame();
    }
  };
});

// Initialize the game (without starting it if the images are not loaded yet)
function initGame() {
  maze = generateMaze(cols, rows);
  player = { x: 1, y: 1 };
  gina = { x: cols - 2, y: rows - 2 };
  goal = { x: cols - 2, y: rows - 2 };
  gameRunning = true;
  
  clearInterval(interval);
  interval = setInterval(gameLoop, 200);
  
// Start the music (with try/catch)
  if (bgMusic) {
    bgMusic.currentTime = 0;
    bgMusic.loop = true;
    bgMusic.play().catch(e => console.log("Failed to play music:", e));
  }
  
  // Добавяне на event listeners (премахваме предишните, за да няма дублиране)
  document.removeEventListener("keydown", handleKeyPress);
  document.addEventListener("keydown", handleKeyPress);
  
  const restartBtn = document.getElementById("restartBtn");
  if (restartBtn) {
    restartBtn.removeEventListener("click", restartGame);
    restartBtn.addEventListener("click", restartGame);
  }

  statusText.textContent = "Go to the final!";
  statusText.style.color = "#2c3e50";

  draw();
}

// Generate maze
function generateMaze(w, h) {
  const maze = Array.from({ length: h }, () => Array(w).fill(1));

  function carve(x, y) {
    maze[y][x] = 0;
    const directions = [[0,-2],[0,2],[-2,0],[2,0]];
    directions.sort(() => Math.random() - 0.5);

    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      if (ny > 0 && ny < h-1 && nx > 0 && nx < w-1 && maze[ny][nx] === 1) {
        maze[y + dy/2][x + dx/2] = 0;
        carve(nx, ny);
      }
    }
  }

  carve(1, 1);

  for (let y = 1; y < h-1; y++) {
    for (let x = 1; x < w-1; x++) {
      if (maze[y][x] === 1 && Math.random() < 0.1) {
        maze[y][x] = 0;
      }
    }
  }

  if (!isPathToGoal(1, 1, maze)) {
    return generateMaze(w, h);
  }

  return maze;
}

function isPathToGoal(startX, startY, maze) {
  const visited = new Set();
  const queue = [{x: startX, y: startY}];
  const goalX = maze[0].length - 2;
  const goalY = maze.length - 2;

  while (queue.length > 0) {
    const {x, y} = queue.shift();
    
    if (x === goalX && y === goalY) return true;
    
    const key = `${x},${y}`;
    if (visited.has(key)) continue;
    visited.add(key);

    const directions = [[0,1],[1,0],[0,-1],[-1,0]];
    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      if (ny >= 0 && ny < maze.length && nx >= 0 && nx < maze[0].length && maze[ny][nx] === 0) {
        queue.push({x: nx, y: ny});
      }
    }
  }
  
  return false;
}


function handleKeyPress(e) {
      move(e.key);
    }

    function move(direction) {
      if (!gameRunning) return;

      let dx = 0, dy = 0;
      if (direction === "ArrowUp") dy = -1;
      else if (direction === "ArrowDown") dy = 1;
      else if (direction === "ArrowLeft") dx = -1;
      else if (direction === "ArrowRight") dx = 1;
      else return;

      const newX = player.x + dx;
      const newY = player.y + dy;

      if (newX >= 0 && newX < cols && newY >= 0 && newY < rows && maze[newY][newX] === 0) {
        player.x = newX;
        player.y = newY;
        draw();
      }
    }

function moveGina() {
  const directions = [
    {dx:0, dy:-1}, {dx:0, dy:1},
    {dx:-1, dy:0}, {dx:1, dy:0}
  ];

  let bestDir = null;
  let minDist = Infinity;

  for (const dir of directions) {
    const nx = gina.x + dir.dx;
    const ny = gina.y + dir.dy;
    
    if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && maze[ny][nx] === 0) {
      const dist = Math.abs(player.x - nx) + Math.abs(player.y - ny);
      if (dist < minDist) {
        minDist = dist;
        bestDir = dir;
      }
    }
  }

  if (bestDir) {
    gina.x += bestDir.dx;
    gina.y += bestDir.dy;
  }
}

function gameLoop() {
  if (!gameRunning) return;
  
  moveGina();
  draw();
  checkGameOver();
}

function checkGameOver() {
  if (player.x === goal.x && player.y === goal.y) {
    gameRunning = false;
    clearInterval(interval);
    statusText.textContent = "Successfully escaped! 🎉";
    statusText.style.color = "#27ae60";
    showResult("./assets/win.gif");
    if (winSound) winSound.play().catch(() => {});
    if (bgMusic) bgMusic.pause();
    return;
  }

  if ((player.x === gina.x && player.y === gina.y) || 
      (Math.abs(player.x - gina.x) <= 1 && Math.abs(player.y - gina.y) <= 1)) {
    gameRunning = false;
    clearInterval(interval);
    statusText.textContent = "Grandma Gina got you! 💀";
    statusText.style.color = "#e74c3c";
    showResult("./assets/lose.gif");
    if (loseSound) loseSound.play().catch(() => {});
    if (bgMusic) bgMusic.pause();
  }
}

function showResult(gifSrc) {
  const gifContainer = document.getElementById("gifContainer");
  const resultGif = document.getElementById("resultGif");
  
  if (!gifContainer || !resultGif) return;
  
  resultGif.src = gifSrc;
  gifContainer.style.display = "block";
  
  setTimeout(() => {
    gifContainer.style.display = "none";
  }, 3000);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Make maze
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      ctx.fillStyle = maze[y][x] === 1 ? "#34495e" : "#ecf0f1";
      ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
    }
  }

  // We draw the target with a photo
  if (goalImg.complete && goalImg.naturalWidth !== 0) {
    ctx.drawImage(goalImg, goal.x * tileSize, goal.y * tileSize, tileSize, tileSize);
  } else {
    ctx.fillStyle = "#2ecc71";
    ctx.fillRect(goal.x * tileSize, goal.y * tileSize, tileSize, tileSize);
  }
  ctx.fillStyle = "#000";
  ctx.font = "bold 12px Arial";
  ctx.fillText("F", goal.x * tileSize + 5, goal.y * tileSize + 18);

  if (playerImg.complete && playerImg.naturalWidth !== 0) {
    ctx.drawImage(playerImg, player.x * tileSize, player.y * tileSize, tileSize, tileSize);
  } else {
    ctx.fillStyle = "#3498db";
    ctx.fillRect(player.x * tileSize, player.y * tileSize, tileSize, tileSize);
  }
  ctx.fillStyle = "#fff";
  ctx.font = "bold 12px Arial";
  ctx.fillText("I", player.x * tileSize + 10, player.y * tileSize + 18);

  if (ginaImg.complete && ginaImg.naturalWidth !== 0) {
    ctx.drawImage(ginaImg, gina.x * tileSize, gina.y * tileSize, tileSize, tileSize);
  } else {
    ctx.fillStyle = "#e74c3c";
    ctx.fillRect(gina.x * tileSize, gina.y * tileSize, tileSize, tileSize);
  }
  ctx.fillStyle = "#fff";
  ctx.font = "bold 12px Arial";
  ctx.fillText("G", gina.x * tileSize + 5, gina.y * tileSize + 18);
}

function restartGame() {
  if (bgMusic) {
    bgMusic.currentTime = 0;
    bgMusic.play().catch(e => console.log("Failed to play music:", e));
  }
  statusText.textContent = "Мake it to the finish line";
  statusText.style.color = "#2c3e50";
  initGame();
}

// If for some reason the images are not loaded, we start with a timeout
setTimeout(() => {
  if (assetsLoaded < totalAssets) {
    console.warn("Images were not loaded in time, I am starting the game without them.");
    initGame();
  }
}, 3000);


const soundBtn = document.getElementById("soundBtn");

bgMusic.muted = false;
bgMusic.play();
soundBtn.textContent = "🔇 Mute";

soundBtn.addEventListener("click", () => {
  if (bgMusic.paused) {
    bgMusic.muted = false;
    bgMusic.play();
    soundBtn.textContent = "🔇 Mute";
  } else {
    bgMusic.muted = true;
    bgMusic.pause();
    soundBtn.textContent = "🔊 Turn on sound";
  }
});

