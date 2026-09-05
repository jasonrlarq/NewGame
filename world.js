// ===== WORLD & STRUCTURES =====
// Farm buildings, fences, windmills, and other world props

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
