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

function initGame() {
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  const resizeObserver = new ResizeObserver(resizeCanvas);
  resizeObserver.observe(stage);

  initInputs();
  updateTowerPanel();

  setInterval(spawnEnemy, 2000); // nemici ogni 2 secondi
  startWave();
  gameLoop();
}

initGame();
