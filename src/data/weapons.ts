import { Weapon, Operator, Killstreak } from '../types/game';

export const DEFAULT_WEAPONS: Weapon[] = [
  {
    id: 'm4a1',
    name: 'M4A1 CARBINE',
    type: 'rifle',
    damage: 34,
    headshotMultiplier: 2.2,
    fireRate: 110, // ~545 RPM
    magSize: 30,
    currentMag: 30,
    reserveAmmo: 120,
    maxReserveAmmo: 120,
    reloadTime: 1800,
    spread: 0.025,
    recoil: 0.038,
    adsZoom: 48,
    automatic: true,
    skin: 'tactical_black',
    optic: 'holo_sight',
    unlocked: true,
    description: 'Versatile military-standard assault rifle. High rate of fire with predictable vertical climb.'
  },
  {
    id: 'krm262',
    name: 'KRM-262 TACTICAL',
    type: 'shotgun',
    damage: 130,
    headshotMultiplier: 1.8,
    fireRate: 850,
    magSize: 8,
    currentMag: 8,
    reserveAmmo: 32,
    maxReserveAmmo: 32,
    reloadTime: 2200,
    spread: 0.08,
    recoil: 0.08,
    adsZoom: 60,
    automatic: false,
    skin: 'desert_camo',
    optic: 'iron_sights',
    unlocked: true,
    description: 'High-impact pump-action shotgun. Lethal close-quarters stopping power with devastating spread.'
  },
  {
    id: 'l115a3',
    name: 'L115A3 ARCTIC SNIPER',
    type: 'sniper',
    damage: 150,
    headshotMultiplier: 3.0,
    fireRate: 1200,
    magSize: 5,
    currentMag: 5,
    reserveAmmo: 20,
    maxReserveAmmo: 20,
    reloadTime: 2600,
    spread: 0.005,
    recoil: 0.12,
    adsZoom: 22,
    automatic: false,
    skin: 'obsidian_gold',
    optic: 'sniper_scope',
    unlocked: true,
    description: 'Bolt-action precision anti-materiel sniper. One-shot elimination to upper torso and head.'
  },
  {
    id: 'glock18',
    name: 'G-18 TACTICAL PISTOL',
    type: 'pistol',
    damage: 28,
    headshotMultiplier: 2.0,
    fireRate: 140,
    magSize: 17,
    currentMag: 17,
    reserveAmmo: 68,
    maxReserveAmmo: 68,
    reloadTime: 1400,
    spread: 0.03,
    recoil: 0.028,
    adsZoom: 62,
    automatic: false,
    skin: 'cyber_carbon',
    optic: 'red_dot',
    unlocked: true,
    description: 'Lightweight sidearm engineered for rapid transition and close encounters.'
  }
];

export const OPERATORS: Operator[] = [
  {
    id: 'ghost',
    name: 'GHOST',
    callsign: 'KAGE-01',
    role: 'Assault Recon',
    avatarUrl: '/src/assets/images/operator_ghost_tactical_1791664166432.jpg',
    perk: 'LIGHTWEIGHT SPRINT',
    perkDescription: '+15% Tactical Sprint duration and faster slide recovery.'
  },
  {
    id: 'valkyrie',
    name: 'VALKYRIE',
    callsign: 'VALK-07',
    role: 'Precision Scout',
    avatarUrl: '/src/assets/images/operator_valkyrie_recon_1791664176374.jpg',
    perk: 'QUICK DRAW & ADS',
    perkDescription: '+25% faster weapon swap and Aim-Down-Sights acquisition.'
  }
];

export const KILLSTREAKS: Killstreak[] = [
  {
    id: 'uav',
    name: 'UAV RECON',
    killsRequired: 3,
    icon: 'Radar',
    ready: false,
    active: false,
    duration: 25000
  },
  {
    id: 'airstrike',
    name: 'MORTAR BARRAGE',
    killsRequired: 5,
    icon: 'Crosshair',
    ready: false,
    active: false,
    duration: 8000
  },
  {
    id: 'juggernaut',
    name: 'JUGGERNAUT PLATES',
    killsRequired: 7,
    icon: 'Shield',
    ready: false,
    active: false,
    duration: 30000
  }
];
