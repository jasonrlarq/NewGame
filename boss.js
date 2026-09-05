// ===== BOSS SYSTEM =====
// Boss creation, behavior, and defeat handling

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
