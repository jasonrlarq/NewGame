// ===== MAIN GAME LOOP & LOGIC =====
// Core game update, collision detection, and gameplay mechanics

let projectiles = [];
let ufoLasers = [];
const projGeo = new THREE.SphereGeometry(0.4, 10, 10);
const projMat = new THREE.MeshBasicMaterial({ color: 0xff2200 });

let audioCtx = null;
let tractorOsc = null;
let tractorGain = null;

function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playTone(startFreq, endFreq, duration, type) {
  try {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(startFreq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 1), audioCtx.currentTime + duration);
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

function startTractorHum() {
  if (!audioCtx || tractorOsc) return;
  try {
    tractorOsc = audioCtx.createOscillator();
    tractorGain = audioCtx.createGain();
    tractorOsc.type = 'sine';
    tractorOsc.frequency.value = 85;
    tractorGain.gain.setValueAtTime(0.0, audioCtx.currentTime);
    tractorGain.gain.linearRampToValueAtTime(0.10, audioCtx.currentTime + 0.1);
    tractorOsc.connect(tractorGain);
    tractorGain.connect(audioCtx.destination);
    tractorOsc.start();
  } catch (e) {}
}

function stopTractorHum() {
  if (tractorOsc && tractorGain) {
    try {
      tractorGain.gain.linearRampToValueAtTime(0.0, audioCtx.currentTime + 0.1);
      tractorOsc.stop(audioCtx.currentTime + 0.15);
      tractorOsc = null;
    } catch (e) {}
  }
}

function getLaserColor(tier) {
  const colors = [0x00ffff, 0x00ff00, 0xffff00, 0xff00ff, 0xffaa00, 0xffffff, 0xff0000];
  return colors[Math.floor((tier - 1) / 3) % colors.length];
}

function sndLaser(tier) {
  const types = ['sine', 'triangle', 'square', 'sawtooth'];
  const wType = types[Math.min(Math.floor((tier - 1) / 5), 3)];
  playTone(Math.max(200, 1200 - (tier * 60)), Math.max(50, 400 - (tier * 20)), 0.12, wType);
}

function sndExplosion() { playTone(250, 30, 0.5, 'sawtooth'); }
function sndStun() { playTone(800, 600, 0.1, 'sine'); setTimeout(() => playTone(600, 400, 0.1, 'sine'), 100); }
function sndHit() { playTone(400, 200, 0.1, 'square'); }
function sndAbductCow() { playTone(300, 800, 0.2, 'sine'); }
function sndAbductPig() { playTone(400, 1000, 0.2, 'triangle'); }
function sndAbductFarmer() { playTone(500, 1200, 0.25, 'square'); }
function sndDamage() { playTone(200, 60, 0.15, 'square'); }
function sndPowerup() { playTone(600, 1400, 0.25, 'triangle'); }
function sndTick() { playTone(800, 400, 0.1, 'sine'); }
function sndMothership() { playTone(150, 50, 2.0, 'sawtooth'); }
function sndRecharge() { playTone(100, 1000, 1.2, 'sine'); }
function sndLevelUpJingle() {
  try {
    if (!audioCtx) return;
    const notes = [300, 450, 600, 900, 1200];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      }, idx * 120);
    });
  } catch (e) {}
}

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0x00ff66, 1.3);
dirLight.position.set(40, 60, 30);
scene.add(dirLight);

const terrainGeo = new THREE.PlaneGeometry(300, 300, 40, 40);
const terrainMat = new THREE.MeshStandardMaterial({ color: 0x082b08, roughness: 0.8 });
const terrain = new THREE.Mesh(terrainGeo, terrainMat);
terrain.rotation.x = -Math.PI / 2;
terrain.position.y = -0.1;
scene.add(terrain);

const ufoGroup = new THREE.Group();
scene.add(ufoGroup);

const saucerMat = new THREE.MeshStandardMaterial({ color: 0x00ff66, emissive: 0x0a331a, metalness: 0.8, roughness: 0.15 });
const saucerMesh = new THREE.Mesh(
  new THREE.CylinderGeometry(1.9, 3.2, 0.65, 32),
  saucerMat
);
ufoGroup.add(saucerMesh);

const ufoGlow = new THREE.Mesh(
  new THREE.SphereGeometry(3.1, 18, 18),
  new THREE.MeshBasicMaterial({ color: 0x33ff99, transparent: true, opacity: 0.12 })
);
ufoGlow.position.y = 0.2;
ufoGroup.add(ufoGlow);

const ufoOrbiters = [];
for (let i = 0; i < 3; i++) {
  const orb = new THREE.Mesh(
    new THREE.SphereGeometry(0.26, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0x88ffff })
  );
  orb.userData = {
    angle: (i / 3) * Math.PI * 2,
    radius: 2.9 + i * 0.35,
    height: 0.4 + i * 0.2,
  };
  ufoGroup.add(orb);
  ufoOrbiters.push(orb);
}

const ufoThrusterL = new THREE.Mesh(
  new THREE.CylinderGeometry(0.22, 0.32, 1.4, 12),
  new THREE.MeshBasicMaterial({ color: 0x00ffff })
);
ufoThrusterL.position.set(-1.3, -0.7, 0);
ufoGroup.add(ufoThrusterL);

const ufoThrusterR = new THREE.Mesh(
  new THREE.CylinderGeometry(0.22, 0.32, 1.4, 12),
  new THREE.MeshBasicMaterial({ color: 0x00ffff })
);
ufoThrusterR.position.set(1.3, -0.7, 0);
ufoGroup.add(ufoThrusterR);

const domeMesh = new THREE.Mesh(
  new THREE.SphereGeometry(1.25, 20, 20, 0, Math.PI * 2, 0, Math.PI / 2),
  new THREE.MeshStandardMaterial({ color: 0x88ffff, emissive: 0x1a3333, metalness: 0.55, roughness: 0.25, transparent: true, opacity: 0.95 })
);
domeMesh.position.set(0, 0.58, 0);
domeMesh.scale.set(1.05, 1.08, 1.05);
ufoGroup.add(domeMesh);

const tractorBeam = new THREE.Mesh(
  new THREE.ConeGeometry(4.2, 11, 32, 1, true),
  new THREE.MeshBasicMaterial({ color: 0x00ff66, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
);
tractorBeam.position.y = -5.5;
tractorBeam.visible = false;
ufoGroup.add(tractorBeam);

ufoGroup.position.set(0, 9, 0);

const trackerGroup = new THREE.Group();
const arrowMat = new THREE.MeshBasicMaterial({ color: 0xff00ff, transparent: true, opacity: 0.8 });
const arrowHead = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.5, 8), arrowMat);
arrowHead.rotation.x = Math.PI / 2;
arrowHead.position.z = 6;
trackerGroup.add(arrowHead);

const arrowTail = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 2.5, 8), arrowMat);
arrowTail.rotation.x = Math.PI / 2;
arrowTail.position.z = 4.5;
trackerGroup.add(arrowTail);
ufoGroup.add(trackerGroup);

const dashboardGroup = new THREE.Group();
camera.add(dashboardGroup);

const dashBaseGeo = new THREE.BoxGeometry(8.2, 3.8, 1.2);
const dashBaseMat = new THREE.MeshStandardMaterial({ color: 0x0b0e14, metalness: 0.9, roughness: 0.2 });
const dashBase = new THREE.Mesh(dashBaseGeo, dashBaseMat);
dashboardGroup.add(dashBase);

const dashRimGeo = new THREE.BoxGeometry(7.8, 3.4, 1.3);
const dashRimMat = new THREE.MeshStandardMaterial({ color: 0x00ff66, wireframe: true, transparent: true, opacity: 0.3 });
const dashRim = new THREE.Mesh(dashRimGeo, dashRimMat);
dashboardGroup.add(dashRim);

const wingGeo = new THREE.BoxGeometry(2.5, 3.8, 1.2);
const lWing = new THREE.Mesh(wingGeo, dashBaseMat);
lWing.position.set(-4.8, 0, -0.6);
lWing.rotation.y = 0.5;
dashboardGroup.add(lWing);
const rWing = new THREE.Mesh(wingGeo, dashBaseMat);
rWing.position.set(4.8, 0, -0.6);
rWing.rotation.y = -0.5;
dashboardGroup.add(rWing);

const dashLights = [];
const ledMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
for (let i = 0; i < 8; i++) {
  const dl = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.1, 16), ledMat.clone());
  dl.rotation.x = Math.PI / 2;
  if (i < 4) {
    dl.position.set(0.6, 1.0 - (i * 0.6), 0.70);
    lWing.add(dl);
  } else {
    dl.position.set(-0.6, 1.0 - ((i - 4) * 0.6), 0.70);
    rWing.add(dl);
  }
  dashLights.push({ mesh: dl, offset: i });
}

const hudCanvas = document.createElement('canvas');
hudCanvas.width = 1024;
hudCanvas.height = 512;
const hudCtx = hudCanvas.getContext('2d');
const hudTex = new THREE.CanvasTexture(hudCanvas);
const hudScreen = new THREE.Mesh(new THREE.PlaneGeometry(7.6, 3.2), new THREE.MeshBasicMaterial({ map: hudTex }));
hudScreen.position.z = 0.61;
dashboardGroup.add(hudScreen);

function resizeHUD() {
  const dist = 14;
  const vFov = camera.fov * Math.PI / 180;
  const h = 2 * Math.tan(vFov / 2) * dist;
  dashboardGroup.position.set(0, -h / 2 + 1.8, -dist);
  dashboardGroup.rotation.x = -0.25;
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  resizeHUD();
});
resizeHUD();

const msGroup = new THREE.Group();
const msBodyGeo = new THREE.CylinderGeometry(14, 14, 3, 32);
const msBodyMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.2 });
const msBody = new THREE.Mesh(msBodyGeo, msBodyMat);
msGroup.add(msBody);

