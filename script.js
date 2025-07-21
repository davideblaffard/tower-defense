const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let selectedTowerType = "basic"; // default

document.querySelectorAll(".ui button").forEach(btn => {
  btn.addEventListener("click", () => {
    selectedTowerType = btn.dataset.type;
  });
});

let money = 300;
let lives = 10;
let score = 0;
let gameOver = false;
let waveNumber = 0;
let enemiesToSpawn = 0;
let spawnCooldown = 0;
let waveInProgress = false;

const towerCosts = {
  basic: 100,
  rapid: 150
};


const waypoints = [
  { x: 0, y: 200 },
  { x: 200, y: 200 },
  { x: 200, y: 400 },
  { x: 600, y: 400 },
  { x: 600, y: 100 },
  { x: 800, y: 100 }
];

const TILE_SIZE = 40;
const GRID_WIDTH = canvas.width / TILE_SIZE;
const GRID_HEIGHT = canvas.height / TILE_SIZE;

let enemies = [];
let towers = [];
let bullets = [];

class Enemy {
  constructor() {
    this.waypointIndex = 0;
    this.x = waypoints[0].x;
    this.y = waypoints[0].y;
    this.size = TILE_SIZE / 2;
    this.speed = 1;
    this.health = 100;
  }

  update() {
    const target = waypoints[this.waypointIndex];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 1) {
      this.waypointIndex++;
      if (this.waypointIndex >= waypoints.length) {
        this.health = 0; // segna come morto
      }
    } else {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }
  }

  draw() {
  ctx.fillStyle = "#d63c3c";
  ctx.fillRect(this.x, this.y, this.size, this.size);

  // bordo pixel
  ctx.strokeStyle = "#5a1212";
  ctx.strokeRect(this.x, this.y, this.size, this.size);

  // barra salute
  ctx.fillStyle = "limegreen";
  ctx.fillRect(this.x, this.y - 5, this.size * (this.health / 100), 3);
  }
}


class Tower {
  constructor(x, y, type = "basic") {
    this.x = x;
    this.y = y;
    this.type = type;
    this.range = type === "rapid" ? 80 : 120;
    this.cooldownMax = type === "rapid" ? 20 : 60;
    this.damage = type === "rapid" ? 20 : 50;
    this.cooldown = 0;
  }

  update() {
    if (this.cooldown > 0) {
      this.cooldown--;
      return;
    }

    for (let enemy of enemies) {
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.range) {
        bullets.push(new Bullet(this.x, this.y, enemy, this.damage));
        this.cooldown = this.cooldownMax;
        break;
      }
    }
  }

  draw() {
  ctx.fillStyle = this.type === "rapid" ? "#a871ff" : "#3c82ff";
  ctx.fillRect(this.x - TILE_SIZE / 2, this.y - TILE_SIZE / 2, TILE_SIZE, TILE_SIZE);

  // contorno pixel
  ctx.strokeStyle = "#222";
  ctx.strokeRect(this.x - TILE_SIZE / 2, this.y - TILE_SIZE / 2, TILE_SIZE, TILE_SIZE);
  }
}


class Bullet {
  constructor(x, y, target, damage) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.speed = 5;
    this.damage = damage;
  }

  update() {
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 5) {
      this.target.health -= this.damage;
      this.destroyed = true;
    } else {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }
  }

  draw() {
  ctx.fillStyle = "#ffff33";
  ctx.fillRect(this.x - 2, this.y - 2, 4, 4);
}

}

// FUNCTIONS & EVENTLISTENERS

function updateUi() {
  document.getElementById("moneyDisplay").textContent = `💰 ${money}`;
  document.getElementById("livesDisplay").textContent = `❤️ ${lives}`;
  document.getElementById("scoreDisplay").textContent = `🏆 ${score}`;
  document.getElementById("waveDisplay").textContent = `🌊 Wave: ${waveNumber}`;

}

function spawnEnemy() {
  enemies.push(new Enemy());
}

function startWave() {
  waveNumber++;
  enemiesToSpawn = 5 + waveNumber * 2; // ogni wave più nemici
  spawnCooldown = 60;
  waveInProgress = true;
}

canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const snappedX = Math.floor(x / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
  const snappedY = Math.floor(y / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;

  placeTower(snappedX, snappedY, selectedTowerType);
});

function placeTower(x, y, type = "basic") {
  const cost = towerCosts[type];
  if (money < cost) {
    alert("Non hai abbastanza soldi!");
    return;
  }

  towers.push(new Tower(x, y, type));
  money -= cost;
}


function drawPath() {
  ctx.strokeStyle = "#444";
  ctx.lineWidth = TILE_SIZE;
  ctx.beginPath();
  ctx.moveTo(waypoints[0].x, waypoints[0].y);
  for (let i = 1; i < waypoints.length; i++) {
    ctx.lineTo(waypoints[i].x, waypoints[i].y);
  }
  ctx.stroke();

  // Bordo stradina
  ctx.strokeStyle = "#888";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(waypoints[0].x, waypoints[0].y);
  for (let i = 1; i < waypoints.length; i++) {
    ctx.lineTo(waypoints[i].x, waypoints[i].y);
  }
  ctx.stroke();
}

 function drawBackgroundGrid() {
  for (let x = 0; x < GRID_WIDTH; x++) {
    for (let y = 0; y < GRID_HEIGHT; y++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? "#1a1a1a" : "#222";
      ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }
}

// GAMELOOOOOOOP
function gameLoop() {

    if (gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "white";
        ctx.font = "48px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
        ctx.font = "24px sans-serif";
        ctx.fillText(`Punteggio: ${score}`, canvas.width / 2, canvas.height / 2 + 40);
        return;
    }

    updateUi();

    if (waveInProgress && enemiesToSpawn > 0) {
        if (spawnCooldown <= 0) {
            const newEnemy = new Enemy();
            newEnemy.health += waveNumber * 10;
            newEnemy.speed += waveNumber * 0.1;
            enemies.push(newEnemy);
            enemiesToSpawn--;
            spawnCooldown = 30;
        } else {
            spawnCooldown--;
        }
        }

        // Quando tutti i nemici sono morti e non ce ne sono da spawnare
        if (waveInProgress && enemiesToSpawn === 0 && enemies.length === 0) {
        waveInProgress = false;
        setTimeout(() => {
            if (!gameOver) startWave();
        }, 2000); // pausa tra le ondate
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackgroundGrid();
    drawPath();
  // Aggiorna nemici
  enemies.forEach((enemy, i) => {
  enemy.update();

  if (enemy.waypointIndex >= waypoints.length) {
    lives--;
    enemies.splice(i, 1);
    if (lives <= 0) {
        gameOver = true;
    }
    return; // esci: il nemico è arrivato alla fine
}

if (enemy.health <= 0) {
    money += 25;
    score += 100;
    enemies.splice(i, 1);
    return; // esci: il nemico è stato ucciso
}

enemy.draw();
}); // disegna solo i nemici vivi e in campo


  // Aggiorna torri
  towers.forEach(tower => {
    tower.update();
    tower.draw();
  });

  // Aggiorna proiettili
  bullets.forEach((bullet, i) => {
    bullet.update();
    if (bullet.destroyed) {
      bullets.splice(i, 1);
    } else {
      bullet.draw();
    }


  });

  requestAnimationFrame(gameLoop);
}

setInterval(spawnEnemy, 2000); // nemici ogni 2 secondi
gameLoop();
startWave();

