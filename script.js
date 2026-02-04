console.log("SCRIPT VERSION 2026-02-03");

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const stage = document.querySelector(".stage");
const hud = document.querySelector(".hud");
const hudToggle = document.querySelector(".hud-toggle");
const towerStatus = document.getElementById("towerStatus");
const towerStats = document.getElementById("towerStats");
const upgradeDamageBtn = document.getElementById("upgradeDamage");
const upgradeRangeBtn = document.getElementById("upgradeRange");
const upgradeSpeedBtn = document.getElementById("upgradeSpeed");
const towerDeselectBtn = document.getElementById("towerDeselect");
const waveProgressFill = document.getElementById("waveProgressFill");
const waveProgressText = document.getElementById("waveProgressText");
const moneyCompact = document.getElementById("moneyCompact");
const livesCompact = document.getElementById("livesCompact");
const scoreCompact = document.getElementById("scoreCompact");
const waveCompact = document.getElementById("waveCompact");
const towerPanel = document.querySelector(".tower-panel");
const toast = document.getElementById("toast");
let lastError = "";

let TILE_SIZE = 40;
let GRID_WIDTH = 20;
let GRID_HEIGHT = 15;
const BASE_TILE_SIZE = 40;
let lastTileSize = TILE_SIZE;

let enemies = [];
let towers = [];
let bullets = [];
let selectedTower = null;
let hoverTile = null;

/**** RESIZE ****/
function resizeCanvas() {
  const rect = stage.getBoundingClientRect();
  const width = Math.floor(rect.width);
  const height = Math.floor(rect.height);

  if (!width || !height) {
    return;
  }

  canvas.width = width;
  canvas.height = height;

  TILE_SIZE = canvas.width / 20;
  GRID_WIDTH = 20;
  GRID_HEIGHT = Math.floor(canvas.height / TILE_SIZE);
  updateGridSize();
  const scale = lastTileSize > 0 ? TILE_SIZE / lastTileSize : 1;
  rescaleEntities(scale);
  lastTileSize = TILE_SIZE;
}

function updateGridSize() {
  GRID_WIDTH = Math.floor(canvas.width / TILE_SIZE);
  GRID_HEIGHT = Math.floor(canvas.height / TILE_SIZE);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);
const resizeObserver = new ResizeObserver(resizeCanvas);
resizeObserver.observe(stage);

if (hud && hudToggle) {
  hudToggle.addEventListener("click", () => {
    hud.classList.toggle("is-collapsed");
    const isCollapsed = hud.classList.contains("is-collapsed");
    hudToggle.setAttribute("aria-expanded", String(!isCollapsed));
    resizeCanvas();
  });
}

window.addEventListener("error", (event) => {
  lastError = event?.message || "Unknown error";
});
/**** FINE RESIZE ****/

let selectedTowerType = "basic"; // default
const towerButtons = Array.from(document.querySelectorAll(".controls button"));
towerButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    selectedTowerType = btn.dataset.type;
    towerButtons.forEach(button => button.classList.remove("is-selected"));
    btn.classList.add("is-selected");
  });
});
towerButtons.find(btn => btn.dataset.type === selectedTowerType)?.classList.add("is-selected");

let money = 300;
let lives = 10;
let score = 0;
let gameOver = false;
let waveNumber = 0;
let enemiesToSpawn = 0;
let spawnCooldown = 0;
let waveInProgress = false;
let totalEnemiesThisWave = 0;

const towerCosts = {
  basic: 100,
  rapid: 150
};


class Enemy {
  constructor() {
    const typeData = getEnemyType();
    this.waypoints = getWaypoints();
    this.waypointIndex = 0;
    this.x = this.waypoints[0].x;
    this.y = this.waypoints[0].y;
    this.size = TILE_SIZE / 2;
    this.type = typeData.type;
    this.color = typeData.color;
    this.badge = typeData.badge;
    this.maxHealth = typeData.health;
    this.baseSpeed = typeData.speed;
    this.speed = getSpeedScale(this.baseSpeed);
    this.health = this.maxHealth;
  }

