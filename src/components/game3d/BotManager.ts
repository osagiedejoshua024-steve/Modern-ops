import * as THREE from 'three';
import { BotDifficulty, KillfeedItem } from '../../types/game';
import { ColliderBox } from './ArenaEnvironment';
import { soundEffects } from '../../services/soundEffects';

export interface BotInstance {
  id: string;
  name: string;
  team: 'enemy' | 'friendly';
  mesh: THREE.Group;
  headMesh: THREE.Mesh;
  bodyMesh: THREE.Mesh;
  weaponMesh: THREE.Mesh;
  muzzleFlash: THREE.Group;
  health: number;
  maxHealth: number;
  isDead: boolean;
  respawnTime: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  targetPos: THREE.Vector3;
  state: 'patrol' | 'chase' | 'attack';
  lastShotTime: number;
  strafeTimer: number;
  strafeDir: number;
  kills: number;
  deaths: number;
}

const BOT_NAMES = [
  'Viper-4',
  'Ghost-Echo',
  'Kage-Shadow',
  'Raptor-9',
  'Titan-Alpha',
  'Reaper-12',
  'Nomad-7',
  'Spectre-3',
];

export class BotManager {
  private scene: THREE.Scene;
  private colliders: ColliderBox[];
  public bots: BotInstance[] = [];
  private difficulty: BotDifficulty;
  private spawnPoints: THREE.Vector3[];

  constructor(scene: THREE.Scene, colliders: ColliderBox[], spawnPoints: THREE.Vector3[], difficulty: BotDifficulty, botCount = 4) {
    this.scene = scene;
    this.colliders = colliders;
    this.spawnPoints = spawnPoints;
    this.difficulty = difficulty;

    for (let i = 0; i < botCount; i++) {
      const name = BOT_NAMES[i % BOT_NAMES.length];
      const bot = this.createBot(i, name);
      this.bots.push(bot);
      this.scene.add(bot.mesh);
    }
  }

