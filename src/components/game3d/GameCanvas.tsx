import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Weapon, BotDifficulty, KillfeedItem, HitEffect, DamageIndicator, Killstreak, GameMode } from '../../types/game';
import { createWeaponMesh } from './WeaponModels';
import { buildArena, ArenaResult } from './ArenaEnvironment';
import { BotManager, BotInstance } from './BotManager';
import { soundEffects } from '../../services/soundEffects';

interface GameCanvasProps {
  weapons: Weapon[];
  currentWeaponIndex: number;
  onWeaponChange: (index: number) => void;
  onAmmoChange: (currentMag: number, reserve: number) => void;
  onHealthChange: (health: number, armor: number) => void;
  onHitEffect: (type: 'body' | 'headshot' | 'kill') => void;
  onDamageTaken: (angle: number) => void;
  onKillfeed: (item: KillfeedItem) => void;
  onKillstreakEarned: (streak: Killstreak) => void;
  onScoreUpdate: (kills: number, deaths: number, score: number, headshots: number) => void;
  onMatchEnd: (victory: boolean, stats: { kills: number; deaths: number; headshots: number; score: number }) => void;
  gameMode: GameMode;
  botDifficulty: BotDifficulty;
  botCount: number;
  sensitivity: number;
  activeKillstreaks: Killstreak[];
  isADS: boolean;
  setIsADS: (ads: boolean) => void;
  touchControlsActive: boolean;
  touchControls: {
    moveX: number;
    moveY: number;
    lookX: number;
    lookY: number;
    fire: boolean;
    ads: boolean;
    jump: boolean;
    slide: boolean;
    reload: boolean;
  };
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  weapons,
  currentWeaponIndex,
  onWeaponChange,
  onAmmoChange,
  onHealthChange,
  onHitEffect,
  onDamageTaken,
  onKillfeed,
  onKillstreakEarned,
  onScoreUpdate,
  onMatchEnd,
  gameMode,
  botDifficulty,
  botCount,
  sensitivity,
  activeKillstreaks,
  isADS,
  setIsADS,
  touchControlsActive,
  touchControls,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Match progression tracking
  const playerStatsRef = useRef({
    health: 100,
    maxHealth: 100,
    armor: 100,
    maxArmor: 100,
    kills: 0,
    deaths: 0,
    headshots: 0,
    score: 0,
    streakCount: 0,
  });

  // Weapon references
  const currentWeapon = weapons[currentWeaponIndex];
  const weaponRef = useRef(currentWeapon);
  weaponRef.current = currentWeapon;

  const currentWeaponIndexRef = useRef(currentWeaponIndex);
  currentWeaponIndexRef.current = currentWeaponIndex;

  // Key states
  const keys = useRef<{ [key: string]: boolean }>({});
  const mouseLook = useRef({ yaw: 0, pitch: 0 });
  const isPointerLocked = useRef(false);

  // Movement physics
  const playerPos = useRef(new THREE.Vector3(0, 1.8, 25));
  const playerVel = useRef(new THREE.Vector3(0, 0, 0));
  const isGrounded = useRef(true);
  const isSprinting = useRef(false);
  const isSliding = useRef(false);
  const slideTimer = useRef(0);
  const slideCooldown = useRef(0);

  // Weapon recoil & sway state
  const recoilOffset = useRef(new THREE.Vector3(0, 0, 0));
  const recoilRot = useRef(new THREE.Vector3(0, 0, 0));
  const swayOffset = useRef(new THREE.Vector2(0, 0));
  const walkBob = useRef(0);
  const isReloading = useRef(false);
  const reloadEndTime = useRef(0);
  const lastShotTime = useRef(0);
  const isMouseDown = useRef(false);

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const botManagerRef = useRef<BotManager | null>(null);
  const arenaRef = useRef<ArenaResult | null>(null);
  const weaponGroupRef = useRef<THREE.Group | null>(null);
  const weaponDataRef = useRef<{ muzzleTip: THREE.Vector3; adsOffset: THREE.Vector3 } | null>(null);