  update() {
    if (this.waypointIndex >= this.waypoints.length) {
      this.health = 0;
      return;
    }

    const target = this.waypoints[this.waypointIndex];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 1) {
      this.waypointIndex++;
      if (this.waypointIndex >= this.waypoints.length) {
        this.health = 0;
      }
    } else {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }
  }

  draw() {
    const centerX = this.x + this.size / 2;
    const centerY = this.y + this.size / 2;
    const radius = this.size * 0.5;
    drawEnemyShape(this, centerX, centerY, radius);

    ctx.fillStyle = "limegreen";
    ctx.fillRect(this.x, this.y - 6, this.size * (this.health / this.maxHealth), 3);

    drawEnemyBadge(this);
  }
}


class Tower {
  constructor(x, y, type = "basic") {
    this.x = x;
    this.y = y;
    this.type = type;
    this.baseRange = type === "rapid" ? 90 : 120;
    this.range = this.baseRange * getScaleFactor();
    this.cooldownMax = type === "rapid" ? 15 : 60;
    this.damage = type === "rapid" ? 18 : 50;
    this.color = type === "rapid" ? "#ff8c42" : "#3c82ff";
    this.cooldown = 0;
    this.levels = { damage: 0, range: 0, speed: 0 };
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
  drawTowerShape(this);
  }
}


class Bullet {
  constructor(x, y, target, damage) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.baseSpeed = 5;
    this.speed = getSpeedScale(this.baseSpeed);
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

function getWaypoints() {
  return [
    { x: 0, y: canvas.height * 0.33 },
    { x: canvas.width * 0.3, y: canvas.height * 0.33 },
    { x: canvas.width * 0.3, y: canvas.height * 0.7 },
    { x: canvas.width * 0.9, y: canvas.height * 0.7 },
    { x: canvas.width, y: canvas.height * 0.7 }
  ];
}

function updateUi() {
  document.getElementById("moneyDisplay").textContent = `💰 ${money}`;
  document.getElementById("livesDisplay").textContent = `❤️ ${lives}`;
  document.getElementById("scoreDisplay").textContent = `🏆 ${score}`;
  document.getElementById("waveDisplay").textContent = `🌊 Wave: ${waveNumber}`;
  if (moneyCompact) moneyCompact.textContent = `💰 ${money}`;
  if (livesCompact) livesCompact.textContent = `❤️ ${lives}`;
  if (scoreCompact) scoreCompact.textContent = `🏆 ${score}`;
  if (waveCompact) waveCompact.textContent = `🌊 ${waveNumber}`;
  updateWaveProgress();

}

function spawnEnemy() {
  const dynamicWaypoints = getWaypoints();
  enemies.push(new Enemy(dynamicWaypoints));
}

function startWave() {
  waveNumber++;
  enemiesToSpawn = 5 + waveNumber * 2; // ogni wave più nemici
  totalEnemiesThisWave = enemiesToSpawn;
  spawnCooldown = 60;
  waveInProgress = true;
}

canvas.addEventListener("pointerdown", (e) => {
  if (e.pointerType === "touch") {
    e.preventDefault();
  }
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;   // scala X tra coordinate canvas interne e dimensioni visualizzate
  const scaleY = canvas.height / rect.height; // scala Y

  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;

  const { snappedX, snappedY } = snapToGrid(x, y);
  hoverTile = { x: snappedX, y: snappedY };
  if (e.pointerType === "touch") {
    setTimeout(() => {
      hoverTile = null;
    }, 200);
  }

  const clickedTower = getTowerAt(snappedX, snappedY);
  if (clickedTower) {
    if (selectedTower === clickedTower) {
      selectedTower = null;
      updateTowerPanel();
    } else {
      selectedTower = clickedTower;
      updateTowerPanel();
    }
    return;
  }

  placeTower(snappedX, snappedY, selectedTowerType);
});

canvas.addEventListener("pointermove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;
  const { snappedX, snappedY } = snapToGrid(x, y);
  hoverTile = { x: snappedX, y: snappedY };
});