  private createBot(index: number, name: string): BotInstance {
    const group = new THREE.Group();
    group.name = `bot_${index}`;

    // Team color: Red/Dark Charcoal for enemies
    const suitMat = new THREE.MeshStandardMaterial({
      color: 0x222630,
      roughness: 0.8,
      metalness: 0.2,
    });

    const vestMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b, // Red tactical vest
      roughness: 0.6,
      metalness: 0.4,
    });

    const helmetMat = new THREE.MeshStandardMaterial({
      color: 0x111317,
      roughness: 0.5,
      metalness: 0.7,
    });

    const visorMat = new THREE.MeshBasicMaterial({
      color: 0xef4444, // Red glow visor
    });

    // Torso / Plate Carrier
    const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.45), vestMat);
    bodyMesh.position.set(0, 1.15, 0);
    bodyMesh.castShadow = true;
    group.add(bodyMesh);

    // Pelvis & Legs
    const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.35, 0.4), suitMat);
    pelvis.position.set(0, 0.6, 0);
    group.add(pelvis);

    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.65, 0.28), suitMat);
    legL.position.set(-0.2, 0.32, 0);
    legL.castShadow = true;
    group.add(legL);

    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.65, 0.28), suitMat);
    legR.position.set(0.2, 0.32, 0);
    legR.castShadow = true;
    group.add(legR);

    // Head / Tactical Helmet
    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.45, 0.42), helmetMat);
    headMesh.position.set(0, 1.85, 0);
    headMesh.castShadow = true;
    headMesh.userData = { isHead: true, botIndex: index };
    group.add(headMesh);

    // Visor glow strip
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.1, 0.05), visorMat);
    visor.position.set(0, 1.85, -0.22);
    group.add(visor);

    // Bot Assault Rifle Weapon
    const rifleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 });
    const weaponMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.8), rifleMat);
    weaponMesh.position.set(0.35, 1.25, -0.45);
    weaponMesh.castShadow = true;
    group.add(weaponMesh);

    // Bot Muzzle Flash
    const muzzleFlash = new THREE.Group();
    muzzleFlash.position.set(0.35, 1.25, -0.9);
    muzzleFlash.visible = false;
    const flashMat = new THREE.MeshBasicMaterial({ color: 0xff8800 });
    muzzleFlash.add(new THREE.Mesh(new THREE.DodecahedronGeometry(0.12), flashMat));
    group.add(muzzleFlash);

    // Initial spawn pos
    const spawn = this.spawnPoints[index % this.spawnPoints.length];
    group.position.copy(spawn);

    return {
      id: `bot-${index}`,
      name,
      team: 'enemy',
      mesh: group,
      headMesh,
      bodyMesh,
      weaponMesh,
      muzzleFlash,
      health: 100,
      maxHealth: 100,
      isDead: false,
      respawnTime: 0,
      position: group.position,
      velocity: new THREE.Vector3(),
      targetPos: new THREE.Vector3(),
      state: 'patrol',
      lastShotTime: 0,
      strafeTimer: 0,
      strafeDir: 1,
      kills: 0,
      deaths: 0,
    };
  }

  public update(
    delta: number,
    playerPos: THREE.Vector3,
    onPlayerDamaged: (amount: number, botPos: THREE.Vector3) => void,
    onKillfeed: (item: KillfeedItem) => void
  ) {
    const now = Date.now();

    this.bots.forEach((bot, idx) => {
      if (bot.isDead) {
        if (now >= bot.respawnTime) {
          this.respawnBot(bot, idx);
        }
        return;
      }

      // Distance to player
      const distToPlayer = bot.position.distanceTo(playerPos);

      // Bot Sightline Raycast to player
      const dirToPlayer = new THREE.Vector3().subVectors(playerPos, bot.position).normalize();
      const hasLineOfSight = this.checkLineOfSight(bot.position, playerPos);

      // AI States
      if (hasLineOfSight && distToPlayer < 45) {
        bot.state = 'attack';
        // Face player smoothly
        const targetRotation = Math.atan2(dirToPlayer.x, dirToPlayer.z);
        bot.mesh.rotation.y = targetRotation + Math.PI;

        // Strafe during combat
        bot.strafeTimer -= delta;
        if (bot.strafeTimer <= 0) {
          bot.strafeTimer = 1.0 + Math.random() * 1.5;
          bot.strafeDir = Math.random() > 0.5 ? 1 : -1;
        }

        const strafeVec = new THREE.Vector3(-dirToPlayer.z, 0, dirToPlayer.x).multiplyScalar(bot.strafeDir * 2.5 * delta);
        bot.position.add(strafeVec);

        // Keep inside bounds
        bot.position.x = Math.max(-38, Math.min(38, bot.position.x));
        bot.position.z = Math.max(-38, Math.min(38, bot.position.z));

        // Fire rate & accuracy logic based on difficulty
        const fireInterval = this.difficulty === 'veteran' ? 240 : this.difficulty === 'regular' ? 450 : 750;
        if (now - bot.lastShotTime > fireInterval) {
          bot.lastShotTime = now;
          this.botFireShot(bot, playerPos, onPlayerDamaged, onKillfeed);
        }
      } else {
        // Patrol / Advance towards combat area
        bot.state = 'patrol';
        if (!bot.targetPos || bot.position.distanceTo(bot.targetPos) < 2) {
          // Pick new random waypoint in the arena
          bot.targetPos = new THREE.Vector3(
            (Math.random() - 0.5) * 50,
            bot.position.y,
            (Math.random() - 0.5) * 50
          );
        }

        const moveDir = new THREE.Vector3().subVectors(bot.targetPos, bot.position).normalize();
        bot.mesh.rotation.y = Math.atan2(moveDir.x, moveDir.z) + Math.PI;
        bot.position.add(moveDir.multiplyScalar(3.2 * delta));
      }
    });
  }

  private checkLineOfSight(from: THREE.Vector3, to: THREE.Vector3): boolean {
    const rayOrigin = new THREE.Vector3(from.x, from.y + 1.2, from.z);
    const rayDir = new THREE.Vector3().subVectors(to, rayOrigin).normalize();
    const dist = rayOrigin.distanceTo(to);

    const ray = new THREE.Ray(rayOrigin, rayDir);

    // Check colliders
    for (const c of this.colliders) {
      if (c.type === 'ground') continue;
      const box = new THREE.Box3(c.min, c.max);
      const intersection = ray.intersectBox(box, new THREE.Vector3());
      if (intersection && rayOrigin.distanceTo(intersection) < dist - 0.5) {
        return false; // Obstructed by wall or container
      }
    }
    return true;
  }

  private botFireShot(
    bot: BotInstance,
    playerPos: THREE.Vector3,
    onPlayerDamaged: (amount: number, botPos: THREE.Vector3) => void,
    onKillfeed: (item: KillfeedItem) => void
  ) {
    // Show muzzle flash
    bot.muzzleFlash.visible = true;
    setTimeout(() => {
      bot.muzzleFlash.visible = false;
    }, 60);

    // Audio distant gunfire
    soundEffects.playGunshot('rifle');

    // Hit chance based on difficulty
    const hitChance = this.difficulty === 'veteran' ? 0.65 : this.difficulty === 'regular' ? 0.4 : 0.22;
    if (Math.random() < hitChance) {
      const dmg = 12 + Math.floor(Math.random() * 8);
      onPlayerDamaged(dmg, bot.position);
    }
  }

  public damageBot(
    index: number,
    damage: number,
    isHeadshot: boolean,
    onKill: (bot: BotInstance, isHeadshot: boolean) => void
  ): boolean {
    const bot = this.bots[index];
    if (!bot || bot.isDead) return false;

    bot.health -= damage;

    // Flash white / red
    const prevMat = bot.bodyMesh.material as THREE.MeshStandardMaterial;
    prevMat.color.setHex(0xffffff);
    setTimeout(() => {
      prevMat.color.setHex(0x991b1b);
    }, 80);

    if (bot.health <= 0) {
      bot.health = 0;
      bot.isDead = true;
      bot.deaths++;
      bot.respawnTime = Date.now() + 3500;

      // Death animation: tip over
      bot.mesh.rotation.x = Math.PI / 2;
      bot.mesh.position.y = 0.3;

      onKill(bot, isHeadshot);
      return true;
    }
    return false;
  }

  private respawnBot(bot: BotInstance, index: number) {
    bot.health = bot.maxHealth;
    bot.isDead = false;
    bot.mesh.rotation.x = 0;
    bot.mesh.rotation.z = 0;

    const spawn = this.spawnPoints[index % this.spawnPoints.length];
    bot.mesh.position.copy(spawn);
    bot.mesh.position.x += (Math.random() - 0.5) * 6;
    bot.mesh.position.z += (Math.random() - 0.5) * 6;
  }

  public resetAll() {
    this.bots.forEach((bot, idx) => {
      this.respawnBot(bot, idx);
      bot.kills = 0;
      bot.deaths = 0;
    });
  }
}
