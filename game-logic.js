// ===== MAIN GAME LOOP & LOGIC =====
// Core game update, collision detection, and gameplay mechanics

let projectiles = [];
let ufoLasers = [];
const projGeo = new THREE.SphereGeometry(0.4, 10, 10);
const projMat = new THREE.MeshBasicMaterial({ color: 0xff2200 });

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

function triggerLevelUp() {
  gameStats.level += 1;
  resetLevelProgress();
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
    resetRunState();
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

function updateMovementAndEnergy() {
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
}

function updateBossState() {
  if (!boss || !boss.alive) return;

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

  updateMovementAndEnergy();

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

  updateBossState();

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

  // Continue with tractor beam logic and abduction system...
  // [The abduction tractor beam logic follows - this is massive but essential]
  // Let me condense this for brevity in the file
  
  // Tractor beam battery logic
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
