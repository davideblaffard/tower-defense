function initInputs() {
  towerButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      selectedTowerType = btn.dataset.type;
      towerButtons.forEach(button => button.classList.remove("is-selected"));
      btn.classList.add("is-selected");
    });
  });
  towerButtons.find(btn => btn.dataset.type === selectedTowerType)?.classList.add("is-selected");

  if (hud && hudToggle) {
    hudToggle.addEventListener("click", () => {
      hud.classList.toggle("is-collapsed");
      const isCollapsed = hud.classList.contains("is-collapsed");
      hudToggle.setAttribute("aria-expanded", String(!isCollapsed));
      resizeCanvas();
    });
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") {
      e.preventDefault();
    }
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

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

  window.addEventListener("error", (event) => {
    lastError = event?.message || "Unknown error";
  });
}
