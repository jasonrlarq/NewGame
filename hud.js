// ===== HUD & UI SYSTEM =====
// Dashboard graphics, shop rendering, and UI updates

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