const msDomeGeo = new THREE.SphereGeometry(7, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
const msDomeMat = new THREE.MeshStandardMaterial({ color: 0x9900ff, transparent: true, opacity: 0.8 });
const msDome = new THREE.Mesh(msDomeGeo, msDomeMat);
msDome.position.y = 1.5;
msGroup.add(msDome);

const msSymbol = new THREE.Mesh(new THREE.BoxGeometry(4, 0.5, 4), new THREE.MeshBasicMaterial({ color: 0x00ffff }));
msSymbol.position.y = 8.5;
msGroup.add(msSymbol);

const msLights = [];
for (let i = 0; i < 24; i++) {
  const l = new THREE.Mesh(new THREE.SphereGeometry(0.5), new THREE.MeshBasicMaterial({ color: 0xffff00 }));
  l.position.set(Math.cos(i * Math.PI / 12) * 14.5, 0, Math.sin(i * Math.PI / 12) * 14.5);
  msGroup.add(l);
  msLights.push(l);
}

const msTractor = new THREE.Mesh(
  new THREE.CylinderGeometry(14, 14, 20, 32, 1, true),
  new THREE.MeshBasicMaterial({ color: 0x9900ff, transparent: true, opacity: 0.3, side: THREE.DoubleSide })
);
msTractor.position.y = -10;
msGroup.add(msTractor);

const msBeacon = new THREE.Mesh(
  new THREE.CylinderGeometry(2, 2, 300, 16, 1, true),
  new THREE.MeshBasicMaterial({ color: 0xaa00ff, transparent: true, opacity: 0.2, side: THREE.DoubleSide })
);
msBeacon.position.y = 150;
msGroup.add(msBeacon);

msGroup.position.set(120, 3.75, -120);
scene.add(msGroup);

let obstacles = [];
for (let i = 0; i < 40; i++) {
  const isRock = Math.random() > 0.5;
  const geo = isRock ? new THREE.DodecahedronGeometry(Math.random() * 1.5 + 0.6) : new THREE.ConeGeometry(1.2, 3.5, 5);
  const mat = new THREE.MeshStandardMaterial({ color: isRock ? 0x444444 : 0x003311, roughness: 0.9 });
  const obj = new THREE.Mesh(geo, mat);
  obj.position.set((Math.random() - 0.5) * 120, isRock ? 0.8 : 1.8, (Math.random() - 0.5) * 120);
  scene.add(obj);
  obstacles.push(obj);
}

const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4 });

function createBarnAt(x, z) {
  const barn = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x8b5e3c, roughness: 0.9 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x2c1a17, roughness: 0.8 });
  const wall = new THREE.Mesh(new THREE.BoxGeometry(5, 3.5, 4), wallMat);
  wall.position.y = 1.75;
  barn.add(wall);

  const roof = new THREE.Mesh(new THREE.ConeGeometry(3.2, 2.4, 4), roofMat);
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 4.2;
  barn.add(roof);

  const door = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.4, 0.2), new THREE.MeshStandardMaterial({ color: 0x4b2d1a }));
  door.position.set(0, 1.2, 2.02);
  barn.add(door);

  const hay = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 1.4, 10), new THREE.MeshStandardMaterial({ color: 0xd6aa5a }));
  hay.position.set(-1.2, 0.9, 1.5);
  barn.add(hay);

  const hay2 = hay.clone();
  hay2.position.x = 1.3;
  barn.add(hay2);

  barn.position.set(x, 0, z);
  scene.add(barn);
  return barn;
}

let barns = [];
for (let i = 0; i < 8; i++) {
  barns.push(createBarnAt((Math.random() - 0.5) * 160, (Math.random() - 0.5) * 160));
}

function createFenceLine(x, z, length, rotation = 0) {
  const group = new THREE.Group();
  const postMat = new THREE.MeshStandardMaterial({ color: 0x6f4a2e, roughness: 0.9 });
  const railMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.8 });
  const postGeo = new THREE.BoxGeometry(0.2, 1.6, 0.2);
  const railGeo = new THREE.BoxGeometry(0.12, 0.12, length);

  for (let i = 0; i < Math.ceil(length / 4); i++) {
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(-length / 2 + i * 4, 0.8, 0);
    group.add(post);
  }

  const topRail = new THREE.Mesh(railGeo, railMat);
  topRail.position.set(0, 1.3, 0);
  group.add(topRail);

  const midRail = topRail.clone();
  midRail.position.y = 0.8;
  group.add(midRail);

  const lowRail = topRail.clone();
  lowRail.position.y = 0.3;
  group.add(lowRail);

  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  scene.add(group);
  return group;
}

function createFarmhouseAt(x, z) {
  const group = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xd7b07b, roughness: 0.9 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x4a3327, roughness: 0.8 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(6.5, 3.8, 5.5), wallMat);
  body.position.y = 1.9;
  group.add(body);

  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.7, 2.8, 4), roofMat);
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 4.5;
  group.add(roof);

  const door = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.6, 0.2), new THREE.MeshStandardMaterial({ color: 0x5a392b }));
  door.position.set(0, 1.3, 2.75);
  group.add(door);

  const windowMat = new THREE.MeshStandardMaterial({ color: 0xfff4b5, emissive: 0x554400, roughness: 0.2 });
  const leftWindow = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 0.12), windowMat);
  leftWindow.position.set(-1.8, 2.3, 2.78);
  group.add(leftWindow);
  const rightWindow = leftWindow.clone();
  rightWindow.position.x = 1.8;
  group.add(rightWindow);

  group.position.set(x, 0, z);
  scene.add(group);
  return group;
}

function createSiloAt(x, z) {
  const group = new THREE.Group();
  const siloMat = new THREE.MeshStandardMaterial({ color: 0xc8d0d6, roughness: 0.7 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.7, 5.8, 18), siloMat);
  body.position.y = 2.9;
  group.add(body);

  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.8, 1.4, 18), new THREE.MeshStandardMaterial({ color: 0x888888 }));
  roof.position.y = 6.2;
  group.add(roof);

  group.position.set(x, 0, z);
  scene.add(group);
  return group;
}

function createWindmillAt(x, z) {
  const group = new THREE.Group();
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.5, 6, 20), new THREE.MeshStandardMaterial({ color: 0xf1e4d3, roughness: 0.8 }));
  tower.position.y = 3;
  group.add(tower);

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.2, 10), new THREE.MeshStandardMaterial({ color: 0x776655 }));
  hub.position.y = 6.2;
  hub.rotation.z = Math.PI / 2;
  group.add(hub);

  for (let i = 0; i < 4; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.15, 4.2, 1.1), new THREE.MeshStandardMaterial({ color: 0xf5f1e7, side: THREE.DoubleSide }));
    blade.position.set(0, 6.2, 0);
    blade.rotation.z = i * (Math.PI / 2);
    blade.rotation.y = i * (Math.PI / 2);
    group.add(blade);
  }

  group.position.set(x, 0, z);
  scene.add(group);
  return group;
}

const worldProps = [];
const windmills = [];
for (let i = 0; i < 6; i++) {
  worldProps.push(createFenceLine((Math.random() - 0.5) * 180, (Math.random() - 0.5) * 180, 25 + Math.random() * 18, Math.random() * Math.PI));
}
worldProps.push(createFarmhouseAt(-65, -20));
worldProps.push(createSiloAt(68, 36));
windmills.push(createWindmillAt(-90, 45));

const cowTexCanvas = document.createElement('canvas');
cowTexCanvas.width = 256;
cowTexCanvas.height = 256;
const ctxCow = cowTexCanvas.getContext('2d');
ctxCow.fillStyle = 'white';
ctxCow.fillRect(0, 0, 256, 256);
ctxCow.fillStyle = 'black';
ctxCow.beginPath();
ctxCow.arc(50, 50, 40, 0, Math.PI * 2);
ctxCow.fill();
ctxCow.beginPath();
ctxCow.arc(180, 80, 55, 0, Math.PI * 2);
ctxCow.fill();
ctxCow.beginPath();
ctxCow.arc(120, 200, 45, 0, Math.PI * 2);
ctxCow.fill();
ctxCow.beginPath();
ctxCow.arc(20, 180, 30, 0, Math.PI * 2);
ctxCow.fill();
const cowTex = new THREE.CanvasTexture(cowTexCanvas);
const cowMat = new THREE.MeshStandardMaterial({ map: cowTex, roughness: 0.8 });
const cowSnoutMat = new THREE.MeshStandardMaterial({ color: 0xffaacc, roughness: 0.6 });
const cowBodyGeo = new THREE.BoxGeometry(1.0, 0.75, 1.6);
const cowHeadGeo = new THREE.BoxGeometry(0.6, 0.6, 0.7);
const cowSnoutGeo = new THREE.BoxGeometry(0.4, 0.3, 0.2);
let cows = [];

function spawnCowAt(x, z) {
  const cowGroup = new THREE.Group();
  const body = new THREE.Mesh(cowBodyGeo, cowMat);
  body.position.y = 0.375;
  cowGroup.add(body);
  const head = new THREE.Mesh(cowHeadGeo, cowMat);
  head.position.set(0, 0.7, 0.9);
  cowGroup.add(head);
  const snout = new THREE.Mesh(cowSnoutGeo, cowSnoutMat);
  snout.position.set(0, 0.6, 1.3);
  cowGroup.add(snout);
  cowGroup.position.set(x, 0.1, z);
  cowGroup.rotation.y = Math.random() * Math.PI * 2;
  scene.add(cowGroup);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.9, 12), shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(x, 0.05, z);
  scene.add(shadow);
  cows.push({ group: cowGroup, shadow, latched: false });
}

for (let i = 0; i < 12; i++) {
  spawnCowAt((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100);
}

const pigMat = new THREE.MeshStandardMaterial({ color: 0xff99cc, roughness: 0.7 });
const pigSnoutMat = new THREE.MeshStandardMaterial({ color: 0xff66aa, roughness: 0.5 });
const pigBodyGeo = new THREE.BoxGeometry(0.8, 0.55, 1.2);
const pigHeadGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const pigSnoutGeo = new THREE.BoxGeometry(0.3, 0.2, 0.15);
let pigs = [];

function spawnPigAt(x, z) {
  const pigGroup = new THREE.Group();
  const body = new THREE.Mesh(pigBodyGeo, pigMat);
  body.position.y = 0.275;
  pigGroup.add(body);
  const head = new THREE.Mesh(pigHeadGeo, pigMat);
  head.position.set(0, 0.5, 0.7);
  pigGroup.add(head);
  const snout = new THREE.Mesh(pigSnoutGeo, pigSnoutMat);
  snout.position.set(0, 0.4, 0.96);
  pigGroup.add(snout);
  pigGroup.position.set(x, 0.1, z);
  pigGroup.rotation.y = Math.random() * Math.PI * 2;
  scene.add(pigGroup);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.7, 12), shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(x, 0.05, z);
  scene.add(shadow);
  pigs.push({ group: pigGroup, shadow, latched: false });
}

