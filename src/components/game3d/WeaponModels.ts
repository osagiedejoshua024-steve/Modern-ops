import * as THREE from 'three';
import { Weapon, WeaponSkin, OpticType } from '../../types/game';

// Materials palette based on skins
function getSkinMaterials(skin: WeaponSkin) {
  let mainColor = 0x1a1c23;
  let accentColor = 0x2e323e;
  let metalness = 0.8;
  let roughness = 0.35;

  if (skin === 'desert_camo') {
    mainColor = 0x8c7355;
    accentColor = 0x5a4a35;
    metalness = 0.4;
    roughness = 0.6;
  } else if (skin === 'obsidian_gold') {
    mainColor = 0x121316;
    accentColor = 0xd4af37;
    metalness = 0.95;
    roughness = 0.2;
  } else if (skin === 'cyber_carbon') {
    mainColor = 0x161a22;
    accentColor = 0x06b6d4;
    metalness = 0.85;
    roughness = 0.3;
  }

  const matMain = new THREE.MeshStandardMaterial({
    color: mainColor,
    metalness,
    roughness,
  });

  const matAccent = new THREE.MeshStandardMaterial({
    color: accentColor,
    metalness: Math.min(1.0, metalness + 0.1),
    roughness: Math.max(0.1, roughness - 0.1),
  });

  const matSteel = new THREE.MeshStandardMaterial({
    color: 0x474b57,
    metalness: 0.9,
    roughness: 0.25,
  });

  const matGrip = new THREE.MeshStandardMaterial({
    color: 0x111215,
    metalness: 0.1,
    roughness: 0.9,
  });

  return { matMain, matAccent, matSteel, matGrip };
}