  // Pointer lock event listeners
  const requestPointerLock = useCallback(() => {
    if (containerRef.current && !isPointerLocked.current) {
      containerRef.current.requestPointerLock();
    }
  }, []);

  // Sync weapon ammo initially
  useEffect(() => {
    onAmmoChange(weaponRef.current.currentMag, weaponRef.current.reserveAmmo);
  }, [currentWeaponIndex, onAmmoChange]);

  // Handle active killstreak triggers (UAV, Airstrike, Juggernaut)
  useEffect(() => {
    activeKillstreaks.forEach((streak) => {
      if (streak.active) {
        if (streak.id === 'airstrike') {
          soundEffects.playAirstrikeSound();
          soundEffects.playVoiceCallout('Friendly mortar strike incoming!');
          // Damage nearby bots
          setTimeout(() => {
            if (botManagerRef.current) {
              botManagerRef.current.bots.forEach((bot, bIdx) => {
                if (!bot.isDead && Math.random() > 0.3) {
                  botManagerRef.current?.damageBot(bIdx, 120, false, (killedBot) => {
                    handlePlayerElimination(killedBot, false, 'MORTAR BARRAGE');
                  });
                }
              });
            }
          }, 1500);
        } else if (streak.id === 'juggernaut') {
          soundEffects.playKillstreakEarned();
          soundEffects.playVoiceCallout('Juggernaut armor equipped!');
          playerStatsRef.current.armor = 200;
          playerStatsRef.current.maxArmor = 200;
          onHealthChange(playerStatsRef.current.health, playerStatsRef.current.armor);
        } else if (streak.id === 'uav') {
          soundEffects.playKillstreakEarned();
          soundEffects.playVoiceCallout('UAV Recon in the airspace!');
        }
      }
    });
  }, [activeKillstreaks, onHealthChange]);

  // Player Elimination Handler
  const handlePlayerElimination = (bot: BotInstance, isHeadshot: boolean, weaponName?: string) => {
    playerStatsRef.current.kills++;
    playerStatsRef.current.streakCount++;
    const points = isHeadshot ? 150 : 100;
    playerStatsRef.current.score += points;
    if (isHeadshot) playerStatsRef.current.headshots++;

    onHitEffect('kill');
    soundEffects.playHitmarker('kill');

    onKillfeed({
      id: `kill-${Date.now()}-${Math.random()}`,
      killer: 'OPERATOR',
      victim: bot.name,
      weaponName: weaponName || weaponRef.current.name,
      isHeadshot,
      isPlayerKiller: true,
      isPlayerVictim: false,
      timestamp: Date.now(),
    });

    onScoreUpdate(
      playerStatsRef.current.kills,
      playerStatsRef.current.deaths,
      playerStatsRef.current.score,
      playerStatsRef.current.headshots
    );

    // Check killstreak rewards (3, 5, 7)
    if (playerStatsRef.current.streakCount === 3) {
      soundEffects.playKillstreakEarned();
      soundEffects.playVoiceCallout('UAV Recon ready for deployment!');
      onKillstreakEarned({ id: 'uav', name: 'UAV RECON', killsRequired: 3, icon: 'Radar', ready: true, active: false });
    } else if (playerStatsRef.current.streakCount === 5) {
      soundEffects.playKillstreakEarned();
      soundEffects.playVoiceCallout('Mortar strike standing by!');
      onKillstreakEarned({ id: 'airstrike', name: 'MORTAR BARRAGE', killsRequired: 5, icon: 'Crosshair', ready: true, active: false });
    } else if (playerStatsRef.current.streakCount === 7) {
      soundEffects.playKillstreakEarned();
      soundEffects.playVoiceCallout('Juggernaut reinforcement ready!');
      onKillstreakEarned({ id: 'juggernaut', name: 'JUGGERNAUT PLATES', killsRequired: 7, icon: 'Shield', ready: true, active: false });
    }

    // Check Victory condition (e.g. 25 kills for TDM)
    const targetKills = gameMode === 'gun_game' ? 12 : 25;
    if (playerStatsRef.current.kills >= targetKills) {
      onMatchEnd(true, {
        kills: playerStatsRef.current.kills,
        deaths: playerStatsRef.current.deaths,
        headshots: playerStatsRef.current.headshots,
        score: playerStatsRef.current.score,
      });
    }

    // Gun Game progression
    if (gameMode === 'gun_game') {
      const nextIdx = (currentWeaponIndexRef.current + 1) % weapons.length;
      onWeaponChange(nextIdx);
    }
  };