const farmerBodyGeo = new THREE.CylinderGeometry(0.55, 0.65, 2.2);
const farmerHeadGeo = new THREE.SphereGeometry(0.48);
const farmerHeadMat = new THREE.MeshStandardMaterial({ color: 0xffccaa });
const hatBrimGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.1, 16);
const hatTopGeo = new THREE.CylinderGeometry(0.5, 0.6, 0.6, 16);
const hatMat = new THREE.MeshStandardMaterial({ color: 0x5c4033 });
const starGeo = new THREE.TetrahedronGeometry(0.25);
const starMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });

function createFarmerAt(x, z) {
  const group = new THREE.Group();
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0x7b4b2a });
  const overallsMat = new THREE.MeshStandardMaterial({ color: 0x2d3a46 });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x1d1d1d });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf0c7a5 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 1.4, 12), shirtMat);
  body.position.y = 1.4;
  group.add(body);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.5), overallsMat);
  torso.position.y = 0.8;
  group.add(torso);

  const head = new THREE.Mesh(farmerHeadGeo, skinMat);
  head.position.y = 2.45;
  group.add(head);

  const hat = new THREE.Group();
  const brim = new THREE.Mesh(hatBrimGeo, hatMat);
  brim.position.y = 2.8;
  const top = new THREE.Mesh(hatTopGeo, hatMat);
  top.position.y = 3.12;
  hat.add(brim);
  hat.add(top);
  group.add(hat);

  const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.9, 8), shirtMat);
  leftArm.position.set(-0.65, 1.6, 0);
  leftArm.rotation.z = 0.9;
  group.add(leftArm);

  const rightArm = leftArm.clone();
  rightArm.position.x = 0.65;
  rightArm.rotation.z = -0.9;
  group.add(rightArm);

  const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 1.2, 8), bootMat);
  leftLeg.position.set(-0.18, 0.1, 0);
  group.add(leftLeg);

  const rightLeg = leftLeg.clone();
  rightLeg.position.x = 0.18;
  group.add(rightLeg);

  const pitchfork = new THREE.Group();
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.7, 8), new THREE.MeshStandardMaterial({ color: 0x8d6e63 }));
  handle.rotation.z = 0.7;
  handle.position.set(0.7, 1.6, 0.2);
  pitchfork.add(handle);
  for (let i = 0; i < 4; i++) {
    const tine = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.9, 0.05), new THREE.MeshStandardMaterial({ color: 0xd9d9d9 }));
    tine.position.set(0.7 + i * 0.07, 2.3 + i * 0.05, 0.15 + (i % 2) * 0.1);
    pitchfork.add(tine);
  }
  group.add(pitchfork);

  const starsGroup = new THREE.Group();
  for (let j = 0; j < 3; j++) {
    const star = new THREE.Mesh(starGeo, starMat);
    star.position.set(Math.cos(j * Math.PI * 2 / 3) * 0.8, 0, Math.sin(j * Math.PI * 2 / 3) * 0.8);
    starsGroup.add(star);
  }
  starsGroup.position.y = 3.6;
  starsGroup.visible = false;
  group.add(starsGroup);
  group.position.set(x, 0, z);
  scene.add(group);
  return { group, bodyMat: shirtMat, starsGroup, health: 2, maxHealth: 2, alive: true, stunned: false, stunTimer: 0, fireTimer: Math.random() * 100, flashTimer: 0, type: 'farmer', latched: false };
}

let farmers = [];
for (let i = 0; i < 10; i++) {
  farmers.push(createFarmerAt((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100));
}

function createBikerAt(x, z) {
  const group = new THREE.Group();
  const frameGeo = new THREE.BoxGeometry(1.2, 0.1, 0.1);
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.2 });
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.position.y = 0.5;
  group.add(frame);
  const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.1, 16);
  const wheelMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
  const w1 = new THREE.Mesh(wheelGeo, wheelMat);
  w1.rotation.x = Math.PI / 2;
  w1.position.set(0.6, 0.35, 0);
  group.add(w1);
  const w2 = new THREE.Mesh(wheelGeo, wheelMat);
  w2.rotation.x = Math.PI / 2;
  w2.position.set(-0.6, 0.35, 0);
  group.add(w2);
  const riderGeo = new THREE.CylinderGeometry(0.3, 0.35, 1.2);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2288ff });
  const rider = new THREE.Mesh(riderGeo, bodyMat);
  rider.position.y = 1.1;
  group.add(rider);
  const starsGroup = new THREE.Group();
  for (let j = 0; j < 3; j++) {
    const star = new THREE.Mesh(starGeo, starMat);
    star.position.set(Math.cos(j * Math.PI * 2 / 3) * 0.6, 0, Math.sin(j * Math.PI * 2 / 3) * 0.6);
    starsGroup.add(star);
  }
  starsGroup.position.y = 2.0;
  starsGroup.visible = false;
  group.add(starsGroup);
  group.position.set(x, 0, z);
  scene.add(group);
  const vel = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize().multiplyScalar(0.4);
  return { group, bodyMat, starsGroup, health: 3, maxHealth: 3, alive: true, stunned: false, stunTimer: 0, fireTimer: 0, flashTimer: 0, velocity: vel, type: 'biker', latched: false };
}

let bikers = [];
for (let i = 0; i < 3; i++) {
  bikers.push(createBikerAt((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100));
}

const batteryTexCanvas = document.createElement('canvas');
batteryTexCanvas.width = 256;
batteryTexCanvas.height = 256;
const ctxBat = batteryTexCanvas.getContext('2d');
ctxBat.fillStyle = '#667788';
ctxBat.fillRect(0, 0, 256, 256);
ctxBat.strokeStyle = '#445566';
ctxBat.lineWidth = 8;
ctxBat.strokeRect(4, 4, 248, 248);
ctxBat.fillStyle = '#ffff00';
ctxBat.beginPath();
ctxBat.moveTo(150, 40);
ctxBat.lineTo(80, 140);
ctxBat.lineTo(130, 140);
ctxBat.lineTo(100, 220);
ctxBat.lineTo(180, 110);
ctxBat.lineTo(130, 110);
ctxBat.closePath();
ctxBat.fill();
const batteryTex = new THREE.CanvasTexture(batteryTexCanvas);
const batteryMat = new THREE.MeshStandardMaterial({ map: batteryTex, metalness: 0.8, roughness: 0.2 });
const batteryGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
let batteries = [];

function spawnBatteryAt(x, z) {
  const bat = new THREE.Mesh(batteryGeo, batteryMat);
  bat.position.set(x, 0.6, z);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.8, 12), shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(x, 0.05, z);
  scene.add(shadow);
  scene.add(bat);
  batteries.push({ mesh: bat, shadow, latched: false });
}

for (let i = 0; i < 4; i++) {
  spawnBatteryAt((Math.random() - 0.5) * 90, (Math.random() - 0.5) * 90);
}

let fragmentParticles = [];
const fragGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
const fragMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
const boneGeo = new THREE.BoxGeometry(0.12, 0.4, 0.12);
const boneMat = new THREE.MeshBasicMaterial({ color: 0xeeeeee });

function spawnFarmerFragments(pos) {
  const totalFrags = 40 + (gameStats.weaponTier * 6);
  for (let i = 0; i < totalFrags; i++) {
    const isBone = Math.random() < 0.25;
    const frag = new THREE.Mesh(isBone ? boneGeo : fragGeo, isBone ? boneMat : fragMat);
    frag.position.copy(pos);
    frag.position.y += 1.0;
    frag.userData = {
      velocity: new THREE.Vector3((Math.random() - 0.5) * 1.0, Math.random() * 0.6 + 0.2, (Math.random() - 0.5) * 1.0),
      rotationSpeed: new THREE.Vector3(Math.random() * 0.5, Math.random() * 0.5, Math.random() * 0.5),
      life: 50 + Math.random() * 20,
    };
    scene.add(frag);
    fragmentParticles.push(frag);
  }
}

function spawnHitSplash(pos) {
  for (let i = 0; i < 10; i++) {
    const frag = new THREE.Mesh(fragGeo, fragMat);
    frag.position.copy(pos);
    frag.position.y += 1.0;
    frag.userData = {
      velocity: new THREE.Vector3((Math.random() - 0.5) * 0.5, Math.random() * 0.3 + 0.1, (Math.random() - 0.5) * 0.5),
      rotationSpeed: new THREE.Vector3(Math.random() * 0.2, Math.random() * 0.2, Math.random() * 0.2),
      life: 20,
    };
    scene.add(frag);
    fragmentParticles.push(frag);
  }
}

let ufoTrailParticles = [];
function spawnUfoTrail() {
  const color = new THREE.Color(getLaserColor(gameStats.weaponTier));
  const p = new THREE.Mesh(
    new THREE.SphereGeometry(0.16 + (gameStats.weaponTier * 0.02), 8, 8),
    new THREE.MeshBasicMaterial({ color })
  );
  p.position.copy(ufoGroup.position);
  p.position.y = 0.1;
  p.position.x += (Math.random() - 0.5) * 1.8;
  p.position.z += (Math.random() - 0.5) * 1.8;
  p.userData = {
    velocity: new THREE.Vector3((Math.random() - 0.5) * 0.12, Math.random() * 0.09 + 0.02, (Math.random() - 0.5) * 0.12),
    life: 20,
  };
  scene.add(p);
  ufoTrailParticles.push(p);
}

let floatingTexts = [];

function spawnFloatingText(text, color, pos3D) {
  const layer = document.getElementById('floating-text-layer');
  const span = document.createElement('span');
  span.className = 'floating-text';
  span.innerText = text;
  span.style.color = color;
  layer.appendChild(span);
  const startPos = pos3D.clone();
  startPos.y += 1.5;
  floatingTexts.push({ el: span, pos: startPos, life: 60, maxLife: 60 });
}

let boss = null;
let bossProjectiles = [];