export function createWeaponMesh(weapon: Weapon): { group: THREE.Group; muzzleTip: THREE.Vector3; adsOffset: THREE.Vector3 } {
  const group = new THREE.Group();
  const { matMain, matAccent, matSteel, matGrip } = getSkinMaterials(weapon.skin);

  let muzzleTip = new THREE.Vector3(0, 0, -1.2);
  let adsOffset = new THREE.Vector3(0, -0.155, -0.42);

  switch (weapon.type) {
    case 'rifle': {
      // --- M4A1 CARBINE ---
      // Upper & Lower Receiver
      const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.09, 0.38), matMain);
      receiver.position.set(0, 0, 0);
      receiver.castShadow = true;
      group.add(receiver);

      // Barrel
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.45, 12), matSteel);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.015, -0.4);
      barrel.castShadow = true;
      group.add(barrel);

      // Handguard / Rail system
      const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.075, 0.28), matAccent);
      handguard.position.set(0, 0.01, -0.3);
      handguard.castShadow = true;
      group.add(handguard);

      // Muzzle brake
      const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.02, 0.08, 12), matSteel);
      muzzle.rotation.x = Math.PI / 2;
      muzzle.position.set(0, 0.015, -0.65);
      group.add(muzzle);
      muzzleTip = new THREE.Vector3(0, 0.015, -0.7);

      // Magazine (curved tactical mag)
      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.18, 0.08), matSteel);
      mag.position.set(0, -0.12, -0.05);
      mag.rotation.x = -0.15;
      group.add(mag);

      // Pistol Grip
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.14, 0.06), matGrip);
      grip.position.set(0, -0.1, 0.12);
      grip.rotation.x = 0.35;
      group.add(grip);

      // Tactical Stock
      const stockTube = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.22, 10), matSteel);
      stockTube.rotation.x = Math.PI / 2;
      stockTube.position.set(0, 0.01, 0.28);
      group.add(stockTube);

      const stockPad = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.13, 0.08), matMain);
      stockPad.position.set(0, -0.02, 0.38);
      group.add(stockPad);

      // Optic
      addOptic(group, weapon.optic, matSteel, new THREE.Vector3(0, 0.065, -0.08));
      adsOffset = new THREE.Vector3(0, -0.07, -0.38);
      break;
    }

    case 'shotgun': {
      // --- KRM-262 TACTICAL SHOTGUN ---
      // Heavy Receiver
      const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.36), matMain);
      receiver.castShadow = true;
      group.add(receiver);

      // Heavy 12ga Barrel
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 12), matSteel);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.02, -0.42);
      group.add(barrel);

      // Mag Tube below barrel
      const magTube = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.44, 12), matSteel);
      magTube.rotation.x = Math.PI / 2;
      magTube.position.set(0, -0.025, -0.39);
      group.add(magTube);

      // Pump Slide Handle
      const pump = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.075, 0.18), matAccent);
      pump.position.set(0, -0.025, -0.34);
      group.add(pump);

      // Heavy Stock & Grip
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.13, 0.07), matGrip);
      grip.position.set(0, -0.09, 0.12);
      grip.rotation.x = 0.35;
      group.add(grip);

      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.28), matMain);
      stock.position.set(0, -0.01, 0.28);
      group.add(stock);

      muzzleTip = new THREE.Vector3(0, 0.02, -0.68);
      adsOffset = new THREE.Vector3(0, -0.045, -0.36);
      break;
    }

    case 'sniper': {
      // --- L115A3 PRECISION SNIPER ---
      // Heavy Sniper Receiver
      const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, 0.45), matMain);
      receiver.castShadow = true;
      group.add(receiver);

      // Long Fluted Barrel
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.75, 14), matSteel);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.02, -0.6);
      group.add(barrel);

      // Heavy Muzzle Brake
      const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.045, 0.12), matSteel);
      muzzle.position.set(0, 0.02, -1.0);
      group.add(muzzle);
      muzzleTip = new THREE.Vector3(0, 0.02, -1.06);

      // Sniper Scope Tube
      const scopeTube = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.032, 0.38, 16), matSteel);
      scopeTube.rotation.x = Math.PI / 2;
      scopeTube.position.set(0, 0.095, -0.08);
      group.add(scopeTube);

      // Scope Mounts
      const mount1 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.05, 0.04), matAccent);
      mount1.position.set(0, 0.06, 0.04);
      const mount2 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.05, 0.04), matAccent);
      mount2.position.set(0, 0.06, -0.18);
      group.add(mount1);
      group.add(mount2);

      // Scope Lens Ring
      const lensMat = new THREE.MeshBasicMaterial({ color: 0x0ea5e9 });
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.028, 16), lensMat);
      lens.position.set(0, 0.095, 0.11);
      group.add(lens);

      // Sniper Stock
      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.35), matAccent);
      stock.position.set(0, -0.02, 0.38);
      group.add(stock);

      // Pistol Grip
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.14, 0.06), matGrip);
      grip.position.set(0, -0.1, 0.15);
      grip.rotation.x = 0.3;
      group.add(grip);

      adsOffset = new THREE.Vector3(0, -0.095, -0.25);
      break;
    }

    case 'pistol': {
      // --- GLOCK-18 TACTICAL ---
      // Polymer Lower Frame
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.06, 0.22), matAccent);
      frame.position.set(0, -0.01, 0);
      group.add(frame);

      // Steel Slide
      const slide = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.05, 0.24), matSteel);
      slide.position.set(0, 0.04, -0.01);
      slide.castShadow = true;
      group.add(slide);

      // Barrel Tip
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.05, 10), matSteel);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.04, -0.14);
      group.add(barrel);
      muzzleTip = new THREE.Vector3(0, 0.04, -0.17);

      // Angled Pistol Grip
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.14, 0.07), matGrip);
      grip.position.set(0, -0.09, 0.05);
      grip.rotation.x = 0.28;
      group.add(grip);

      // Mini Red Dot Optic
      addMiniRedDot(group, matSteel, new THREE.Vector3(0, 0.075, 0.02));
      adsOffset = new THREE.Vector3(0, -0.075, -0.28);
      break;
    }
  }

  // Create Muzzle Flash container attached to muzzleTip
  const flashGroup = new THREE.Group();
  flashGroup.position.copy(muzzleTip);
  flashGroup.name = 'muzzleFlash';
  flashGroup.visible = false;

  const flashMat = new THREE.MeshBasicMaterial({
    color: 0xffaa22,
    transparent: true,
    opacity: 0.9,
  });
  const flashMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.09), flashMat);
  flashGroup.add(flashMesh);

  // Dynamic muzzle light
  const flashLight = new THREE.PointLight(0xffaa22, 4, 8);
  flashGroup.add(flashLight);

  group.add(flashGroup);

  return { group, muzzleTip, adsOffset };
}

function addOptic(parent: THREE.Group, opticType: OpticType, matSteel: THREE.Material, pos: THREE.Vector3) {
  if (opticType === 'holo_sight') {
    // Holographic Sight housing
    const holoHousing = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.055, 0.1), matSteel);
    holoHousing.position.copy(pos);
    parent.add(holoHousing);

    // Glass Reticle lens
    const glassMat = new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      transparent: true,
      opacity: 0.45,
    });
    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.005), glassMat);
    glass.position.set(pos.x, pos.y + 0.005, pos.z - 0.01);
    parent.add(glass);

    // Red Dot emitter
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.003, 8, 8), dotMat);
    dot.position.set(pos.x, pos.y + 0.005, pos.z - 0.015);
    parent.add(dot);
  } else if (opticType === 'red_dot') {
    addMiniRedDot(parent, matSteel, pos);
  }
}

function addMiniRedDot(parent: THREE.Group, matSteel: THREE.Material, pos: THREE.Vector3) {
  const mount = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.03, 0.06), matSteel);
  mount.position.copy(pos);
  parent.add(mount);

  const glassMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.5,
  });
  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.004), glassMat);
  glass.position.set(pos.x, pos.y + 0.015, pos.z);
  parent.add(glass);

  const dotMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.003, 8, 8), dotMat);
  dot.position.set(pos.x, pos.y + 0.015, pos.z - 0.005);
  parent.add(dot);
}
