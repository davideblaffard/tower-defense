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

function isTileOccupied(x, y) {
  return towers.some(tower => tower.x === x && tower.y === y);
}