canvas.addEventListener("pointerleave", () => {
  hoverTile = null;
});

function placeTower(x, y, type = "basic") {
  const cost = towerCosts[type];
  if (money < cost) {
    showToast("Non hai abbastanza soldi!", "warning");
    return;
  }

  if (isTileOccupied(x, y)) {
    showToast("C'è già una torre qui!", "warning");
    return;
  }

  if (isOnPath(x, y)) {
    showToast("Non puoi piazzare torri sulla strada!", "warning");
    return;
  }

  towers.push(new Tower(x, y, type));
  money -= cost;
  updateTowerPanel();
}

function snapToGrid(x, y) {
  const gridX = Math.round(x / TILE_SIZE - 0.5);
  const gridY = Math.round(y / TILE_SIZE - 0.5);
  const clampedX = Math.max(0, Math.min(GRID_WIDTH - 1, gridX));
  const clampedY = Math.max(0, Math.min(GRID_HEIGHT - 1, gridY));
  return {
    snappedX: clampedX * TILE_SIZE + TILE_SIZE / 2,
    snappedY: clampedY * TILE_SIZE + TILE_SIZE / 2
  };
}

function getTowerAt(x, y) {
  const maxDistance = TILE_SIZE * 0.5;
  return towers.find(tower => {
    const dx = tower.x - x;
    const dy = tower.y - y;
    return Math.hypot(dx, dy) <= maxDistance;
  });
}

function updateTowerPanel() {
  if (!towerStatus || !towerStats) return;

  if (!selectedTower) {
    towerStatus.textContent = "Select a tower";
    towerStats.textContent = "No tower selected.";
    setUpgradeButtonsState(true);
    updateUpgradeLabels();
    if (towerPanel) {
      towerPanel.classList.add("is-empty");
      towerPanel.classList.remove("is-active");
    }
    return;
  }

  towerStatus.textContent = `Selected: ${selectedTower.type.toUpperCase()}`;
  towerStats.textContent = `Damage: ${selectedTower.damage} | Range: ${Math.round(selectedTower.range)} | Speed: ${selectedTower.cooldownMax}`;
  setUpgradeButtonsState(false);
  updateUpgradeLabels();
  if (towerPanel) {
    towerPanel.classList.remove("is-empty");
    towerPanel.classList.add("is-active");
  }
}

function setUpgradeButtonsState(disabled) {
  [upgradeDamageBtn, upgradeRangeBtn, upgradeSpeedBtn].forEach(btn => {
    if (btn) btn.disabled = disabled;
  });
}

function getUpgradeCost(level) {
  return 75 + level * 35;
}

function updateWaveProgress() {
  if (!waveProgressFill || !waveProgressText) return;

  if (!waveInProgress || totalEnemiesThisWave === 0) {
    waveProgressFill.style.width = "0%";
    waveProgressText.textContent = "0%";
    return;
  }

  const remaining = enemiesToSpawn + enemies.length;
  const rawProgress = 1 - remaining / totalEnemiesThisWave;
  const progress = Math.max(0, Math.min(1, rawProgress));
  waveProgressFill.style.width = `${Math.round(progress * 100)}%`;
  waveProgressText.textContent = `${Math.round(progress * 100)}%`;
}