function createBossAt(x, z) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff4d4d, emissive: 0x330000, metalness: 0.85, roughness: 0.25 });

  const core = new THREE.Mesh(new THREE.CylinderGeometry(4.8, 6.2, 6.2, 24), bodyMat);
  core.position.y = 3.2;
  group.add(core);

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(5.6, 22, 22),
    new THREE.MeshBasicMaterial({ color: 0xff5522, transparent: true, opacity: 0.18 })
  );
  glow.position.y = 3.2;
  group.add(glow);

  const eye = new THREE.Mesh(new THREE.SphereGeometry(2.2, 18, 18), new THREE.MeshBasicMaterial({ color: 0xfff2a8 }));
  eye.position.set(0, 4.3, 3.2);
  group.add(eye);

  const wingGeo = new THREE.BoxGeometry(12, 0.6, 2.4);
  const wingMat = new THREE.MeshStandardMaterial({ color: 0x881111, metalness: 0.9, roughness: 0.2 });
  const leftWing = new THREE.Mesh(wingGeo, wingMat);
  leftWing.position.set(-8.5, 2.7, 0);
  leftWing.rotation.z = 0.35;
  group.add(leftWing);
  const rightWing = new THREE.Mesh(wingGeo, wingMat);
  rightWing.position.set(8.5, 2.7, 0);
  rightWing.rotation.z = -0.35;
  group.add(rightWing);

  const ringGeo = new THREE.TorusGeometry(7.5, 0.35, 16, 60);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.7 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 1.6;
  group.add(ring);

  const turretGeo = new THREE.CylinderGeometry(0.55, 0.55, 1.8, 12);
  const turretMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.2 });
  for (let i = 0; i < 4; i++) {
    const turret = new THREE.Mesh(turretGeo, turretMat);
    turret.position.set(Math.cos(i * Math.PI / 2) * 2.8, 3.2, Math.sin(i * Math.PI / 2) * 2.8);
    turret.rotation.x = Math.PI / 2;
    group.add(turret);
  }

  group.position.set(x, 8, z);
  scene.add(group);

  return {
    group,
    glow,
    ring,
    health: 180 + (gameStats.level * 30),
    maxHealth: 180 + (gameStats.level * 30),
    alive: true,
    fireTimer: 0,
    phase: 1,
    introTimer: 120,
    sway: 0,
  };
}

function spawnBossBattle() {
  if (boss) return;
  const spawnX = ufoGroup.position.x;
  const spawnZ = ufoGroup.position.z - 44;
  boss = createBossAt(spawnX, spawnZ);
  spawnFloatingText('BOSS ALERT!', '#ff0000', boss.group.position);
  sndMothership();
}

function handleBossDefeat() {
  if (!boss || !boss.alive) return;
  boss.alive = false;
  boss.group.visible = false;
  bossProjectiles.forEach((projectile) => scene.remove(projectile));
  bossProjectiles.length = 0;
  gameStats.score += 1000;
  gameStats.level += 1;
  spawnFloatingText('BOSS DESTROYED!', '#00ff66', boss.group.position);
  const bannerOverlay = document.getElementById('levelup-overlay');
  const bannerText = document.getElementById('levelup-banner');
  bannerText.innerText = `BOSS DOWN! LEVEL ${gameStats.level} UNLOCKED!`;
  bannerOverlay.style.display = 'block';
  document.getElementById('instructions').innerHTML = "<span style='color:#00ff66; font-size:20px;'>BOSS DEFEATED! CHASE THE NEXT THREAT!</span>";
  setTimeout(() => {
    bannerOverlay.style.display = 'none';
    openShop();
  }, 2200);
  boss = null;
  updateHUDGraphics();
}

function fireBossShot() {
  if (!boss || !boss.alive) return;
  const shot = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 12), new THREE.MeshBasicMaterial({ color: 0xff6600 }));
  shot.position.copy(boss.group.position);
  shot.position.y += 1.5;
  const dir = new THREE.Vector3().subVectors(ufoGroup.position, shot.position).normalize();
  const speed = boss.phase === 2 ? 0.68 : 0.52;
  shot.userData = { velocity: dir.multiplyScalar(speed), life: 220, damage: boss.phase === 2 ? 22 : 16 };
  scene.add(shot);
  bossProjectiles.push(shot);
}

let projectiles = [];
let ufoLasers = [];
const projGeo = new THREE.SphereGeometry(0.4, 10, 10);
const projMat = new THREE.MeshBasicMaterial({ color: 0xff2200 });
let keys = {};
let lastFireTime = 0;
let gameStarted = false;
let crashed = false;

const COWS_NEEDED = 10;
const PIGS_NEEDED = 5;
const FARMERS_NEEDED = 10;
const KILLS_NEEDED = 20;
const MAX_ENERGY = 5000;
const getMaxEnergy = () => MAX_ENERGY + (gameStats ? gameStats.shieldLevel * 650 : 0);

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

let mothershipState = 'waiting';
let shopOpen = false;
let shopDefs = [
  { id: 'shield', name: 'Shield Upgrade', desc: '+650 max energy core', basePrice: 250, getPrice: (lvl) => 250 + lvl * 180, apply: () => { gameStats.shieldLevel += 1; gameStats.energy = Math.min(getMaxEnergy(), gameStats.energy + 400); } },
  { id: 'weapon', name: 'Laser Upgrade', desc: 'Boost weapon tier and plasma output', basePrice: 300, getPrice: (lvl) => 300 + lvl * 220, apply: () => { gameStats.weaponTier += 1; } },
  { id: 'speed', name: 'Thruster Upgrade', desc: '+12% movement and boost speed', basePrice: 320, getPrice: (lvl) => 320 + lvl * 240, apply: () => { gameStats.speedLevel += 1; } },
  { id: 'ufo', name: 'UFO Model', desc: 'New saucer shell and combat glow', basePrice: 420, getPrice: (lvl) => 420 + lvl * 260, apply: () => { gameStats.ufoModelLevel += 1; } },
];

function getShopState() {
  return {
    shield: gameStats.shieldLevel,
    weapon: gameStats.weaponTier - 1,
    speed: gameStats.speedLevel,
    ufo: gameStats.ufoModelLevel,
  };
}

function renderShop() {
  const shopItems = document.getElementById('shop-items');
  const moneyDisplay = document.getElementById('shop-money');
  moneyDisplay.textContent = `MONEY: $${gameStats.money}`;
  shopItems.innerHTML = '';

  shopDefs.forEach((shopDef) => {
    const state = getShopState();
    const level = state[shopDef.id] || 0;
    const price = shopDef.getPrice(level);
    const item = document.createElement('div');
    item.className = 'shop-item';
    item.innerHTML = `
      <div>
        <div class="shop-item-name">${shopDef.name} ${level > 0 ? `Lv.${level + 1}` : ''}</div>
        <div class="shop-item-desc">${shopDef.desc}</div>
      </div>
      <div class="shop-item-price">$${price}</div>
      <button type="button" ${gameStats.money >= price ? '' : 'disabled'}>${gameStats.money >= price ? 'BUY' : 'LOCKED'}</button>
    `;
    const btn = item.querySelector('button');
    btn.addEventListener('click', () => {
      if (gameStats.money < price) return;
      gameStats.money -= price;
      shopDef.apply();
      renderShop();
      updateHUDGraphics();
    });
    shopItems.appendChild(item);
  });
}

function openShop() {
  shopOpen = true;
  gameStarted = false;
  const shopOverlay = document.getElementById('shop-overlay');
  renderShop();
  shopOverlay.style.display = 'flex';
}

function closeShop() {
  shopOpen = false;
  const shopOverlay = document.getElementById('shop-overlay');
  shopOverlay.style.display = 'none';
  gameStarted = true;
  updateHUDGraphics();
}

function purchaseCargoBonus(count, type) {
  const values = { cow: 40, pig: 85, farmer: 150, biker: 180 };
  const payout = count * (values[type] || 0);
  if (payout > 0) {
    gameStats.money += payout;
    spawnFloatingText(`+$${payout}`, '#ffd166', ufoGroup.position);
  }
}

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

