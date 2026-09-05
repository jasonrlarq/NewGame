// ===== CREATURES =====
// All animal and enemy spawning and creation functions

// Cows
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

// Pigs
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

// Farmers
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

// Bikers
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

// Batteries (energy pickups)
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