function updateUpgradeLabels() {
  if (!upgradeDamageBtn || !upgradeRangeBtn || !upgradeSpeedBtn) return;

  if (!selectedTower) {
    upgradeDamageBtn.textContent = "Damage +5 (75)";
    upgradeRangeBtn.textContent = "Range +10 (75)";
    upgradeSpeedBtn.textContent = "Speed +5% (75)";
    return;
  }

  const damageCost = getUpgradeCost(selectedTower.levels.damage);
  const rangeCost = getUpgradeCost(selectedTower.levels.range);
  const speedCost = getUpgradeCost(selectedTower.levels.speed);
  upgradeDamageBtn.textContent = `Damage +5 (${damageCost})`;
  upgradeRangeBtn.textContent = `Range +10 (${rangeCost})`;
  upgradeSpeedBtn.textContent = `Speed +5% (${speedCost})`;
}

function upgradeTower(type) {
  if (!selectedTower) return;

  const level = selectedTower.levels[type];
  const cost = getUpgradeCost(level);
  if (money < cost) {
    showToast("Non hai abbastanza soldi!", "warning");
    return;
  }

  money -= cost;
  selectedTower.levels[type] += 1;

  if (type === "damage") {
    selectedTower.damage += 5;
  } else if (type === "range") {
    selectedTower.baseRange += 10;
    selectedTower.range = selectedTower.baseRange * getScaleFactor();
  } else if (type === "speed") {
    selectedTower.cooldownMax = Math.max(8, selectedTower.cooldownMax - 3);
  }

  updateTowerPanel();
}

let toastTimeout = null;
function showToast(message, kind = "info") {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  toast.classList.toggle("is-warning", kind === "warning");
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 1400);
}

if (upgradeDamageBtn) {
  upgradeDamageBtn.addEventListener("click", () => upgradeTower("damage"));
}
if (upgradeRangeBtn) {
  upgradeRangeBtn.addEventListener("click", () => upgradeTower("range"));
}
if (upgradeSpeedBtn) {
  upgradeSpeedBtn.addEventListener("click", () => upgradeTower("speed"));
}

if (towerDeselectBtn) {
  towerDeselectBtn.addEventListener("click", () => {
    selectedTower = null;
    updateTowerPanel();
  });
}

updateTowerPanel();

window.addEventListener("keydown", (event) => {
  if (!selectedTower) return;

  const key = event.key.toLowerCase();
  if (key === "1" || key === "d") {
    upgradeTower("damage");
  } else if (key === "2" || key === "r") {
    upgradeTower("range");
  } else if (key === "3" || key === "s") {
    upgradeTower("speed");
  }
});

function getEnemyType() {
  const roll = Math.random();
  if (waveNumber > 3 && roll < 0.2) {
    return { type: "tank", badge: "T", color: "#8ad3ff", health: 180, speed: 0.7 };
  }
  if (waveNumber > 1 && roll < 0.5) {
    return { type: "fast", badge: "F", color: "#ff8c42", health: 70, speed: 1.5 };
  }
  return { type: "basic", badge: "B", color: "#d63c3c", health: 100, speed: 1 };
}

