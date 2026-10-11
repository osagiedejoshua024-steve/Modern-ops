export type WeaponType = 'rifle' | 'shotgun' | 'sniper' | 'pistol';

export type WeaponSkin = 'tactical_black' | 'desert_camo' | 'obsidian_gold' | 'cyber_carbon';

export type OpticType = 'iron_sights' | 'red_dot' | 'holo_sight' | 'sniper_scope';

export interface Weapon {
  id: string;
  name: string;
  type: WeaponType;
  damage: number;
  headshotMultiplier: number;
  fireRate: number; // ms between shots
  magSize: number;
  currentMag: number;
  reserveAmmo: number;
  maxReserveAmmo: number;
  reloadTime: number; // ms
  spread: number;
  recoil: number;
  adsZoom: number; // camera FOV during ADS
  automatic: boolean;
  skin: WeaponSkin;
  optic: OpticType;
  unlocked: boolean;
  description: string;
}

export type GameMode = 'tdm' | 'free_for_all' | 'gun_game' | 'training';

export type BotDifficulty = 'recruit' | 'regular' | 'veteran';

export interface Operator {
  id: string;
  name: string;
  callsign: string;
  role: string;
  avatarUrl: string;
  perk: string;
  perkDescription: string;
}

export interface BotState {
  id: string;
  name: string;
  team: 'enemy' | 'friendly';
  health: number;
  maxHealth: number;
  position: [number, number, number];
  rotation: number;
  state: 'patrol' | 'chase' | 'attack' | 'dead';
  targetPos: [number, number, number] | null;
  lastShotTime: number;
  respawnTimer: number;
  kills: number;
  deaths: number;
}

export interface KillfeedItem {
  id: string;
  killer: string;
  victim: string;
  weaponName: string;
  isHeadshot: boolean;
  isPlayerKiller: boolean;
  isPlayerVictim: boolean;
  timestamp: number;
}

export interface HitEffect {
  id: string;
  type: 'body' | 'headshot' | 'kill';
  timestamp: number;
}

export interface DamageIndicator {
  id: string;
  angle: number; // angle in degrees relative to player facing
  timestamp: number;
}

export interface Killstreak {
  id: string;
  name: string;
  killsRequired: number;
  icon: string;
  ready: boolean;
  active: boolean;
  duration?: number;
}

export interface MatchStats {
  kills: number;
  deaths: number;
  headshots: number;
  shotsFired: number;
  shotsHit: number;
  score: number;
  teamScore: number;
  enemyScore: number;
  timeRemaining: number;
  mvp: string;
}
