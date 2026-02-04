function getWaypoints() {
  return [
    { x: 0, y: canvas.height * 0.33 },
    { x: canvas.width * 0.3, y: canvas.height * 0.33 },
    { x: canvas.width * 0.3, y: canvas.height * 0.7 },
    { x: canvas.width * 0.9, y: canvas.height * 0.7 },
    { x: canvas.width, y: canvas.height * 0.7 }
  ];
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
