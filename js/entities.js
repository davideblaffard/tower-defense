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
