import React, { useState } from 'react';
import { Weapon, KillfeedItem, HitEffect, DamageIndicator, Killstreak, GameMode } from '../../types/game';
import { Crosshair, Shield, Radio, Volume2, VolumeX, Smartphone, Eye, RotateCcw, Zap } from 'lucide-react';

interface TacticalHUDProps {
  weapon: Weapon;
  health: number;
  maxHealth: number;
  armor: number;
  maxArmor: number;
  currentMag: number;
  reserveAmmo: number;
  score: number;
  kills: number;
  deaths: number;
  headshots: number;
  killstreakCount: number;
  killstreaks: Killstreak[];
  onActivateKillstreak: (id: string) => void;
  isADS: boolean;
  hitEffects: HitEffect[];
  damageIndicators: DamageIndicator[];
  killfeed: KillfeedItem[];
  gameMode: GameMode;
  targetScore: number;
  matchTimeLeft: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  touchControlsActive: boolean;
  setTouchControlsActive: (active: boolean) => void;
  onTouchInput: (action: string, active: boolean, valX?: number, valY?: number) => void;
}

export const TacticalHUD: React.FC<TacticalHUDProps> = ({
  weapon,
  health,
  maxHealth,
  armor,
  maxArmor,
  currentMag,
  reserveAmmo,
  score,
  kills,
  deaths,
  headshots,
  killstreakCount,
  killstreaks,
  onActivateKillstreak,
  isADS,
  hitEffects,
  damageIndicators,
  killfeed,
  gameMode,
  targetScore,
  matchTimeLeft,
  isMuted,
  onToggleMute,
  onPause,
  touchControlsActive,
  setTouchControlsActive,
  onTouchInput,
}) => {
  const [touchFireActive, setTouchFireActive] = useState(false);
  const [touchADSActive, setTouchADSActive] = useState(false);

  // Format match time MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isLowHealth = health <= 35;
  const isSniperADS = isADS && weapon.type === 'sniper';

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 font-tactical overflow-hidden">
      {/* 1. Low Health Screen Blood Vignette */}
      {isLowHealth && (
        <div className="absolute inset-0 pointer-events-none border-[12px] md:border-[20px] border-red-600/40 shadow-[inset_0_0_80px_rgba(220,38,38,0.7)] animate-pulse" />
      )}

      {/* 2. Sniper Scope Fullscreen Overlay during ADS */}
      {isSniperADS && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/95 pointer-events-none">
          {/* Circular Scope Aperture */}
          <div className="relative w-[85vh] h-[85vh] max-w-[90vw] max-h-[90vw] rounded-full border-4 border-slate-700/80 bg-transparent overflow-hidden shadow-[0_0_120px_rgba(0,0,0,0.95)]">
            {/* Horizontal Reticle Line */}
            <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-red-500/80 -translate-y-1/2" />
            {/* Vertical Reticle Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-[1.5px] bg-red-500/80 -translate-x-1/2" />
            {/* Central Illuminated Dot */}
            <div className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full bg-red-500 -translate-x-1/2 -translate-y-1/2 shadow-[0_0_8px_#ef4444]" />
            {/* Mil-dot Range Marks */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-red-500/30 rounded-full" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border border-red-500/40 rounded-full" />
            {/* Tactical Grid Info */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 text-[10px] tracking-widest text-emerald-400 font-mono">
              RANGE: 120M · ELEV: 0.0 · WIND: 2.1KT
            </div>
          </div>
        </div>
      )}

      {/* 3. Dynamic Center Crosshair (Hidden when ADS) */}
      {!isADS && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-8 h-8 flex items-center justify-center">
            {/* Center Dot */}
            <div className="w-1.5 h-1.5 rounded-full bg-white/90 shadow-[0_0_4px_rgba(0,0,0,0.8)]" />
            {/* 4 Angled Reticle Ticks */}
            <div className="absolute top-0 w-0.5 h-2.5 bg-white/80" />
            <div className="absolute bottom-0 w-0.5 h-2.5 bg-white/80" />
            <div className="absolute left-0 w-2.5 h-0.5 bg-white/80" />
            <div className="absolute right-0 w-2.5 h-0.5 bg-white/80" />
          </div>
        </div>
      )}

      {/* 4. Dynamic Hitmarkers Overlay */}
      {hitEffects.map((hit) => (
        <div key={hit.id} className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="relative w-12 h-12 flex items-center justify-center animate-hitmarker">
            {/* X-Marker ticks */}
            <div
              className={`absolute w-4 h-1 rotate-45 ${
                hit.type === 'headshot' ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : hit.type === 'kill' ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-white'
              }`}
            />
            <div
              className={`absolute w-4 h-1 -rotate-45 ${
                hit.type === 'headshot' ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : hit.type === 'kill' ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-white'
              }`}
            />
          </div>
          {hit.type === 'headshot' && (
            <span className="text-xs font-bold tracking-widest text-amber-400 uppercase -mt-1 drop-shadow-md">
              HEADSHOT
            </span>
          )}
          {hit.type === 'kill' && (
            <span className="text-sm font-extrabold tracking-widest text-red-500 uppercase -mt-1 drop-shadow-lg">
              +100 ELIMINATED
            </span>
          )}
        </div>
      ))}

      {/* 5. Directional Damage Indicators */}
      {damageIndicators.map((ind) => (
        <div
          key={ind.id}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ transform: `rotate(${ind.angle}deg)` }}
        >
          <div className="w-56 h-56 rounded-full border-t-4 border-t-red-600/90 shadow-[0_-12px_24px_rgba(239,68,68,0.8)] opacity-90 animate-pulse" />
        </div>
      ))}

      {/* 6. TOP BAR: Match Header & Mode Status */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
        {/* Left: Tactical Radar / Minimap */}
        <div className="flex items-center gap-3">
          <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-700/60 p-2 shadow-2xl flex flex-col justify-between overflow-hidden">
            {/* Radar Circle */}
            <div className="relative w-full h-full rounded-full border border-emerald-500/40 flex items-center justify-center">
              {/* Radar Crosshair */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-[1px] bg-emerald-500/20" />
                <div className="absolute h-full w-[1px] bg-emerald-500/20" />
              </div>
              {/* Rotating Sweep Beam */}
              <div className="absolute inset-0 rounded-full border-t border-r border-emerald-400/60 animate-spin" style={{ animationDuration: '3s' }} />
              {/* Player Arrow */}
              <div className="w-2.5 h-2.5 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-emerald-400 shadow-[0_0_6px_#10b981]" />
              {/* Hostile Blips */}
              <div className="absolute top-4 right-6 w-2 h-2 rounded-full bg-red-500 animate-ping shadow-[0_0_6px_#ef4444]" />
              <div className="absolute bottom-6 left-5 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" />
            </div>
            {/* Compass Heading */}
            <div className="absolute bottom-1 left-2 text-[9px] font-mono tracking-widest text-slate-400">
              SEC: OUTPOST-04
            </div>
          </div>

          {/* Match Score Strip */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/80 backdrop-blur-md border border-slate-700/60 rounded-lg">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-300">
                {gameMode.replace('_', ' ')}
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-xs font-mono font-bold text-amber-400">
                {kills} / {targetScore} KILLS
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 px-3">
              <span>SCORE: <strong className="text-white font-mono">{score}</strong></span>
              <span>·</span>
              <span>K/D: <strong className="text-emerald-400 font-mono">{(kills / Math.max(1, deaths)).toFixed(1)}</strong></span>
            </div>
          </div>
        </div>

        {/* Center: Match Timer */}
        <div className="hidden sm:flex flex-col items-center px-4 py-1.5 bg-slate-950/80 backdrop-blur-md border border-slate-700/60 rounded-lg shadow-xl">
          <span className="text-[10px] tracking-widest uppercase text-slate-400 font-medium">OPERATION TIME</span>
          <span className="text-lg font-mono font-bold tracking-wider text-white">
            {formatTime(matchTimeLeft)}
          </span>
        </div>

        {/* Right: Tactical Killfeed & HUD Actions */}
        <div className="flex flex-col items-end gap-2">
          {/* Top Control Buttons (Pointer-events enabled) */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => setTouchControlsActive(!touchControlsActive)}
              className="p-2 bg-slate-900/80 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700/60 transition-colors"
              title="Toggle Touch Controls"
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleMute}
              className="p-2 bg-slate-900/80 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700/60 transition-colors"
              title="Toggle Audio"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
            <button
              onClick={onPause}
              className="px-3 py-1.5 text-xs font-bold tracking-wider uppercase bg-slate-900/80 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700/60 transition-colors"
            >
              MENU
            </button>
          </div>

          {/* Killfeed list */}
          <div className="flex flex-col gap-1 items-end w-64 md:w-72 mt-2">
            {killfeed.slice(0, 4).map((k) => (
              <div
                key={k.id}
                className={`flex items-center gap-2 px-2.5 py-1 text-xs rounded-md backdrop-blur-md border transition-all ${
                  k.isPlayerKiller
                    ? 'bg-amber-950/80 border-amber-600/50 text-amber-200'
                    : k.isPlayerVictim
                    ? 'bg-red-950/80 border-red-600/50 text-red-200'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300'
                }`}
              >
                <span className="font-bold tracking-wide truncate max-w-[80px]">{k.killer}</span>
                <span className="text-[10px] text-slate-400 font-mono px-1">[{k.weaponName}]</span>
                {k.isHeadshot && <span className="text-amber-400 text-[10px] font-bold">🎯</span>}
                <span className="font-bold tracking-wide truncate max-w-[80px]">{k.victim}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 7. RIGHT SIDE: Killstreaks Quick Access Bar */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 pointer-events-auto">
        <span className="text-[10px] uppercase tracking-widest text-slate-400 text-right pr-1">KILLSTREAKS</span>
        {killstreaks.map((streak, idx) => (
          <button
            key={streak.id}
            onClick={() => streak.ready && onActivateKillstreak(streak.id)}
            disabled={!streak.ready}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all ${
              streak.ready
                ? 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse cursor-pointer'
                : 'bg-slate-950/70 border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
            }`}
          >
            <div className="w-6 h-6 rounded flex items-center justify-center bg-black/40 text-xs font-mono font-bold">
              {idx + 4}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold tracking-wide">{streak.name}</span>
              <span className="text-[9px] font-mono text-slate-400">
                {streak.ready ? 'READY TO DEPLOY' : `${streak.killsRequired} KILLS REQ`}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* 8. BOTTOM LEFT: Health, Armor & Tactical Status */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-2 max-w-sm">
        {/* Armor Plate Bar */}
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-sky-400" />
          <div className="flex-1 bg-slate-950/80 border border-slate-800 rounded-sm h-3 p-0.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-600 to-sky-400 transition-all duration-200"
              style={{ width: `${Math.max(0, (armor / maxArmor) * 100)}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-sky-400 w-8 text-right">{armor}</span>
        </div>

        {/* Health Bar */}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 flex items-center justify-center font-bold text-xs text-red-500">+</div>
          <div className="flex-1 bg-slate-950/80 border border-slate-800 rounded-sm h-4 p-0.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-200 ${
                isLowHealth
                  ? 'bg-gradient-to-r from-red-600 to-red-500 animate-pulse'
                  : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
              }`}
              style={{ width: `${Math.max(0, (health / maxHealth) * 100)}%` }}
            />
          </div>
          <span
            className={`text-sm font-mono font-bold w-8 text-right ${
              isLowHealth ? 'text-red-500' : 'text-emerald-400'
            }`}
          >
            {health}
          </span>
        </div>

        {/* Tactical Keybinds Reminder */}
        <div className="hidden md:flex items-center gap-3 text-[10px] tracking-wider text-slate-400 pt-1">
          <span>[SHIFT] SPRINT</span>
          <span>·</span>
          <span>[C] SLIDE</span>
          <span>·</span>
          <span>[R] RELOAD</span>
          <span>·</span>
          <span>[R-CLICK / Q] ADS</span>
          <span>·</span>
          <span>[1-4] WEAPONS</span>
        </div>
      </div>

      {/* 9. BOTTOM RIGHT: Weapon Card & Ammunition Display */}
      <div className="absolute bottom-6 right-6 flex items-end gap-4">
        <div className="flex flex-col items-end px-5 py-3 bg-slate-950/85 backdrop-blur-md border border-slate-700/60 rounded-xl shadow-2xl">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold tracking-widest text-slate-300 uppercase">
              {weapon.name}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
              {weapon.automatic ? 'AUTO' : 'SEMI'}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span
              className={`text-5xl font-mono font-extrabold tracking-tighter ${
                currentMag <= 5 ? 'text-red-500 animate-pulse' : 'text-white'
              }`}
            >
              {currentMag}
            </span>
            <span className="text-lg font-mono font-bold text-slate-500">
              / {reserveAmmo}
            </span>
          </div>

          <div className="text-[10px] text-slate-400 tracking-wider font-mono mt-1">
            CALIBER · {weapon.type.toUpperCase()}
          </div>
        </div>
      </div>

      {/* 10. ON-SCREEN TOUCH CONTROLS FOR MOBILE / TABLET */}
      {touchControlsActive && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Virtual Movement Joystick on Left */}
          <div
            className="absolute bottom-20 left-8 w-32 h-32 rounded-full border-2 border-white/20 bg-black/40 backdrop-blur-sm pointer-events-auto flex items-center justify-center touch-none"
            onTouchMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const touch = e.touches[0];
              const centerX = rect.left + rect.width / 2;
              const centerY = rect.top + rect.height / 2;
              const deltaX = (touch.clientX - centerX) / (rect.width / 2);
              const deltaY = (touch.clientY - centerY) / (rect.height / 2);
              onTouchInput('move', true, THREE_CLAMP(deltaX, -1, 1), THREE_CLAMP(deltaY, -1, 1));
            }}
            onTouchEnd={() => {
              onTouchInput('move', false, 0, 0);
            }}
          >
            <div className="w-12 h-12 rounded-full bg-white/40 shadow-lg pointer-events-none" />
          </div>

          {/* Action Buttons on Right */}
          <div className="absolute bottom-24 right-8 flex flex-col gap-3 pointer-events-auto">
            {/* ADS Button */}
            <button
              onTouchStart={() => {
                setTouchADSActive(!touchADSActive);
                onTouchInput('ads', !touchADSActive);
              }}
              className={`w-14 h-14 rounded-full border flex items-center justify-center transition-all ${
                touchADSActive
                  ? 'bg-amber-500/80 border-amber-400 text-black font-bold shadow-lg shadow-amber-500/50'
                  : 'bg-black/60 border-white/30 text-white'
              }`}
            >
              <Eye className="w-6 h-6" />
            </button>

            {/* Fire Button */}
            <button
              onTouchStart={() => {
                setTouchFireActive(true);
                onTouchInput('fire', true);
              }}
              onTouchEnd={() => {
                setTouchFireActive(false);
                onTouchInput('fire', false);
              }}
              className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all ${
                touchFireActive
                  ? 'bg-red-600 scale-95 border-red-400 shadow-xl shadow-red-500/50'
                  : 'bg-red-500/80 border-white text-white'
              }`}
            >
              <Crosshair className="w-8 h-8" />
            </button>

            {/* Jump & Slide Row */}
            <div className="flex gap-2">
              <button
                onTouchStart={() => onTouchInput('jump', true)}
                onTouchEnd={() => onTouchInput('jump', false)}
                className="w-12 h-12 rounded-full bg-black/60 border border-white/30 text-white text-xs font-bold flex items-center justify-center"
              >
                JUMP
              </button>
              <button
                onTouchStart={() => onTouchInput('slide', true)}
                onTouchEnd={() => onTouchInput('slide', false)}
                className="w-12 h-12 rounded-full bg-black/60 border border-white/30 text-white text-xs font-bold flex items-center justify-center"
              >
                SLIDE
              </button>
              <button
                onTouchStart={() => onTouchInput('reload', true)}
                onTouchEnd={() => onTouchInput('reload', false)}
                className="w-12 h-12 rounded-full bg-black/60 border border-white/30 text-white flex items-center justify-center"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function THREE_CLAMP(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
