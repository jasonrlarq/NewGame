// ===== EFFECTS & PARTICLES =====
// Visual effects, particle systems, and floating text

// Fragment particles (from destroyed enemies)
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

// UFO trail particles
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

// Floating text display system
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