  // Switch weapon model in 3D scene
  const equipWeapon3D = useCallback((weapon: Weapon) => {
    if (!cameraRef.current) return;

    if (weaponGroupRef.current) {
      cameraRef.current.remove(weaponGroupRef.current);
    }

    const { group, muzzleTip, adsOffset } = createWeaponMesh(weapon);
    // Base hipfire transform relative to camera
    group.position.set(0.24, -0.22, -0.42);
    cameraRef.current.add(group);

    weaponGroupRef.current = group;
    weaponDataRef.current = { muzzleTip, adsOffset };
  }, []);

  // Main setup effect
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f1118);
    scene.fog = new THREE.FogExp2(0x0f1118, 0.012);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.05, 200);
    camera.position.copy(playerPos.current);
    cameraRef.current = camera;
    scene.add(camera);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xd1d5db, 1.2);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfef08a, 2.2);
    sunLight.position.set(30, 50, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 120;
    const shadowD = 35;
    sunLight.shadow.camera.left = -shadowD;
    sunLight.shadow.camera.right = shadowD;
    sunLight.shadow.camera.top = shadowD;
    sunLight.shadow.camera.bottom = -shadowD;
    scene.add(sunLight);

    // Blue tactical skylight fill
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x1e293b, 0.8);
    scene.add(hemiLight);

    // 3. Build Arena Map
    const arena = buildArena(scene);
    arenaRef.current = arena;

    // 4. Initialize Bot Manager
    const botManager = new BotManager(
      scene,
      arena.colliders,
      arena.spawnPointsBot,
      botDifficulty,
      botCount
    );
    botManagerRef.current = botManager;

    // 5. Initial Weapon Mesh Setup
    equipWeapon3D(weaponRef.current);

    // 6. Event Listeners
    const onKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;

      // Weapon switch via numbers 1, 2, 3, 4
      if (['Digit1', 'Digit2', 'Digit3', 'Digit4'].includes(e.code)) {
        const slot = parseInt(e.code.replace('Digit', ''), 10) - 1;
        if (slot >= 0 && slot < weapons.length && slot !== currentWeaponIndexRef.current) {
          onWeaponChange(slot);
        }
      }

      // Reload
      if (e.code === 'KeyR' && !isReloading.current) {
        startReload();
      }

      // Slide mechanics: If sprinting and pressing C or Control, initiate tactical slide!
      if ((e.code === 'KeyC' || e.code === 'ControlLeft') && isSprinting.current && !isSliding.current && slideCooldown.current <= 0) {
        isSliding.current = true;
        slideTimer.current = 0.75;
        slideCooldown.current = 1.4;
        soundEffects.playSlideSound();
      }

      // Jump
      if (e.code === 'Space' && isGrounded.current) {
        playerVel.current.y = 7.8;
        isGrounded.current = false;
        soundEffects.playJumpSound();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isPointerLocked.current) return;
      const sens = (sensitivity / 100) * 0.0022;
      mouseLook.current.yaw -= e.movementX * sens;
      mouseLook.current.pitch -= e.movementY * sens;
      // Clamp pitch to avoid flip
      mouseLook.current.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, mouseLook.current.pitch));

      // Sway viewmodel slightly on mouse delta
      swayOffset.current.x = THREE.MathUtils.clamp(swayOffset.current.x - e.movementX * 0.0004, -0.05, 0.05);
      swayOffset.current.y = THREE.MathUtils.clamp(swayOffset.current.y + e.movementY * 0.0004, -0.05, 0.05);
    };

    const onMouseDown = (e: MouseEvent) => {
      if (!isPointerLocked.current) {
        requestPointerLock();
        return;
      }
      if (e.button === 0) {
        isMouseDown.current = true;
        handleFire();
      } else if (e.button === 2) {
        // Right click ADS toggle/hold
        setIsADS(true);
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        isMouseDown.current = false;
      } else if (e.button === 2) {
        setIsADS(false);
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const onPointerLockChange = () => {
      isPointerLocked.current = document.pointerLockElement === container;
    };

    const onResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      cameraRef.current.aspect = newW / newH;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newW, newH);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('pointerlockchange', onPointerLockChange);
    window.addEventListener('resize', onResize);

    // 7. Core Game Loop
    let lastFrameTime = performance.now();
    let animationFrameId: number;

    const gameLoop = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(gameLoop);
      const delta = Math.min((currentTime - lastFrameTime) / 1000, 0.1);
      lastFrameTime = currentTime;

      // Handle continuous automatic fire when mouse held down
      if (isMouseDown.current && weaponRef.current.automatic) {
        handleFire();
      }

      // Handle reload finish
      if (isReloading.current && performance.now() >= reloadEndTime.current) {
        finishReload();
      }

      // Update slide timers
      if (slideCooldown.current > 0) {
        slideCooldown.current -= delta;
      }
      if (isSliding.current) {
        slideTimer.current -= delta;
        if (slideTimer.current <= 0) {
          isSliding.current = false;
        }
      }

      // Update Arena floating particles
      if (arenaRef.current) {
        arenaRef.current.updateParticles(delta);
      }

      // Player Movement Logic
      updatePlayerPhysics(delta);

      // Camera Look & Rotation
      updateCameraAndWeapon(delta);

      // Update Bots
      if (botManagerRef.current) {
        botManagerRef.current.update(
          delta,
          playerPos.current,
          (dmg, botPos) => {
            // Player Damaged by bot
            takeDamageFromBot(dmg, botPos);
          },
          (killItem) => {
            onKillfeed(killItem);
          }
        );
      }

      // Render Scene
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      window.removeEventListener('resize', onResize);

      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.domElement.remove();
        rendererRef.current.dispose();
      }
    };
  }, [botCount, botDifficulty, equipWeapon3D, gameMode, onKillfeed, onMatchEnd, onScoreUpdate, onWeaponChange, requestPointerLock, sensitivity, setIsADS, weapons]);

  // Update weapon mesh when current weapon index changes
  useEffect(() => {
    equipWeapon3D(weaponRef.current);
  }, [currentWeaponIndex, equipWeapon3D]);

  // Touch controls input processing
  useEffect(() => {
    if (touchControlsActive) {
      if (touchControls.fire && (!weaponRef.current.automatic || isMouseDown.current)) {
        handleFire();
      }
      if (touchControls.ads !== isADS) {
        setIsADS(touchControls.ads);
      }
      if (touchControls.jump && isGrounded.current) {
        playerVel.current.y = 7.8;
        isGrounded.current = false;
        soundEffects.playJumpSound();
      }
      if (touchControls.slide && isSprinting.current && !isSliding.current && slideCooldown.current <= 0) {
        isSliding.current = true;
        slideTimer.current = 0.75;
        slideCooldown.current = 1.4;
        soundEffects.playSlideSound();
      }
      if (touchControls.reload && !isReloading.current) {
        startReload();
      }

      // Touch look deltas
      if (touchControls.lookX !== 0 || touchControls.lookY !== 0) {
        const sens = (sensitivity / 100) * 0.035;
        mouseLook.current.yaw -= touchControls.lookX * sens;
        mouseLook.current.pitch -= touchControls.lookY * sens;
        mouseLook.current.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, mouseLook.current.pitch));
      }
    }
  }, [touchControls, touchControlsActive, isADS, sensitivity, setIsADS]);

  // --- FIRING MECHANICS ---
  const handleFire = () => {
    const now = performance.now();
    const wp = weaponRef.current;

    if (isReloading.current) return;
    if (now - lastShotTime.current < wp.fireRate) return;

    if (wp.currentMag <= 0) {
      // Empty clip click
      soundEffects.playHitmarker('body'); // small click
      startReload();
      return;
    }

    lastShotTime.current = now;
    wp.currentMag--;
    onAmmoChange(wp.currentMag, wp.reserveAmmo);

    // Audio gunshot
    soundEffects.playGunshot(wp.type);

    // Apply Recoil Kick
    const recoilForce = isADS ? wp.recoil * 0.45 : wp.recoil;
    recoilOffset.current.z += 0.08;
    recoilOffset.current.y += 0.02;
    recoilRot.current.x += recoilForce * 0.6;
    mouseLook.current.pitch += recoilForce * 0.25;

    // Flash Muzzle
    if (weaponGroupRef.current) {
      const flash = weaponGroupRef.current.getObjectByName('muzzleFlash');
      if (flash) {
        flash.visible = true;
        setTimeout(() => {
          flash.visible = false;
        }, 60);
      }
    }

    // Raycast Shooting Check against bots
    performRaycastShot(wp);
  };

  const performRaycastShot = (wp: Weapon) => {
    if (!cameraRef.current || !sceneRef.current || !botManagerRef.current) return;

    // Bullet spread calculation
    const spread = isADS ? wp.spread * 0.15 : wp.spread;
    const spreadX = (Math.random() - 0.5) * spread;
    const spreadY = (Math.random() - 0.5) * spread;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(spreadX, spreadY), cameraRef.current);

    // Collect bot meshes for hit detection
    const botMeshes: THREE.Object3D[] = [];
    botManagerRef.current.bots.forEach((bot) => {
      if (!bot.isDead) {
        botMeshes.push(bot.headMesh);
        botMeshes.push(bot.bodyMesh);
      }
    });

    const intersects = raycaster.intersectObjects(botMeshes, true);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const isHeadshot = hit.object.userData?.isHead === true;
      const botIndex = hit.object.userData?.botIndex !== undefined
        ? hit.object.userData.botIndex
        : (hit.object.parent?.name.startsWith('bot_') ? parseInt(hit.object.parent.name.replace('bot_', ''), 10) : 0);

      const damage = isHeadshot ? Math.round(wp.damage * wp.headshotMultiplier) : wp.damage;

      onHitEffect(isHeadshot ? 'headshot' : 'body');
      soundEffects.playHitmarker(isHeadshot ? 'headshot' : 'body');

      botManagerRef.current.damageBot(botIndex, damage, isHeadshot, (killedBot, wasHead) => {
        handlePlayerElimination(killedBot, wasHead);
      });
    }
  };

  // --- RELOAD LOGIC ---
  const startReload = () => {
    const wp = weaponRef.current;
    if (wp.currentMag >= wp.magSize || wp.reserveAmmo <= 0 || isReloading.current) return;

    isReloading.current = true;
    reloadEndTime.current = performance.now() + wp.reloadTime;
    soundEffects.playReloadSequence();
  };

  const finishReload = () => {
    const wp = weaponRef.current;
    const needed = wp.magSize - wp.currentMag;
    const take = Math.min(needed, wp.reserveAmmo);
    wp.currentMag += take;
    wp.reserveAmmo -= take;
    isReloading.current = false;
    onAmmoChange(wp.currentMag, wp.reserveAmmo);
  };

  // --- DAMAGE TAKEN FROM BOT ---
  const takeDamageFromBot = (amount: number, botPos: THREE.Vector3) => {
    soundEffects.playDamageTaken();

    // Compute relative angle for directional damage arc HUD
    const dirToBot = new THREE.Vector3().subVectors(botPos, playerPos.current).normalize();
    const forward = new THREE.Vector3(-Math.sin(mouseLook.current.yaw), 0, -Math.cos(mouseLook.current.yaw));
    const right = new THREE.Vector3(forward.z, 0, -forward.x);

    const dotF = forward.dot(dirToBot);
    const dotR = right.dot(dirToBot);
    const angleDeg = (Math.atan2(dotR, dotF) * 180) / Math.PI;
    onDamageTaken(angleDeg);

    // Armor absorption
    let remaining = amount;
    if (playerStatsRef.current.armor > 0) {
      const absorbed = Math.min(playerStatsRef.current.armor, amount);
      playerStatsRef.current.armor -= absorbed;
      remaining -= absorbed;
    }

    playerStatsRef.current.health = Math.max(0, playerStatsRef.current.health - remaining);
    onHealthChange(playerStatsRef.current.health, playerStatsRef.current.armor);

    if (playerStatsRef.current.health <= 35) {
      soundEffects.startHeartbeat();
    } else {
      soundEffects.stopHeartbeat();
    }

    // Check Player Death
    if (playerStatsRef.current.health <= 0) {
      handlePlayerDeath();
    }
  };

  const handlePlayerDeath = () => {
    playerStatsRef.current.deaths++;
    playerStatsRef.current.streakCount = 0;
    soundEffects.stopHeartbeat();

    onKillfeed({
      id: `death-${Date.now()}`,
      killer: 'SPEC-OPS VIPER',
      victim: 'OPERATOR',
      weaponName: 'M4A1',
      isHeadshot: false,
      isPlayerKiller: false,
      isPlayerVictim: true,
      timestamp: Date.now(),
    });

    onScoreUpdate(
      playerStatsRef.current.kills,
      playerStatsRef.current.deaths,
      playerStatsRef.current.score,
      playerStatsRef.current.headshots
    );

    // Respawn player
    playerPos.current.set(0, 1.8, 26);
    playerStatsRef.current.health = 100;
    playerStatsRef.current.armor = 100;
    onHealthChange(100, 100);
  };

  // --- PHYSICS & COLLISION UPDATE ---
  const updatePlayerPhysics = (delta: number) => {
    // Determine movement direction vector
    let forward = 0;
    let right = 0;

    if (keys.current['KeyW']) forward += 1;
    if (keys.current['KeyS']) forward -= 1;
    if (keys.current['KeyA']) right -= 1;
    if (keys.current['KeyD']) right += 1;

    // Add touch joystick if active
    if (touchControlsActive) {
      right += touchControls.moveX;
      forward -= touchControls.moveY;
    }

    // Sprint check
    isSprinting.current = Boolean(keys.current['ShiftLeft'] && forward > 0 && !isADS);

    // Speed constants
    let baseSpeed = 6.2;
    if (isSprinting.current) baseSpeed = 9.8; // Tactical sprint
    if (isADS) baseSpeed = 3.6; // ADS walk reduction
    if (isSliding.current) baseSpeed = 12.5; // High explosive slide velocity

    // Normalize input
    const inputDir = new THREE.Vector2(right, forward);
    if (inputDir.lengthSq() > 1) inputDir.normalize();

    // World relative movement
    const sinYaw = Math.sin(mouseLook.current.yaw);
    const cosYaw = Math.cos(mouseLook.current.yaw);

    const moveX = (inputDir.x * cosYaw - inputDir.y * sinYaw) * baseSpeed;
    const moveZ = (-inputDir.x * sinYaw - inputDir.y * cosYaw) * baseSpeed;

    // Gravity
    playerVel.current.y -= 19.8 * delta;

    // Candidate new position
    const nextPos = playerPos.current.clone();
    nextPos.x += moveX * delta;
    nextPos.z += moveZ * delta;
    nextPos.y += playerVel.current.y * delta;

    // Ground & Obstacle Collisions
    if (arenaRef.current) {
      // Ground plane height
      if (nextPos.y <= 1.8) {
        nextPos.y = 1.8;
        playerVel.current.y = 0;
        isGrounded.current = true;
      }

      // Check collision against obstacles
      const pRadius = 0.55;
      for (const col of arenaRef.current.colliders) {
        if (col.type === 'ground') continue;

        // Simple AABB vs Cylinder check
        if (
          nextPos.x + pRadius > col.min.x &&
          nextPos.x - pRadius < col.max.x &&
          nextPos.z + pRadius > col.min.z &&
          nextPos.z - pRadius < col.max.z &&
          nextPos.y > col.min.y &&
          nextPos.y - 1.8 < col.max.y
        ) {
          // If on top of cover/platform, allow landing
          if (playerPos.current.y >= col.max.y + 1.6) {
            nextPos.y = col.max.y + 1.8;
            playerVel.current.y = 0;
            isGrounded.current = true;
          } else {
            // Push back on X and Z
            nextPos.x = playerPos.current.x;
            nextPos.z = playerPos.current.z;
          }
        }
      }
    }

    // World boundaries
    nextPos.x = Math.max(-39, Math.min(39, nextPos.x));
    nextPos.z = Math.max(-39, Math.min(39, nextPos.z));

    playerPos.current.copy(nextPos);

    // Footsteps sound
    if (isGrounded.current && (Math.abs(moveX) > 1 || Math.abs(moveZ) > 1)) {
      walkBob.current += delta * (isSprinting.current ? 16 : 10);
      if (Math.sin(walkBob.current) > 0.98) {
        soundEffects.playFootstep();
      }
    }
  };

  // --- CAMERA & VIEWMODEL SPRING ANIMATION ---
  const updateCameraAndWeapon = (delta: number) => {
    if (!cameraRef.current) return;

    // Camera position & rotation
    let camHeight = playerPos.current.y;
    if (isSliding.current) {
      camHeight -= 0.65; // Camera dip during slide
    }

    cameraRef.current.position.set(playerPos.current.x, camHeight, playerPos.current.z);
    cameraRef.current.rotation.set(0, 0, 0);
    cameraRef.current.rotation.y = mouseLook.current.yaw;
    cameraRef.current.rotation.x = mouseLook.current.pitch;

    // Slide tilt effect
    if (isSliding.current) {
      cameraRef.current.rotation.z = 0.08;
    }

    // Camera ADS FOV lerp
    const targetFov = isADS ? weaponRef.current.adsZoom : 75;
    cameraRef.current.fov = THREE.MathUtils.lerp(cameraRef.current.fov, targetFov, delta * 14);
    cameraRef.current.updateProjectionMatrix();

    // Viewmodel Weapon Positioning
    if (weaponGroupRef.current && weaponDataRef.current) {
      const targetPos = new THREE.Vector3();
      const targetRot = new THREE.Vector3();

      if (isADS) {
        // Aligned precisely to camera reticle
        targetPos.copy(weaponDataRef.current.adsOffset);
      } else if (isSprinting.current) {
        // Sprint tilted weapon pose
        targetPos.set(0.18, -0.28, -0.38);
        targetRot.set(-0.35, 0.45, -0.2);
      } else {
        // Standard hipfire pose
        targetPos.set(0.24, -0.22, -0.42);

        // Walking bobbing
        const bobX = Math.cos(walkBob.current * 0.5) * 0.012;
        const bobY = Math.sin(walkBob.current) * 0.015;
        targetPos.x += bobX;
        targetPos.y += bobY;
      }

      // Reload animation: dip and rotate weapon
      if (isReloading.current) {
        targetPos.y -= 0.12;
        targetRot.x -= 0.4;
        targetRot.z += 0.3;
      }

      // Add recoil & sway
      targetPos.add(recoilOffset.current);
      targetPos.x += swayOffset.current.x;
      targetPos.y += swayOffset.current.y;

      targetRot.add(recoilRot.current);

      // Smooth lerp
      weaponGroupRef.current.position.lerp(targetPos, delta * 18);
      weaponGroupRef.current.rotation.x = THREE.MathUtils.lerp(weaponGroupRef.current.rotation.x, targetRot.x, delta * 18);
      weaponGroupRef.current.rotation.y = THREE.MathUtils.lerp(weaponGroupRef.current.rotation.y, targetRot.y, delta * 18);
      weaponGroupRef.current.rotation.z = THREE.MathUtils.lerp(weaponGroupRef.current.rotation.z, targetRot.z, delta * 18);

      // Decay recoil spring
      recoilOffset.current.lerp(new THREE.Vector3(), delta * 15);
      recoilRot.current.lerp(new THREE.Vector3(), delta * 15);
      swayOffset.current.lerp(new THREE.Vector2(), delta * 8);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full cursor-crosshair overflow-hidden select-none"
      onClick={requestPointerLock}
    >
      {/* 3D Canvas mounts here */}
    </div>
  );
};
