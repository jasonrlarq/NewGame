// ===== GAME STATE & CONSTANTS =====
// Game stats, constants, and shop definitions

const COWS_NEEDED = 10;
const PIGS_NEEDED = 5;
const FARMERS_NEEDED = 10;
const KILLS_NEEDED = 20;
const MAX_ENERGY = 5000;

function getMaxEnergy() {
  return MAX_ENERGY + (gameStats ? gameStats.shieldLevel * 650 : 0);
}

let gameStats = {
  score: 0,
  money: 0,
  energy: MAX_ENERGY,
  level: 1,
  weaponTier: 1,
  shieldLevel: 0,
  speedLevel: 0,
  ufoModelLevel: 0,
  boostMeter: 0,
  overclockTimer: 0,
  cargo: { cows: 0, pigs: 0, farmers: 0 },
  msQuota: { cows: 0, pigs: 0, farmers: 0 },
  farmersKilled: 0,
  lives: 3,
};

function resetLevelProgress() {
  gameStats.cargo = { cows: 0, pigs: 0, farmers: 0 };
  gameStats.msQuota = { cows: 0, pigs: 0, farmers: 0 };
  gameStats.farmersKilled = 0;
}

function resetRunState() {
  gameStats.score = 0;
  gameStats.money = 0;
  gameStats.level = 1;
  gameStats.weaponTier = 1;
  gameStats.shieldLevel = 0;
  gameStats.speedLevel = 0;
  gameStats.ufoModelLevel = 0;
  gameStats.boostMeter = 0;
  gameStats.overclockTimer = 0;
  gameStats.lives = 3;
  resetLevelProgress();
}

let mothershipState = 'waiting';
let shopOpen = false;

const shopDefs = [
  { id: 'shield', name: 'Shield Upgrade', desc: '+650 max energy core', basePrice: 250, getPrice: (lvl) => 250 + lvl * 180, apply: () => { gameStats.shieldLevel += 1; gameStats.energy = Math.min(getMaxEnergy(), gameStats.energy + 400); } },
  { id: 'weapon', name: 'Laser Upgrade', desc: 'Boost weapon tier and plasma output', basePrice: 300, getPrice: (lvl) => 300 + lvl * 220, apply: () => { gameStats.weaponTier += 1; } },
  { id: 'speed', name: 'Thruster Upgrade', desc: '+12% movement and boost speed', basePrice: 320, getPrice: (lvl) => 320 + lvl * 240, apply: () => { gameStats.speedLevel += 1; } },
  { id: 'ufo', name: 'UFO Model', desc: 'New saucer shell and combat glow', basePrice: 420, getPrice: (lvl) => 420 + lvl * 260, apply: () => { gameStats.ufoModelLevel += 1; } },
];

let gameStarted = false;
let crashed = false;

function getShopState() {
  return {
    shield: gameStats.shieldLevel,
    weapon: gameStats.weaponTier - 1,
    speed: gameStats.speedLevel,
    ufo: gameStats.ufoModelLevel,
  };
}
