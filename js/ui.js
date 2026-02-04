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
