// ===== GAME OBJECTS =====
// UFO, mothership, dashboard, obstacles, and their components

// UFO Group
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

// Tracker arrow pointing to mothership
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

// Dashboard (in-cockpit UI)
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

// HUD Screen (canvas texture)
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
resizeHUD();

// Mothership
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

// Obstacles (rocks and trees)
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

// Shadow material
const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4 });

// Utility function for laser color
function getLaserColor(tier) {
  const colors = [0x00ffff, 0x00ff00, 0xffff00, 0xff00ff, 0xffaa00, 0xffffff, 0xff0000];
  return colors[Math.floor((tier - 1) / 3) % colors.length];
}