function updateHUDGraphics() {
  hudCtx.clearRect(0, 0, 1024, 512);
  hudCtx.fillStyle = '#03070b';
  hudCtx.fillRect(0, 0, 1024, 512);
  hudCtx.strokeStyle = 'rgba(0, 255, 102, 0.15)';
  hudCtx.lineWidth = 1;
  for (let i = 0; i < 1024; i += 32) {
    hudCtx.strokeRect(i, 0, 1, 512);
  }
  for (let i = 0; i < 512; i += 32) {
    hudCtx.strokeRect(0, i, 1024, 1);
  }

  hudCtx.strokeStyle = '#005522';
  hudCtx.lineWidth = 12;
  hudCtx.strokeRect(6, 6, 1012, 500);
  hudCtx.shadowBlur = 15;
  hudCtx.shadowColor = '#00ff66';
  hudCtx.strokeStyle = '#00ff66';
  hudCtx.lineWidth = 4;
  hudCtx.strokeRect(16, 16, 992, 480);

  hudCtx.font = 'bold 28px Courier New';
  hudCtx.textAlign = 'left';

  hudCtx.fillStyle = '#00ff66';
  hudCtx.shadowColor = '#00ff66';
  hudCtx.fillText(`SCR: ${gameStats.score.toString().padStart(5, '0')}`, 40, 60);

  hudCtx.fillStyle = '#ffd166';
  hudCtx.shadowColor = '#ffd166';
  hudCtx.fillText(`MNY: $${gameStats.money}`, 280, 60);

  hudCtx.fillStyle = '#ffcc00';
  hudCtx.shadowColor = '#ffcc00';
  hudCtx.fillText(`LVL: ${gameStats.level.toString().padStart(2, '0')}`, 520, 60);

  hudCtx.fillText('LVS:', 700, 60);
  hudCtx.shadowBlur = 0;
  for (let i = 0; i < 3; i++) {
    hudCtx.strokeStyle = '#ffcc00';
    hudCtx.strokeRect(580 + (i * 35), 35, 25, 25);
    if (i < gameStats.lives) {
      hudCtx.fillStyle = '#ffcc00';
      hudCtx.fillRect(583 + (i * 35), 38, 19, 19);
    }
  }

  const wColorHex = `#${getLaserColor(gameStats.weaponTier).toString(16).padStart(6, '0')}`;
  hudCtx.fillStyle = wColorHex;
  hudCtx.shadowColor = wColorHex;
  hudCtx.shadowBlur = 15;
  if (gameStats.overclockTimer > 0) {
    hudCtx.fillStyle = '#ff99cc';
    hudCtx.shadowColor = '#ff99cc';
    hudCtx.fillText('*OVERCLOCK*', 750, 60);
  } else {
    hudCtx.fillText(`WPN: TIER ${gameStats.weaponTier}`, 750, 60);
  }

  const enPct = Math.max(0, gameStats.energy) / getMaxEnergy();
  const enCol = enPct > 0.5 ? '#00ff66' : (enPct > 0.2 ? '#ffff00' : '#ff0000');
  hudCtx.fillStyle = enCol;
  hudCtx.shadowColor = enCol;
  hudCtx.fillText(`CORE: ${Math.floor(enPct * 100)}%`, 40, 130);
  hudCtx.strokeStyle = enCol;
  hudCtx.strokeRect(220, 105, 750, 30);
  hudCtx.shadowBlur = 0;
  for (let i = 0; i < 36; i++) {
    if (i / 36 < enPct) {
      hudCtx.fillStyle = enCol;
      hudCtx.fillRect(225 + (i * 20.6), 110, 16, 20);
    }
  }

  hudCtx.shadowBlur = 10;
  hudCtx.fillStyle = '#ff00ff';
  hudCtx.shadowColor = '#ff00ff';
  hudCtx.strokeStyle = '#ff00ff';
  hudCtx.fillText('BST:', 40, 200);
  hudCtx.strokeRect(120, 175, 340, 30);
  hudCtx.shadowBlur = 0;
  hudCtx.fillRect(123, 178, (gameStats.boostMeter / 100) * 334, 24);

  const killProg = Math.min(gameStats.farmersKilled, KILLS_NEEDED);
  const kCol = killProg >= KILLS_NEEDED ? '#00ff66' : '#ff2200';
  hudCtx.shadowBlur = 10;
  hudCtx.fillStyle = kCol;
  hudCtx.shadowColor = kCol;
  hudCtx.strokeStyle = kCol;
  hudCtx.fillText(`SEC: ${killProg}/${KILLS_NEEDED}`, 520, 200);
  hudCtx.strokeRect(710, 175, 260, 30);
  hudCtx.shadowBlur = 0;
  hudCtx.fillRect(713, 178, (killProg / KILLS_NEEDED) * 254, 24);

  if (boss && boss.alive) {
    hudCtx.shadowBlur = 12;
    hudCtx.fillStyle = '#ff6666';
    hudCtx.shadowColor = '#ff6666';
    hudCtx.fillText('BOSS:', 40, 250);
    hudCtx.strokeStyle = '#ff6666';
    hudCtx.strokeRect(150, 225, 760, 26);
    hudCtx.fillRect(153, 228, (boss.health / boss.maxHealth) * 754, 20);
    hudCtx.fillStyle = '#fff';
    hudCtx.font = 'bold 22px Courier New';
    hudCtx.fillText(`${Math.ceil(boss.health)} / ${boss.maxHealth}`, 640, 246);
    hudCtx.font = 'bold 28px Courier New';
  }

  hudCtx.shadowBlur = 15;
  hudCtx.textAlign = 'center';
  hudCtx.fillStyle = '#00ffff';
  hudCtx.shadowColor = '#00ffff';
  hudCtx.fillText('--- CARGO HOLD ---', 512, 290);

  hudCtx.textAlign = 'left';
  hudCtx.shadowBlur = 0;

  const totalCows = Math.min(gameStats.msQuota.cows + gameStats.cargo.cows, COWS_NEEDED);
  hudCtx.font = '36px Arial';
  hudCtx.fillText('🐮', 40, 355);
  hudCtx.strokeStyle = '#00ffff';
  hudCtx.strokeRect(100, 325, 200, 35);
  hudCtx.fillStyle = '#00ffff';
  hudCtx.shadowBlur = 10;
  hudCtx.shadowColor = '#00ffff';
  hudCtx.fillRect(104, 329, (totalCows / COWS_NEEDED) * 192, 27);
  hudCtx.fillStyle = '#fff';
  hudCtx.font = 'bold 20px Courier New';
  hudCtx.shadowBlur = 0;
  hudCtx.fillText(`${totalCows}/${COWS_NEEDED}`, 160, 349);

  const activePigsNeeded = gameStats.level >= 2 ? PIGS_NEEDED : 0;
  if (gameStats.level >= 2) {
    const totalPigs = Math.min(gameStats.msQuota.pigs + gameStats.cargo.pigs, activePigsNeeded);
    hudCtx.font = '36px Arial';
    hudCtx.fillText('🐷', 360, 355);
    hudCtx.strokeStyle = '#ff99cc';
    hudCtx.strokeRect(420, 325, 200, 35);
    hudCtx.fillStyle = '#ff99cc';
    hudCtx.shadowBlur = 10;
    hudCtx.shadowColor = '#ff99cc';
    hudCtx.fillRect(424, 329, (totalPigs / activePigsNeeded) * 192, 27);
    hudCtx.fillStyle = '#fff';
    hudCtx.font = 'bold 20px Courier New';
    hudCtx.shadowBlur = 0;
    hudCtx.fillText(`${totalPigs}/${activePigsNeeded}`, 480, 349);
  }

  const activeFarmersNeeded = gameStats.level >= 3 ? FARMERS_NEEDED : 0;
  if (gameStats.level >= 3) {
    const totalFarmers = Math.min(gameStats.msQuota.farmers + gameStats.cargo.farmers, activeFarmersNeeded);
    hudCtx.font = '36px Arial';
    hudCtx.fillText('🤠', 680, 355);
    hudCtx.strokeStyle = '#ffaa00';
    hudCtx.strokeRect(740, 325, 200, 35);
    hudCtx.fillStyle = '#ffaa00';
    hudCtx.shadowBlur = 10;
    hudCtx.shadowColor = '#ffaa00';
    hudCtx.fillRect(744, 329, (totalFarmers / activeFarmersNeeded) * 192, 27);
    hudCtx.fillStyle = '#fff';
    hudCtx.font = 'bold 20px Courier New';
    hudCtx.shadowBlur = 0;
    hudCtx.fillText(`${totalFarmers}/${activeFarmersNeeded}`, 800, 349);
  }

  hudTex.needsUpdate = true;
}

function triggerLevelUp() {
  gameStats.level += 1;
  gameStats.cargo = { cows: 0, pigs: 0, farmers: 0 };
  gameStats.msQuota = { cows: 0, pigs: 0, farmers: 0 };
  gameStats.farmersKilled = 0;
  gameStats.energy = getMaxEnergy();

  farmers.forEach((f) => {
    f.maxHealth = 2 + Math.floor((gameStats.level - 1) * 2);
    f.health = f.maxHealth;
    f.alive = true;
    f.stunned = false;
    f.starsGroup.visible = false;
    f.group.visible = true;
  });

  bikers.forEach((b) => {
    b.maxHealth = 3 + Math.floor((gameStats.level - 1) * 2);
    b.health = b.maxHealth;
    b.alive = true;
    b.stunned = false;
    b.starsGroup.visible = false;
    b.group.visible = true;
  });

  updateHUDGraphics();
  document.getElementById('return-alert').style.display = 'none';
  const bannerOverlay = document.getElementById('levelup-overlay');
  const bannerText = document.getElementById('levelup-banner');
  const isBossLevel = gameStats.level >= 4 && ((gameStats.level - 4) % 3 === 0);

  if (gameStats.level === 2) {
    bannerText.innerText = 'LEVEL 2: PIGS UNLOCKED!';
    for (let i = 0; i < 8; i++) {
      spawnPigAt(ufoGroup.position.x + (Math.random() - 0.5) * 100, ufoGroup.position.z + (Math.random() - 0.5) * 100);
    }
  } else if (gameStats.level === 3) {
    bannerText.innerText = 'LEVEL 3: FARMER ABDUCTION!';
  } else if (isBossLevel) {
    bannerText.innerText = `LEVEL ${gameStats.level}: BOSS INCURSION!`;
    spawnBossBattle();
  } else {
    bannerText.innerText = `LEVEL ${gameStats.level} REACHED!`;
  }
  bannerOverlay.style.display = 'block';
  sndLevelUpJingle();

  setTimeout(() => {
    bannerOverlay.style.display = 'none';
    if (!boss) {
      openShop();
    }
  }, 2200);

  msGroup.position.set(ufoGroup.position.x + 120 + Math.random() * 50, 3.75, ufoGroup.position.z - 120 - Math.random() * 50);
  mothershipState = 'waiting';
}

function resetGame() {
  crashed = false;
  ufoGroup.rotation.set(0, 0, 0);
  ufoGroup.position.y = 9;
  if (gameStats.lives > 0) {
    gameStats.lives -= 1;
  } else {
    gameStats.lives = 3;
    gameStats.score = 0;
    gameStats.money = 0;
    gameStats.level = 1;
    gameStats.weaponTier = 1;
    gameStats.shieldLevel = 0;
    gameStats.speedLevel = 0;
    gameStats.ufoModelLevel = 0;
    gameStats.cargo = { cows: 0, pigs: 0, farmers: 0 };
    gameStats.msQuota = { cows: 0, pigs: 0, farmers: 0 };
    gameStats.farmersKilled = 0;
    farmers.forEach((f) => {
      f.maxHealth = 2;
      f.health = f.maxHealth;
      f.alive = true;
      f.stunned = false;
      f.starsGroup.visible = false;
      f.group.visible = true;
    });
    bikers.forEach((b) => {
      b.maxHealth = 3;
      b.health = b.maxHealth;
      b.alive = true;
      b.stunned = false;
      b.starsGroup.visible = false;
      b.group.visible = true;
    });
  }
  gameStats.energy = getMaxEnergy();
  document.getElementById('instructions').innerText = "Desktop: WASD to Fly | SPACE = Tractor Beam | B = Lasers | SHIFT = Boost";
  sndRecharge();
  updateHUDGraphics();
}

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