function drawEnemyBadge(enemy) {
  const badgeSize = Math.max(10, TILE_SIZE * 0.28);
  const x = enemy.x + enemy.size - badgeSize * 0.9;
  const y = enemy.y - badgeSize * 0.9;

  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(x, y, badgeSize, badgeSize);
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.strokeRect(x, y, badgeSize, badgeSize);
  ctx.fillStyle = "#fff";
  ctx.font = `${Math.max(8, badgeSize * 0.6)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(enemy.badge, x + badgeSize / 2, y + badgeSize / 2);
}
function getScaleFactor() {
  return TILE_SIZE / BASE_TILE_SIZE;
}

function getSpeedScale(baseSpeed) {
  return baseSpeed * getScaleFactor();
}

function rescaleEntities(scale = 1) {
  const sizeScale = getScaleFactor();

  enemies.forEach(enemy => {
    enemy.size = TILE_SIZE / 2;
    enemy.x *= scale;
    enemy.y *= scale;
    enemy.waypoints = getWaypoints();
    enemy.speed = getSpeedScale(enemy.baseSpeed);
  });

  towers.forEach(tower => {
    tower.x *= scale;
    tower.y *= scale;
    tower.range = tower.baseRange * sizeScale;
  });

  bullets.forEach(bullet => {
    bullet.x *= scale;
    bullet.y *= scale;
    bullet.speed = getSpeedScale(bullet.baseSpeed);
  });
}

function isTileOccupied(x, y) {
  return towers.some(tower => tower.x === x && tower.y === y);
}

function isOnPath(x, y) {
  const waypoints = getWaypoints();
  const halfThickness = TILE_SIZE / 2;
  const buffer = TILE_SIZE * 0.2;
  const threshold = halfThickness + buffer;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const start = waypoints[i];
    const end = waypoints[i + 1];
    const distance = distanceToSegment(x, y, start.x, start.y, end.x, end.y);
    if (distance <= threshold) {
      return true;
    }
  }

  return false;
}

function distanceToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) {
    return Math.hypot(px - x1, py - y1);
  }

  const t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
  const clamped = Math.max(0, Math.min(1, t));
  const closestX = x1 + clamped * dx;
  const closestY = y1 + clamped * dy;
  return Math.hypot(px - closestX, py - closestY);
}


function drawPath() {
  const waypoints = getWaypoints(); 

  // Base road
  ctx.lineCap = "round";
  ctx.strokeStyle = "#3c3f44";
  ctx.lineWidth = TILE_SIZE * 0.95;
  ctx.beginPath();
  ctx.moveTo(waypoints[0].x, waypoints[0].y);
  for (let i = 1; i < waypoints.length; i++) {
    ctx.lineTo(waypoints[i].x, waypoints[i].y);
  }
  ctx.stroke();

  // Edge highlight
  ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(waypoints[0].x, waypoints[0].y);
  for (let i = 1; i < waypoints.length; i++) {
    ctx.lineTo(waypoints[i].x, waypoints[i].y);
  }
  ctx.stroke();

  // Subtle road texture
  ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
  ctx.lineWidth = TILE_SIZE * 0.2;
  ctx.setLineDash([TILE_SIZE * 0.3, TILE_SIZE * 0.35]);
  ctx.beginPath();
  ctx.moveTo(waypoints[0].x, waypoints[0].y);
  for (let i = 1; i < waypoints.length; i++) {
    ctx.lineTo(waypoints[i].x, waypoints[i].y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawBackgroundGrid() {
  const tileWidth = canvas.width / GRID_WIDTH;
  const tileHeight = canvas.height / GRID_HEIGHT;

  for (let x = 0; x < GRID_WIDTH; x++) {
    for (let y = 0; y < GRID_HEIGHT; y++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? "#1a1a1a" : "#222";
      ctx.fillRect(x * tileWidth, y * tileHeight, tileWidth, tileHeight);
    }
  }
}

function drawPathCells() {
  for (let x = 0; x < GRID_WIDTH; x++) {
    for (let y = 0; y < GRID_HEIGHT; y++) {
      const centerX = x * TILE_SIZE + TILE_SIZE / 2;
      const centerY = y * TILE_SIZE + TILE_SIZE / 2;
      if (!isOnPath(centerX, centerY)) continue;

      ctx.fillStyle = "rgba(90, 95, 102, 0.18)";
      ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }
}

function drawHoverTile() {
  if (!hoverTile) return;
  ctx.fillStyle = "rgba(255, 204, 61, 0.15)";
  ctx.fillRect(
    hoverTile.x - TILE_SIZE / 2,
    hoverTile.y - TILE_SIZE / 2,
    TILE_SIZE,
    TILE_SIZE
  );
  ctx.strokeStyle = "rgba(255, 204, 61, 0.6)";
  ctx.strokeRect(
    hoverTile.x - TILE_SIZE / 2,
    hoverTile.y - TILE_SIZE / 2,
    TILE_SIZE,
    TILE_SIZE
  );
}

function drawTowerShape(tower) {
  const half = TILE_SIZE / 2;
  const baseSize = TILE_SIZE * 0.9;
  const baseX = tower.x - baseSize / 2;
  const baseY = tower.y - baseSize / 2;
  const outline = tower === selectedTower ? "#ffcc3d" : "#1b1f23";

  ctx.fillStyle = shadeColor(tower.color, -20);
  drawRoundedRect(baseX, baseY, baseSize, baseSize, TILE_SIZE * 0.12);
  ctx.fill();

  ctx.strokeStyle = outline;
  ctx.lineWidth = 2;
  ctx.stroke();

  // turret
  ctx.fillStyle = tower.color;
  ctx.beginPath();
  ctx.arc(tower.x, tower.y, half * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // barrel
  ctx.strokeStyle = shadeColor(tower.color, 30);
  ctx.lineWidth = Math.max(2, TILE_SIZE * 0.12);
  ctx.beginPath();
  ctx.moveTo(tower.x, tower.y);
  ctx.lineTo(tower.x + half * 0.55, tower.y - half * 0.15);
  ctx.stroke();
}

function drawEnemyShape(enemy, x, y, radius) {
  ctx.lineWidth = Math.max(2, radius * 0.18);
  ctx.strokeStyle = "#1b1f23";
  ctx.fillStyle = enemy.color;

  if (enemy.type === "fast") {
    drawDiamond(x, y, radius);
  } else if (enemy.type === "tank") {
    drawHexagon(x, y, radius);
  } else {
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.95, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = shadeColor(enemy.color, 25);
  ctx.beginPath();
  ctx.arc(x - radius * 0.15, y - radius * 0.1, radius * 0.35, 0, Math.PI * 2);
  ctx.fill();
}

function drawRoundedRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawDiamond(x, y, radius) {
  ctx.beginPath();
  ctx.moveTo(x, y - radius);
  ctx.lineTo(x + radius, y);
  ctx.lineTo(x, y + radius);
  ctx.lineTo(x - radius, y);
  ctx.closePath();
}

function drawHexagon(x, y, radius) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function shadeColor(color, percent) {
  const num = parseInt(color.slice(1), 16);
  const amt = Math.round(2.55 * percent);
  const r = Math.min(255, Math.max(0, (num >> 16) + amt));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
  return `#${(1 << 24 | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

// GAMELOOOOOOOP
function gameLoop() {
  try {
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
        newEnemy.maxHealth += waveNumber * 10;
        newEnemy.health = newEnemy.maxHealth;
        newEnemy.baseSpeed += waveNumber * 0.1;
        newEnemy.speed = getSpeedScale(newEnemy.baseSpeed);
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
    drawPathCells();
    drawPath();
    drawHoverTile();

    // Aggiorna nemici
    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      enemy.update();

      if (enemy.waypointIndex >= enemy.waypoints.length) {
        lives--;
        enemies.splice(i, 1);
        if (lives <= 0) gameOver = true;
        continue; // passa al prossimo
      }

      if (enemy.health <= 0) {
        money += 25;
        score += 100;
        enemies.splice(i, 1);
        continue;
      }

      enemy.draw();
    } // disegna solo i nemici vivi e in campo

    // Aggiorna torri
    towers.forEach(tower => {
      tower.update();
      tower.draw();
    });

    // Aggiorna proiettili
    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i];
      bullet.update();
      if (bullet.destroyed) {
        bullets.splice(i, 1);
      } else {
        bullet.draw();
      }
    }

    if (lastError) {
      ctx.fillStyle = "rgba(0,0,0,0.65)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "white";
      ctx.font = "16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Error: " + lastError, canvas.width / 2, canvas.height / 2);
    }
  } catch (err) {
    lastError = err?.message || "Unknown error";
    console.error(err);
  }

  requestAnimationFrame(gameLoop);
}

setInterval(spawnEnemy, 2000); // nemici ogni 2 secondi
gameLoop();
startWave();
