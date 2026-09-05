// ===== INPUT & CONTROLS =====
// Keyboard, joystick, and button event handlers

let keys = {};
let lastFireTime = 0;

// Joystick controls
let joyX = 0;
let joyY = 0;
const jBase = document.getElementById('joystick-base');
const jStick = document.getElementById('joystick-stick');
let jActive = false;
let jCenterX;
let jCenterY;
const maxRadius = 35;

jBase.addEventListener('touchstart', (e) => {
  e.preventDefault();
  jActive = true;
  const rect = jBase.getBoundingClientRect();
  jCenterX = rect.left + rect.width / 2;
  jCenterY = rect.top + rect.height / 2;
  updateJoystick(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });

jBase.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (!jActive) return;
  updateJoystick(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });

jBase.addEventListener('touchend', (e) => {
  e.preventDefault();
  jActive = false;
  joyX = 0;
  joyY = 0;
  jStick.style.transform = 'translate(0px, 0px)';
}, { passive: false });

function updateJoystick(clientX, clientY) {
  let dx = clientX - jCenterX;
  let dy = clientY - jCenterY;
  let dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > maxRadius) {
    dx = (dx / dist) * maxRadius;
    dy = (dy / dist) * maxRadius;
  }
  jStick.style.transform = `translate(${dx}px, ${dy}px)`;
  joyX = dx / maxRadius;
  joyY = dy / maxRadius;
}

// Mobile buttons
const btnFire = document.getElementById('btn-fire');
const btnTractor = document.getElementById('btn-tractor');
const shopContinueBtn = document.getElementById('shop-continue');

shopContinueBtn.addEventListener('click', () => {
  closeShop();
});

btnFire.addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (!gameStarted || crashed || gameStats.energy <= 0) return;
  const now = performance.now();
  const baseCooldown = Math.max(30, 200 - (gameStats.weaponTier * 10));
  const cooldown = (gameStats.overclockTimer > 0) ? baseCooldown / 2 : baseCooldown;
  if (now - lastFireTime > cooldown) {
    fireManualLaser();
    lastFireTime = now;
  }
}, { passive: false });

btnTractor.addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (!gameStarted || crashed || gameStats.energy <= 0) return;
  tractorBeam.visible = true;
  startTractorHum();
}, { passive: false });

btnTractor.addEventListener('touchend', (e) => {
  e.preventDefault();
  tractorBeam.visible = false;
  stopTractorHum();
}, { passive: false });

// Desktop keyboard controls
window.addEventListener('keydown', (e) => {
  if (!gameStarted) return;
  if (crashed) {
    if (e.key.toLowerCase() === 'r') resetGame();
    return;
  }
  keys[e.key.toLowerCase()] = true;
  if (e.code === 'Space' && gameStats.energy > 0) {
    tractorBeam.visible = true;
    startTractorHum();
  }
  if (e.key.toLowerCase() === 'b' && gameStats.energy > 0) {
    const now = performance.now();
    const baseCooldown = Math.max(30, 200 - (gameStats.weaponTier * 10));
    const cooldown = (gameStats.overclockTimer > 0) ? baseCooldown / 2 : baseCooldown;
    if (now - lastFireTime > cooldown) {
      fireManualLaser();
      lastFireTime = now;
    }
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
  if (e.code === 'Space') {
    tractorBeam.visible = false;
    stopTractorHum();
  }
});

function startSequence() {
  initAudio();
  document.getElementById('startBtn').style.display = 'none';
  const cdText = document.getElementById('countdownText');
  cdText.style.display = 'block';
  let count = 3;
  cdText.innerText = count;
  sndTick();
  const timer = setInterval(() => {
    count -= 1;
    if (count > 0) {
      cdText.innerText = count;
      sndTick();
    } else {
      clearInterval(timer);
      document.getElementById('overlay').style.display = 'none';
      gameStarted = true;
      sndLevelUpJingle();
    }
  }, 1000);
}