function fireManualLaser() {
  let livingTargets = [];
  if (boss && boss.alive) {
    const bossInRange = boss.group.position.z < ufoGroup.position.z + 12 && boss.group.position.z > ufoGroup.position.z - 75 && Math.abs(ufoGroup.position.x - boss.group.position.x) < 55;
    if (bossInRange) livingTargets.push(boss);
  }
  farmers.forEach((f) => {
    if (f.alive && !f.stunned && f.group.position.z < ufoGroup.position.z + 12 && f.group.position.z > ufoGroup.position.z - 75) livingTargets.push(f);
  });
  bikers.forEach((b) => {
    if (b.alive && !b.stunned && b.group.position.z < ufoGroup.position.z + 12 && b.group.position.z > ufoGroup.position.z - 75) livingTargets.push(b);
  });
  livingTargets.sort((a, b) => ufoGroup.position.distanceTo(a.group.position) - ufoGroup.position.distanceTo(b.group.position));

  const shotsToFire = Math.min(gameStats.weaponTier, Math.max(1, livingTargets.length));
  gameStats.energy -= (shotsToFire * 0.5);
  updateHUDGraphics();

  const laserColor = getLaserColor(gameStats.weaponTier);
  const scaleVal = 1 + (gameStats.weaponTier * 0.15);
  for (let i = 0; i < shotsToFire; i++) {
    const laserMat = new THREE.MeshBasicMaterial({ color: laserColor });
    const laser = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.8), laserMat);
    laser.scale.set(scaleVal, 1, scaleVal);
    laser.position.copy(ufoGroup.position);
    let dmg = gameStats.weaponTier;
    if (livingTargets.length > i) {
      const target = livingTargets[i];
      const dir = new THREE.Vector3().subVectors(target.group.position, laser.position).normalize();
      laser.userData = { velocity: dir.multiplyScalar(1.6), targetRef: target, damage: dmg };
    } else {
      laser.userData = { velocity: new THREE.Vector3((i - 1) * 0.2, -0.5, -0.5).normalize().multiplyScalar(1.6), targetRef: null, damage: dmg };
    }
    laser.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), laser.userData.velocity.clone().normalize());
    scene.add(laser);
    ufoLasers.push(laser);
  }
  sndLaser(gameStats.weaponTier);
}

