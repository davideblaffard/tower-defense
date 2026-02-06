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

let selectedTowerType = "basic"; // default
const towerButtons = Array.from(document.querySelectorAll(".controls button"));

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

let toastTimeout = null;