function updateGame() {
  if (!gameStarted) return;

  if (gameStats.energy <= 0) {
    if (!crashed) {
      crashed = true;
      tractorBeam.visible = false;
      stopTractorHum();
      if (gameStats.lives > 0) {
        document.getElementById('instructions').innerHTML = `<span style='color:red; font-size:20px;'>SYSTEM FAILURE! PRESS 'R' TO REBOOT (LIVES REMAINING: ${gameStats.lives})</span>`;
      } else {
        document.getElementById('instructions').innerHTML = "<span style='color:red; font-size:20px;'>GAME OVER! PRESS 'R' TO RESTART</span>";
      }
    }
    ufoGroup.rotation.y += 0.1;
    ufoGroup.rotation.x += 0.05;
    if (ufoGroup.position.y > 0) ufoGroup.position.y -= 0.2;
    renderer.render(scene, camera);
    return;
  }

  gameStats.energy -= 0.01;
  const speedBoostMod = 1 + (gameStats.speedLevel * 0.12);
  let speed = 0.18 * speedBoostMod;
  let moving = false;
  if (keys.shift && gameStats.boostMeter > 0) {
    speed = (0.50 * speedBoostMod);
    gameStats.boostMeter -= 0.6;
  }
  if (keys.arrowleft || keys.a) { ufoGroup.position.x -= speed; moving = true; }
  if (keys.arrowright || keys.d) { ufoGroup.position.x += speed; moving = true; }
  if (keys.arrowup || keys.w) { ufoGroup.position.z -= speed; moving = true; }
  if (keys.arrowdown || keys.s) { ufoGroup.position.z += speed; moving = true; }
  if (Math.abs(joyX) > 0.05) { ufoGroup.position.x += joyX * speed; moving = true; }
  if (Math.abs(joyY) > 0.05) { ufoGroup.position.z += joyY * speed; moving = true; }

  if (moving) gameStats.energy -= 0.05;
  if (tractorBeam.visible) gameStats.energy -= 0.15;
  gameStats.energy = Math.min(getMaxEnergy(), gameStats.energy);

  const weaponColor = new THREE.Color(getLaserColor(gameStats.weaponTier));
  saucerMat.emissive.copy(weaponColor.clone().multiplyScalar(0.15));
  domeMesh.material.emissive.copy(weaponColor.clone().multiplyScalar(0.25));
  ufoGlow.material.color.copy(weaponColor);
  ufoGlow.scale.setScalar(1 + (gameStats.weaponTier * 0.08));
  ufoOrbiters.forEach((orb, index) => {
    const t = Date.now() * 0.0025 + orb.userData.angle;
    orb.position.set(
      Math.cos(t) * orb.userData.radius,
      orb.userData.height + Math.sin(t * 2.1 + index) * 0.45,
      Math.sin(t) * orb.userData.radius
    );
    orb.material.color.copy(weaponColor.clone().offsetHSL(index * 0.05, 0.28, 0.08));
    orb.scale.setScalar(0.9 + Math.sin(Date.now() * 0.01 + index) * 0.2 + (gameStats.weaponTier * 0.04));
  });
  ufoThrusterL.material.color.copy(weaponColor.clone().offsetHSL(0.1, 0.2, 0));
  ufoThrusterR.material.color.copy(weaponColor.clone().offsetHSL(0.1, 0.2, 0));

  updateHUDGraphics();

  camera.position.x = ufoGroup.position.x;
  camera.position.z = ufoGroup.position.z + 28;
  terrain.position.x = ufoGroup.position.x;
  terrain.position.z = ufoGroup.position.z;

  const hue = (Date.now() * 0.0001) % 1;
  scene.background.setHSL(hue, 0.4, 0.08);
  trackerGroup.lookAt(msGroup.position);
  if (gameStats.overclockTimer > 0) gameStats.overclockTimer -= 1;

  for (let i = 0; i < windmills.length; i++) {
    windmills[i].rotation.y += 0.01 + i * 0.001;
  }

  if (Math.random() < 0.25) spawnUfoTrail();
  for (let i = ufoTrailParticles.length - 1; i >= 0; i--) {
    const p = ufoTrailParticles[i];
    p.position.add(p.userData.velocity);
    p.userData.life -= 1;
    p.scale.multiplyScalar(0.96);
    if (p.userData.life <= 0) {
      scene.remove(p);
      ufoTrailParticles.splice(i, 1);
    }
  }

  dashLights.forEach((dl) => {
    const intensity = (Math.sin(Date.now() * 0.005 * 2 + dl.offset) + 1) / 2;
    dl.mesh.material.color.setHSL(0.5, 1.0, intensity * 0.4 + 0.1);
  });

  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i];
    ft.life -= 1;
    if (ft.life <= 0) {
      if (ft.el.parentNode) ft.el.parentNode.removeChild(ft.el);
      floatingTexts.splice(i, 1);
      continue;
    }
    ft.pos.y += 0.04;
    const tempV = ft.pos.clone();
    tempV.project(camera);
    if (tempV.z > 1) {
      ft.el.style.display = 'none';
    } else {
      ft.el.style.display = 'inline-block';
      const x = ((tempV.x * 0.5 + 0.5) * window.innerWidth);
      const y = ((tempV.y * -0.5 + 0.5) * window.innerHeight);
      ft.el.style.left = `${x}px`;
      ft.el.style.top = `${y}px`;
      ft.el.style.opacity = String(ft.life / ft.maxLife);
    }
  }

  const activePigsNeeded = gameStats.level >= 2 ? PIGS_NEEDED : 0;
  const activeFarmersNeeded = gameStats.level >= 3 ? FARMERS_NEEDED : 0;
  const cargoFull = (gameStats.msQuota.cows + gameStats.cargo.cows >= COWS_NEEDED && gameStats.msQuota.pigs + gameStats.cargo.pigs >= activePigsNeeded && gameStats.msQuota.farmers + gameStats.cargo.farmers >= activeFarmersNeeded);

  if (cargoFull && mothershipState === 'waiting') {
    const tempV = ufoGroup.position.clone();
    tempV.project(camera);
    const alertEl = document.getElementById('return-alert');
    if (tempV.z <= 1) {
      alertEl.style.display = 'block';
      alertEl.style.left = `${((tempV.x * 0.5 + 0.5) * window.innerWidth)}px`;
      alertEl.style.top = `${((tempV.y * -0.5 + 0.5) * window.innerHeight)}px`;
    } else {
      alertEl.style.display = 'none';
    }

    const domeTime = Date.now() * 0.0005;
    const hue = (domeTime % 1 + 1) % 1;
    const pulse = 0.5 + Math.sin(Date.now() * 0.01) * 0.25;
    domeMesh.material.color.setHSL(hue, 1.0, 0.6 + pulse * 0.12);
    domeMesh.material.emissive.setHSL(hue, 1.0, 0.3 + pulse * 0.2);
    domeMesh.material.opacity = 0.7 + pulse * 0.28;
  } else {
    document.getElementById('return-alert').style.display = 'none';
    domeMesh.material.color.setHex(0x88ffff);
    domeMesh.material.emissive.setHex(0x1a3333);
    domeMesh.material.opacity = 0.95;
  }

  if (boss && boss.alive) {
    if (boss.introTimer > 0) {
      boss.introTimer -= 1;
      boss.group.position.x = ufoGroup.position.x + Math.sin(Date.now() * 0.01) * 4;
      boss.group.position.z = ufoGroup.position.z - 42 + Math.cos(Date.now() * 0.015) * 2;
      boss.group.position.y = 8 + Math.sin(Date.now() * 0.01) * 2;
      if (boss.introTimer === 0) {
        spawnFloatingText('PHASE 2!', '#ffff00', boss.group.position);
      }
    } else {
      boss.group.position.x = ufoGroup.position.x + Math.sin(Date.now() * 0.0015) * 10;
      boss.group.position.z = ufoGroup.position.z - 42 + Math.cos(Date.now() * 0.0018) * 4;
      boss.group.position.y = 8 + Math.sin(Date.now() * 0.004) * 1.3;
    }
    boss.group.rotation.y = Math.sin(Date.now() * 0.002) * 0.8;
    if (boss.glow) {
      boss.glow.scale.setScalar(1 + Math.sin(Date.now() * 0.005) * 0.12);
    }
    if (boss.ring) {
      boss.ring.rotation.z += 0.03;
    }
    if (boss.health <= boss.maxHealth * 0.5 && boss.phase === 1) {
      boss.phase = 2;
      spawnFloatingText('PHASE 2!', '#ff9900', boss.group.position);
      gameStats.boostMeter = 100;
      sndPowerup();
    }
    boss.fireTimer += 1;
    const attackDelay = boss.phase === 2 ? 26 : 46;
    if (boss.fireTimer > attackDelay) {
      boss.fireTimer = 0;
      fireBossShot();
      if (boss.phase === 2 && Math.random() < 0.4) {
        fireBossShot();
      }
    }
  }

  const msTime = Date.now() * 0.005;
  msLights.forEach((light, i) => {
    const intensity = (Math.sin(msTime + i) + 1) / 2;
    light.material.color.setHSL((msTime * 0.1) % 1, 1, intensity * 0.8 + 0.2);
  });
  msDome.material.color.setHSL((msTime * 0.02) % 1, 1, 0.5);

  if (mothershipState === 'waiting') {
    if (ufoGroup.position.distanceTo(msGroup.position) < 18) {
      const cargoBeforeUnload = {
        cows: gameStats.cargo.cows,
        pigs: gameStats.cargo.pigs,
        farmers: gameStats.cargo.farmers,
      };
      if (cargoBeforeUnload.cows > 0 || cargoBeforeUnload.pigs > 0 || cargoBeforeUnload.farmers > 0) {
        gameStats.msQuota.cows = Math.min(COWS_NEEDED, gameStats.msQuota.cows + cargoBeforeUnload.cows);
        gameStats.msQuota.pigs = Math.min(activePigsNeeded, gameStats.msQuota.pigs + cargoBeforeUnload.pigs);
        gameStats.msQuota.farmers = Math.min(activeFarmersNeeded, gameStats.msQuota.farmers + cargoBeforeUnload.farmers);
        const unloadMoney = {
          cows: cargoBeforeUnload.cows * 40,
          pigs: cargoBeforeUnload.pigs * 85,
          farmers: cargoBeforeUnload.farmers * 150,
        };
        const payout = unloadMoney.cows + unloadMoney.pigs + unloadMoney.farmers;
        if (payout > 0) {
          gameStats.money += payout;
          spawnFloatingText(`+$${payout}`, '#ffd166', msGroup.position);
        }
        gameStats.cargo = { cows: 0, pigs: 0, farmers: 0 };
        updateHUDGraphics();
        sndPowerup();
        spawnFloatingText('CARGO SECURED!', '#ffff00', msGroup.position);
      }

      const killsFull = (gameStats.farmersKilled >= KILLS_NEEDED);
      if (cargoFull && killsFull) {
        mothershipState = 'liftoff';
        sndMothership();
      } else if (cargoFull && !killsFull) {
        if (Math.random() < 0.05) {
          spawnFloatingText(`NEED ${KILLS_NEEDED} KILLS!`, '#ff2200', msGroup.position);
        }
      }
    }
  } else if (mothershipState === 'liftoff') {
    msGroup.position.y += 0.3;
    if (msGroup.position.y > 150) triggerLevelUp();
  }

  obstacles.forEach((obj) => {
    if (Math.abs(ufoGroup.position.x - obj.position.x) > 90) obj.position.x += (ufoGroup.position.x > obj.position.x ? 180 : -180);
    if (Math.abs(ufoGroup.position.z - obj.position.z) > 90) obj.position.z += (ufoGroup.position.z > obj.position.z ? 180 : -180);
  });

  const fireThreshold = Math.max(30, 120 - (gameStats.level * 10));
  const bulletSpeed = 0.22 + (gameStats.level * 0.04);
  const allEnemies = farmers.concat(bikers);

  for (const f of allEnemies) {
    let wrapped = false;
    if (f.group.position.x > ufoGroup.position.x + 60) { f.group.position.x -= 120; wrapped = true; }
    if (f.group.position.x < ufoGroup.position.x - 60) { f.group.position.x += 120; wrapped = true; }
    if (f.group.position.z > ufoGroup.position.z + 18) { f.group.position.z -= 100; f.group.position.x = ufoGroup.position.x + (Math.random() - 0.5) * 100; wrapped = true; }
    if (f.group.position.z < ufoGroup.position.z - 85) { f.group.position.z += 100; wrapped = true; }

    if (wrapped) {
      f.health = f.maxHealth;
      f.alive = true;
      f.group.visible = true;
      f.stunned = false;
      f.starsGroup.visible = false;
      f.flashTimer = 0;
      f.latched = false;
      if (f.type === 'biker') f.bodyMat.color.setHex(0x2288ff);
      else f.bodyMat.color.setHex(0xffaa00);
      if (f.type === 'biker') {
        f.velocity = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize().multiplyScalar(0.4);
      }
    }
    if (!f.alive) continue;

    if (f.type === 'biker' && !f.stunned && !f.latched) {
      f.group.position.add(f.velocity);
      f.group.lookAt(f.group.position.clone().add(f.velocity));
      if (Math.random() < 0.02) f.velocity.applyAxisAngle(new THREE.Vector3(0, 1, 0), (Math.random() - 0.5) * 1.0);
    }

    if (f.stunned) {
      f.starsGroup.rotation.y += 0.1;
      f.stunTimer -= 1;
      if (f.stunTimer <= 0) {
        f.stunned = false;
        f.starsGroup.visible = false;
        f.health = f.maxHealth;
        if (f.type === 'biker') f.bodyMat.color.setHex(0x2288ff);
        else f.bodyMat.color.setHex(0xffaa00);
      }
    } else {
      if (f.flashTimer > 0) {
        f.flashTimer -= 1;
        f.bodyMat.color.setHex(f.flashTimer % 4 < 2 ? 0xff0000 : (f.type === 'biker' ? 0x2288ff : 0xffaa00));
      } else if (f.type === 'biker') {
        f.bodyMat.color.setHex(0x2288ff);
      } else {
        f.bodyMat.color.setHex(0xffaa00);
      }
      f.fireTimer += 1;
      const isOnScreen = (f.group.position.z < ufoGroup.position.z + 12) && (f.group.position.z > ufoGroup.position.z - 75) && (Math.abs(ufoGroup.position.x - f.group.position.x) < 55);
      if (f.fireTimer > fireThreshold && isOnScreen && !f.latched) {
        f.fireTimer = 0;
        const proj = new THREE.Mesh(projGeo, projMat);
        proj.position.copy(f.group.position);
        proj.position.y = 2.0;
        const dir = new THREE.Vector3().subVectors(ufoGroup.position, proj.position).normalize();
        proj.userData = { velocity: dir.multiplyScalar(bulletSpeed) };
        scene.add(proj);
        projectiles.push(proj);
      }
    }
  }

  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.position.add(p.userData.velocity);
    if (p.position.distanceTo(ufoGroup.position) < 2.3) {
      gameStats.energy -= 150;
      updateHUDGraphics();
      sndDamage();
      scene.remove(p);
      projectiles.splice(i, 1);
      continue;
    }
    if (p.position.distanceTo(ufoGroup.position) > 80) {
      scene.remove(p);
      projectiles.splice(i, 1);
    }
  }

  for (let i = ufoLasers.length - 1; i >= 0; i--) {
    const l = ufoLasers[i];
    const target = l.userData.targetRef;
    if (boss && boss.alive && l.position.distanceTo(boss.group.position) < 6.0) {
      scene.remove(l);
      ufoLasers.splice(i, 1);
      boss.health -= l.userData.damage;
      spawnHitSplash(boss.group.position);
      sndHit();
      if (boss.health <= 0) {
        handleBossDefeat();
      }
      continue;
    }
    if (target && target.alive && !target.stunned) {
      const toTarget = new THREE.Vector3().subVectors(target.group.position, l.position).normalize().multiplyScalar(1.6);
      l.userData.velocity.lerp(toTarget, 0.15);
      l.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), l.userData.velocity.clone().normalize());
    }
    l.position.add(l.userData.velocity);
    if (target && target.alive && l.position.distanceTo(target.group.position) < 3.0) {
      scene.remove(l);
      ufoLasers.splice(i, 1);
      if (!target.stunned) {
        target.health -= l.userData.damage;
        target.flashTimer = 12;
        if (target.health <= 0) {
          if (gameStats.level >= 3) {
            target.health = 0;
            target.stunned = true;
            target.stunTimer = 300;
            target.starsGroup.visible = true;
            target.bodyMat.color.setHex(0x555555);
            sndStun();
            spawnFloatingText('STUNNED!', '#ffff00', target.group.position);
          } else {
            target.alive = false;
            target.group.visible = false;
            spawnFarmerFragments(target.group.position);
            sndExplosion();
            gameStats.score += 50;
            gameStats.farmersKilled += 1;
            updateHUDGraphics();
            spawnFloatingText('+50 KILL', '#ff2200', target.group.position);
          }
        } else {
          spawnHitSplash(target.group.position);
          sndHit();
        }
      } else {
        target.alive = false;
        target.group.visible = false;
        spawnFarmerFragments(target.group.position);
        sndExplosion();
        gameStats.score += 50;
        gameStats.farmersKilled += 1;
        updateHUDGraphics();
        spawnFloatingText('+50 KILL', '#ff2200', target.group.position);
      }
      continue;
    }
    if (l.position.distanceTo(ufoGroup.position) > 80) {
      scene.remove(l);
      ufoLasers.splice(i, 1);
    }
  }

  for (let i = bossProjectiles.length - 1; i >= 0; i--) {
    const p = bossProjectiles[i];
    p.position.add(p.userData.velocity);
    p.userData.life -= 1;
    if (p.position.distanceTo(ufoGroup.position) < 2.6) {
      gameStats.energy -= p.userData.damage || 16;
      updateHUDGraphics();
      sndDamage();
      scene.remove(p);
      bossProjectiles.splice(i, 1);
      continue;
    }
    if (p.userData.life <= 0 || p.position.distanceTo(boss.group.position) > 120) {
      scene.remove(p);
      bossProjectiles.splice(i, 1);
    }
  }

  for (let i = fragmentParticles.length - 1; i >= 0; i--) {
    const frag = fragmentParticles[i];
    frag.position.add(frag.userData.velocity);
    frag.rotation.x += frag.userData.rotationSpeed.x;
    frag.rotation.y += frag.userData.rotationSpeed.y;
    frag.userData.velocity.y -= 0.03;
    if (frag.position.y < 0.1) {
      frag.position.y = 0.1;
      frag.userData.velocity.set(0, 0, 0);
    }
    frag.userData.life -= 1;
    frag.scale.multiplyScalar(0.96);
    if (frag.userData.life <= 0) {
      scene.remove(frag);
      fragmentParticles.splice(i, 1);
    }
  }

  if (tractorBeam.visible) {
    batteries.forEach((c) => {
      if (Math.abs(ufoGroup.position.x - c.mesh.position.x) > 90) {
        c.mesh.position.x += (ufoGroup.position.x > c.mesh.position.x ? 180 : -180);
        c.shadow.position.x = c.mesh.position.x;
      }
      if (Math.abs(ufoGroup.position.z - c.mesh.position.z) > 90) {
        c.mesh.position.z += (ufoGroup.position.z > c.mesh.position.z ? 180 : -180);
        c.shadow.position.z = c.mesh.position.z;
      }
      c.shadow.position.x = c.mesh.position.x;
      c.shadow.position.z = c.mesh.position.z;
      const dist = Math.hypot(ufoGroup.position.x - c.mesh.position.x, ufoGroup.position.z - c.mesh.position.z);
      if (dist < 3.8) c.latched = true;
      if (c.latched) {
        c.mesh.position.x += (ufoGroup.position.x - c.mesh.position.x) * 0.15;
        c.mesh.position.z += (ufoGroup.position.z - c.mesh.position.z) * 0.15;
        c.shadow.position.x = c.mesh.position.x;
        c.shadow.position.z = c.mesh.position.z;
        c.mesh.position.y += 0.15;
        c.mesh.rotation.y += 0.1;
        const heightFactor = Math.max(0.15, 1.0 - (c.mesh.position.y / 8));
        c.shadow.scale.set(heightFactor, heightFactor, 1);
        c.shadow.material.opacity = heightFactor * 0.4;
        if (c.mesh.position.y > 7.5) {
          c.latched = false;
          gameStats.energy = MAX_ENERGY;
          gameStats.weaponTier += 1;
          updateHUDGraphics();
          const colorHex = `#${getLaserColor(gameStats.weaponTier).toString(16).padStart(6, '0')}`;
          spawnFloatingText(`SYSTEM SURGE! TIER ${gameStats.weaponTier}`, colorHex, c.mesh.position);
          sndPowerup();
          c.mesh.position.y = 0.6;
          c.mesh.position.x = ufoGroup.position.x + (Math.random() - 0.5) * 100;
          c.mesh.position.z = ufoGroup.position.z - 60 - Math.random() * 20;
          c.shadow.position.x = c.mesh.position.x;
          c.shadow.position.z = c.mesh.position.z;
          c.shadow.scale.set(1, 1, 1);
          c.shadow.material.opacity = 0.4;
        }
      } else if (c.mesh.position.y > 0.6) {
        c.mesh.position.y -= 0.2;
        if (c.mesh.position.y < 0.6) c.mesh.position.y = 0.6;
        const hf = Math.max(0.15, 1.0 - (c.mesh.position.y / 8));
        c.shadow.scale.set(hf, hf, 1);
        c.shadow.material.opacity = hf * 0.4;
      }
    });

    const abductables = [
      { arr: cows, type: 'cow' },
      { arr: pigs, type: 'pig' },
      { arr: farmers.filter((f) => f.stunned), type: 'farmer' },
      { arr: bikers.filter((b) => b.stunned), type: 'biker' },
    ];

    abductables.forEach(({ arr, type }) => {
      if (type === 'pig' && gameStats.level < 2) return;
      if ((type === 'farmer' || type === 'biker') && gameStats.level < 3) return;
      arr.forEach((entity) => {
        const animalGroup = entity.group;
        const shadow = entity.shadow || null;
        if (animalGroup.position.x > ufoGroup.position.x + 60) {
          animalGroup.position.x -= 120;
          if (shadow) shadow.position.x = animalGroup.position.x;
        }
        if (animalGroup.position.x < ufoGroup.position.x - 60) {
          animalGroup.position.x += 120;
          if (shadow) shadow.position.x = animalGroup.position.x;
        }
        if (animalGroup.position.z > ufoGroup.position.z + 18) {
          animalGroup.position.z -= 100;
          animalGroup.position.x = ufoGroup.position.x + (Math.random() - 0.5) * 100;
          if (shadow) {
            shadow.position.z = animalGroup.position.z;
            shadow.position.x = animalGroup.position.x;
          }
        }
        if (animalGroup.position.z < ufoGroup.position.z - 85) {
          animalGroup.position.z += 100;
          if (shadow) shadow.position.z = animalGroup.position.z;
        }
        if (shadow) {
          shadow.position.x = animalGroup.position.x;
          shadow.position.z = animalGroup.position.z;
        }
        const dist = Math.hypot(ufoGroup.position.x - animalGroup.position.x, ufoGroup.position.z - animalGroup.position.z);
        if (dist < 3.8) entity.latched = true;
        if (entity.latched) {
          animalGroup.position.x += (ufoGroup.position.x - animalGroup.position.x) * 0.15;
          animalGroup.position.z += (ufoGroup.position.z - animalGroup.position.z) * 0.15;
          if (shadow) {
            shadow.position.x = animalGroup.position.x;
            shadow.position.z = animalGroup.position.z;
          }
          animalGroup.position.y += 0.2;
          animalGroup.rotation.y += 0.15;
          const heightFactor = Math.max(0.15, 1.0 - (animalGroup.position.y / 8));
          if (shadow) {
            shadow.scale.set(heightFactor, heightFactor, 1);
            shadow.material.opacity = heightFactor * 0.4;
          }
          if (animalGroup.position.y > 7.5) {
            entity.latched = false;
            if (type === 'cow') {
              if (gameStats.cargo.cows + gameStats.msQuota.cows < COWS_NEEDED) {
                gameStats.cargo.cows += 1;
              }
              spawnFloatingText('+15 SCORE', '#00ffff', animalGroup.position);
              gameStats.score += 15;
              sndAbductCow();
            } else if (type === 'pig') {
              if (gameStats.cargo.pigs + gameStats.msQuota.pigs < activePigsNeeded) {
                gameStats.cargo.pigs += 1;
                gameStats.overclockTimer = 300;
                spawnFloatingText('OVERCLOCK!', '#ff99cc', animalGroup.position);
              }
              gameStats.score += 25;
              sndAbductPig();
            } else if (type === 'farmer') {
              if (gameStats.cargo.farmers + gameStats.msQuota.farmers < activeFarmersNeeded) {
                gameStats.cargo.farmers += 1;
                gameStats.boostMeter = Math.min(100, gameStats.boostMeter + 35);
                spawnFloatingText('+BOOST', '#ff00ff', animalGroup.position);
              }
              gameStats.score += 50;
              sndAbductFarmer();
              entity.stunned = false;
              entity.starsGroup.visible = false;
              entity.health = entity.maxHealth;
              entity.bodyMat.color.setHex(0xffaa00);
            } else if (type === 'biker') {
              if (gameStats.cargo.farmers + gameStats.msQuota.farmers < activeFarmersNeeded) {
                gameStats.cargo.farmers += 2;
                gameStats.boostMeter = 100;
                spawnFloatingText('MAX BOOST!', '#ff00ff', animalGroup.position);
              } else {
                spawnFloatingText('+100 SCORE', '#ffaa00', animalGroup.position);
              }
              gameStats.score += 100;
              sndAbductFarmer();
              entity.stunned = false;
              entity.starsGroup.visible = false;
              entity.health = entity.maxHealth;
              entity.bodyMat.color.setHex(0x2288ff);
            }
            animalGroup.position.y = 0.1;
            animalGroup.position.x = ufoGroup.position.x + (Math.random() - 0.5) * 100;
            animalGroup.position.z = ufoGroup.position.z - 60 - Math.random() * 20;
            if (shadow) {
              shadow.position.x = animalGroup.position.x;
              shadow.position.z = animalGroup.position.z;
              shadow.scale.set(1, 1, 1);
              shadow.material.opacity = 0.4;
            }
            updateHUDGraphics();
          }
        } else if (animalGroup.position.y > 0.1) {
          animalGroup.position.y -= 0.25;
          if (animalGroup.position.y < 0.1) animalGroup.position.y = 0.1;
          const hf = Math.max(0.15, 1.0 - (animalGroup.position.y / 8));
          if (shadow) {
            shadow.scale.set(hf, hf, 1);
            shadow.material.opacity = hf * 0.4;
            shadow.position.x = animalGroup.position.x;
            shadow.position.z = animalGroup.position.z;
          }
        }
      });
    });
  } else {
    batteries.forEach((c) => {
      c.latched = false;
      if (c.mesh.position.y > 0.6) {
        c.mesh.position.y -= 0.2;
        if (c.mesh.position.y < 0.6) c.mesh.position.y = 0.6;
        const hf = Math.max(0.15, 1.0 - (c.mesh.position.y / 8));
        c.shadow.scale.set(hf, hf, 1);
        c.shadow.material.opacity = hf * 0.4;
        c.shadow.position.x = c.mesh.position.x;
        c.shadow.position.z = c.mesh.position.z;
      }
    });

    const abductables = [{ arr: cows }, { arr: pigs }, { arr: farmers.filter((f) => f.stunned) }, { arr: bikers.filter((b) => b.stunned) }];
    abductables.forEach(({ arr }) => {
      arr.forEach((c) => {
        c.latched = false;
        const animalGroup = c.group;
        const shadow = c.shadow || null;
        if (animalGroup.position.y > 0.1) {
          animalGroup.position.y -= 0.25;
          if (animalGroup.position.y < 0.1) animalGroup.position.y = 0.1;
          const hf = Math.max(0.15, 1.0 - (animalGroup.position.y / 8));
          if (shadow) {
            shadow.scale.set(hf, hf, 1);
            shadow.material.opacity = hf * 0.4;
            shadow.position.x = animalGroup.position.x;
            shadow.position.z = animalGroup.position.z;
          }
        }
      });
    });
  }
}

function animate() {
  requestAnimationFrame(animate);
  updateGame();
  renderer.render(scene, camera);
}

updateHUDGraphics();
animate();
