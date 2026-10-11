import React, { useState } from 'react';
import { Weapon, GameMode, BotDifficulty, Operator, WeaponSkin, OpticType } from '../../types/game';
import { OPERATORS } from '../../data/weapons';
import { soundEffects } from '../../services/soundEffects';
import { Crosshair, Shield, Play, Settings, User, Sliders, Volume2, VolumeX, Sparkles, Target, Zap } from 'lucide-react';

interface MainMenuProps {
  weapons: Weapon[];
  currentWeaponIndex: number;
  onSelectWeapon: (idx: number) => void;
  onUpdateWeaponCustomization: (idx: number, skin: WeaponSkin, optic: OpticType) => void;
  selectedOperator: Operator;
  onSelectOperator: (op: Operator) => void;
  gameMode: GameMode;
  onSelectGameMode: (mode: GameMode) => void;
  botDifficulty: BotDifficulty;
  onSelectBotDifficulty: (diff: BotDifficulty) => void;
  botCount: number;
  onSelectBotCount: (count: number) => void;
  sensitivity: number;
  onUpdateSensitivity: (sens: number) => void;
  volume: number;
  onUpdateVolume: (vol: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onStartGame: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  weapons,
  currentWeaponIndex,
  onSelectWeapon,
  onUpdateWeaponCustomization,
  selectedOperator,
  onSelectOperator,
  gameMode,
  onSelectGameMode,
  botDifficulty,
  onSelectBotDifficulty,
  botCount,
  onSelectBotCount,
  sensitivity,
  onUpdateSensitivity,
  volume,
  onUpdateVolume,
  isMuted,
  onToggleMute,
  onStartGame,
}) => {
  const [activeTab, setActiveTab] = useState<'deploy' | 'gunsmith' | 'operators' | 'settings'>('deploy');

  const activeWeapon = weapons[currentWeaponIndex];

  const handleTabChange = (tab: 'deploy' | 'gunsmith' | 'operators' | 'settings') => {
    soundEffects.playUIClick();
    setActiveTab(tab);
  };

  const handleDeploy = () => {
    soundEffects.playUIClick();
    soundEffects.playVoiceCallout('Deploying to combat sector. Stay frosty!');
    onStartGame();
  };

  return (
    <div className="relative w-full h-full bg-slate-950 text-white font-tactical overflow-y-auto overflow-x-hidden select-none">
      {/* Background Cinematic Art */}
      <div className="absolute inset-0 z-0">
        <img
          src="/src/assets/images/cod_menu_backdrop_1791664153989.jpg"
          alt="Battlefield Key Art"
          className="w-full h-full object-cover object-center brightness-[0.38] contrast-125"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col min-h-full">
        {/* TOP BAR: Clean 3-zone Top Bar Contract */}
        <header className="flex items-center justify-between gap-8 px-6 md:px-10 py-5 border-b border-white/10 backdrop-blur-md bg-black/40">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
            <span className="text-2xl font-black tracking-widest text-white uppercase italic">
              STRIKE<span className="text-amber-500">OPS</span>
            </span>
            <span className="text-xs tracking-wider text-slate-400 font-mono hidden sm:inline">
              // MODERN COMBAT
            </span>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="flex items-center gap-6 text-sm font-semibold tracking-wider uppercase text-slate-300">
            <button
              onClick={() => handleTabChange('deploy')}
              className={`hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'deploy' ? 'text-amber-400 border-b-2 border-amber-400 pb-1' : ''
              }`}
            >
              DEPLOY
            </button>
            <button
              onClick={() => handleTabChange('gunsmith')}
              className={`hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'gunsmith' ? 'text-amber-400 border-b-2 border-amber-400 pb-1' : ''
              }`}
            >
              GUNSMITH
            </button>
            <button
              onClick={() => handleTabChange('operators')}
              className={`hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'operators' ? 'text-amber-400 border-b-2 border-amber-400 pb-1' : ''
              }`}
            >
              OPERATORS
            </button>
            <button
              onClick={() => handleTabChange('settings')}
              className={`hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'settings' ? 'text-amber-400 border-b-2 border-amber-400 pb-1' : ''
              }`}
            >
              SETTINGS
            </button>
          </nav>

          {/* Zone 3: Primary Action CTA */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleDeploy}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-black tracking-widest uppercase bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-lg shadow-lg shadow-amber-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Play className="w-4 h-4 fill-current" />
              DEPLOY NOW
            </button>
          </div>
        </header>

        {/* TAB 1: DEPLOY & MATCH SETUP */}
        {activeTab === 'deploy' && (
          <div className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 8 Cols: Game Mode & Map Briefing */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Header Title */}
              <div>
                <span className="text-xs uppercase tracking-widest text-amber-500 font-bold">
                  TACTICAL ENGAGEMENT
                </span>
                <h1 className="text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-white mt-1">
                  OPERATION: DESERT PROTOCOL
                </h1>
                <p className="text-slate-400 text-sm mt-2 font-sans max-w-2xl">
                  Infiltrate the contested Rust Container facility. Neutralize hostile bot squads, maintain high-speed slide mobility, and secure airspace dominance.
                </p>
              </div>

              {/* Game Mode Selector */}
              <div className="flex flex-col gap-3">
                <span className="text-xs uppercase tracking-widest text-slate-400">SELECT GAME MODE</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'tdm', label: 'TEAM DEATHMATCH', desc: '5v5 Target: 25 Kills' },
                    { id: 'free_for_all', label: 'FREE FOR ALL', desc: 'Solo Blood Strike Elimination' },
                    { id: 'gun_game', label: 'GUN GAME', desc: 'Progress weapons on kill' },
                    { id: 'training', label: 'DRILL TRAINING', desc: 'Target practice combat' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => {
                        soundEffects.playUIClick();
                        onSelectGameMode(mode.id as GameMode);
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        gameMode === mode.id
                          ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                          : 'bg-slate-900/60 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-sm font-bold tracking-wide">{mode.label}</div>
                      <div className="text-[11px] text-slate-400 mt-1 font-sans">{mode.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bot Difficulty & Squad Density */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 backdrop-blur-sm">
                  <span className="text-xs uppercase tracking-widest text-slate-400 block mb-2">
                    BOT AI DIFFICULTY
                  </span>
                  <div className="flex gap-2">
                    {(['recruit', 'regular', 'veteran'] as BotDifficulty[]).map((diff) => (
                      <button
                        key={diff}
                        onClick={() => {
                          soundEffects.playUIClick();
                          onSelectBotDifficulty(diff);
                        }}
                        className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all ${
                          botDifficulty === diff
                            ? 'bg-amber-500 text-black border-amber-400 font-extrabold'
                            : 'bg-black/40 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 backdrop-blur-sm">
                  <span className="text-xs uppercase tracking-widest text-slate-400 block mb-2">
                    ENEMY COMBATANTS ({botCount} BOTS)
                  </span>
                  <div className="flex gap-2">
                    {[2, 4, 6, 8].map((count) => (
                      <button
                        key={count}
                        onClick={() => {
                          soundEffects.playUIClick();
                          onSelectBotCount(count);
                        }}
                        className={`flex-1 py-2 text-xs font-bold font-mono rounded-lg border transition-all ${
                          botCount === count
                            ? 'bg-amber-500 text-black border-amber-400 font-extrabold'
                            : 'bg-black/40 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        {count} BOTS
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Map Recon Intel Card */}
              <div className="relative rounded-xl overflow-hidden border border-white/15 bg-slate-900/80 shadow-2xl">
                <img
                  src="/src/assets/images/tactical_map_rust_1791664188086.jpg"
                  alt="Sector Satellite Map"
                  className="w-full h-44 object-cover object-center brightness-75"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-4 flex flex-col justify-end">
                  <span className="text-[10px] tracking-widest text-amber-400 uppercase font-mono">
                    SATELLITE RECON PROTOCOL · SECTOR RUST-04
                  </span>
                  <div className="text-lg font-bold uppercase tracking-wide text-white">
                    CONTAINER YARD & CENTRAL WATCHTOWER
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Close-quarters flanking routes, shipping container verticality, high watchtower sightlines.
                  </div>
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Active Operator & Loadout Preview */}
            <div className="lg:col-span-4 flex flex-col gap-5">
              {/* Active Operator Card */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md shadow-xl flex flex-col">
                <span className="text-xs uppercase tracking-widest text-slate-400">ASSIGNED OPERATOR</span>
                <div className="flex items-center gap-4 mt-3">
                  <img
                    src={selectedOperator.avatarUrl}
                    alt={selectedOperator.name}
                    className="w-16 h-16 rounded-xl object-cover border border-amber-500/40 shadow-md"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="text-xl font-black uppercase tracking-wide text-white">
                      {selectedOperator.name}
                    </div>
                    <div className="text-xs text-amber-400 font-mono">{selectedOperator.callsign}</div>
                    <div className="text-xs text-slate-400 mt-1">{selectedOperator.role}</div>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-black/40 border border-white/5">
                  <div className="text-xs font-bold text-amber-400 uppercase flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    PERK: {selectedOperator.perk}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 font-sans">
                    {selectedOperator.perkDescription}
                  </p>
                </div>
              </div>

              {/* Active Primary Weapon Card */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md shadow-xl flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-widest text-slate-400">PRIMARY LOADOUT</span>
                  <button
                    onClick={() => handleTabChange('gunsmith')}
                    className="text-xs font-bold text-amber-400 hover:underline uppercase"
                  >
                    MODIFY
                  </button>
                </div>

                <div className="mt-3">
                  <div className="text-2xl font-black uppercase text-white tracking-wide">
                    {activeWeapon.name}
                  </div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-mono">
                    CALIBER: {activeWeapon.type} · OPTIC: {activeWeapon.optic.replace('_', ' ')}
                  </div>
                </div>

                {/* Weapon Stats Gauges */}
                <div className="flex flex-col gap-2 mt-4">
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>DAMAGE</span>
                      <span className="font-mono text-white">{activeWeapon.damage}</span>
                    </div>
                    <div className="h-1.5 bg-black/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${Math.min(100, (activeWeapon.damage / 150) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>FIRE RATE</span>
                      <span className="font-mono text-white">{Math.round(60000 / activeWeapon.fireRate)} RPM</span>
                    </div>
                    <div className="h-1.5 bg-black/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-500 rounded-full"
                        style={{ width: `${Math.min(100, (activeWeapon.fireRate < 200 ? 90 : activeWeapon.fireRate < 500 ? 60 : 30))}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>MAG CAPACITY</span>
                      <span className="font-mono text-white">{activeWeapon.magSize} RDS</span>
                    </div>
                    <div className="h-1.5 bg-black/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.min(100, (activeWeapon.magSize / 35) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleDeploy}
                  className="mt-6 w-full py-3.5 bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-black tracking-widest text-sm uppercase rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  CONFIRM & DEPLOY
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GUNSMITH LOADOUT */}
        {activeTab === 'gunsmith' && (
          <div className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8">
            <div>
              <span className="text-xs uppercase tracking-widest text-amber-500 font-bold">
                WEAPON CUSTOMIZATION
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-white mt-1">
                TACTICAL GUNSMITH
              </h1>
              <p className="text-slate-400 text-sm mt-1 font-sans">
                Equip tactical skins, precision optics, and configure your modern combat arsenal.
              </p>
            </div>

            {/* Weapon Selector Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {weapons.map((w, idx) => (
                <button
                  key={w.id}
                  onClick={() => {
                    soundEffects.playUIClick();
                    onSelectWeapon(idx);
                  }}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    currentWeaponIndex === idx
                      ? 'bg-amber-500/20 border-amber-500 text-white shadow-xl shadow-amber-500/10'
                      : 'bg-slate-900/60 border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <div className="text-xs uppercase tracking-wider text-amber-400 font-mono">
                    SLOT 0{idx + 1} · {w.type.toUpperCase()}
                  </div>
                  <div className="text-base font-bold uppercase mt-1 text-white">{w.name}</div>
                  <div className="text-[11px] text-slate-400 mt-1 line-clamp-2 font-sans">{w.description}</div>
                </button>
              ))}
            </div>

            {/* Selected Weapon Detail & Customization */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left 6 cols: Weapon Specs */}
              <div className="lg:col-span-6 p-6 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md flex flex-col gap-6">
                <div>
                  <span className="text-xs uppercase tracking-widest text-slate-400 font-mono">CURRENT FIREARM</span>
                  <h2 className="text-2xl font-black uppercase text-white mt-1">{activeWeapon.name}</h2>
                  <p className="text-sm text-slate-300 font-sans mt-2">{activeWeapon.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">BASE DAMAGE</span>
                    <div className="text-xl font-bold font-mono text-white mt-0.5">{activeWeapon.damage}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">HEADSHOT MULT</span>
                    <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
                      {activeWeapon.headshotMultiplier}x
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">RELOAD TIME</span>
                    <div className="text-xl font-bold font-mono text-white mt-0.5">
                      {(activeWeapon.reloadTime / 1000).toFixed(1)}s
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">MAG CAPACITY</span>
                    <div className="text-xl font-bold font-mono text-white mt-0.5">{activeWeapon.magSize}</div>
                  </div>
                </div>
              </div>

              {/* Right 6 cols: Camo Skin & Optic Attachments */}
              <div className="lg:col-span-6 flex flex-col gap-6">
                {/* Camo Skins */}
                <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md">
                  <span className="text-xs uppercase tracking-widest text-slate-400 block mb-3">
                    CAMO SKIN FINISH
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'tactical_black', label: 'Tactical Black', color: 'bg-zinc-800' },
                      { id: 'desert_camo', label: 'Desert Tan Camo', color: 'bg-amber-800' },
                      { id: 'obsidian_gold', label: 'Obsidian Gold', color: 'bg-yellow-600' },
                      { id: 'cyber_carbon', label: 'Cyber Carbon Cyan', color: 'bg-cyan-700' },
                    ].map((skin) => (
                      <button
                        key={skin.id}
                        onClick={() => {
                          soundEffects.playUIClick();
                          onUpdateWeaponCustomization(currentWeaponIndex, skin.id as WeaponSkin, activeWeapon.optic);
                        }}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                          activeWeapon.skin === skin.id
                            ? 'bg-amber-500/20 border-amber-500 text-white font-bold'
                            : 'bg-black/40 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full ${skin.color} border border-white/20`} />
                        <span className="text-xs uppercase">{skin.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optics */}
                <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md">
                  <span className="text-xs uppercase tracking-widest text-slate-400 block mb-3">
                    OPTIC SIGHT ATTACHMENT
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'iron_sights', label: 'Iron Sights', zoom: '1.0x' },
                      { id: 'red_dot', label: 'Reflex Red Dot', zoom: '1.25x' },
                      { id: 'holo_sight', label: 'Holographic Sight', zoom: '1.5x' },
                      { id: 'sniper_scope', label: 'Sniper Scope', zoom: '4.0x' },
                    ].map((optic) => (
                      <button
                        key={optic.id}
                        onClick={() => {
                          soundEffects.playUIClick();
                          onUpdateWeaponCustomization(currentWeaponIndex, activeWeapon.skin, optic.id as OpticType);
                        }}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          activeWeapon.optic === optic.id
                            ? 'bg-amber-500/20 border-amber-500 text-white font-bold'
                            : 'bg-black/40 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="text-xs uppercase">{optic.label}</div>
                        <div className="text-[10px] text-amber-400 font-mono mt-0.5">{optic.zoom} ZOOM</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: OPERATOR SELECTION */}
        {activeTab === 'operators' && (
          <div className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full flex flex-col gap-8">
            <div>
              <span className="text-xs uppercase tracking-widest text-amber-500 font-bold">
                SPECIAL FORCES ROSTER
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-white mt-1">
                OPERATOR SELECTION
              </h1>
              <p className="text-slate-400 text-sm mt-1 font-sans">
                Choose your field combat specialist. Each operator features unique passive combat perks.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {OPERATORS.map((op) => (
                <div
                  key={op.id}
                  onClick={() => {
                    soundEffects.playUIClick();
                    onSelectOperator(op);
                  }}
                  className={`p-6 rounded-2xl border backdrop-blur-md cursor-pointer transition-all ${
                    selectedOperator.id === op.id
                      ? 'bg-amber-500/15 border-amber-500 shadow-2xl shadow-amber-500/15'
                      : 'bg-slate-900/80 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-5">
                    <img
                      src={op.avatarUrl}
                      alt={op.name}
                      className="w-24 h-24 rounded-2xl object-cover border-2 border-amber-500/40 shadow-xl"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <span className="text-xs text-amber-400 font-mono uppercase">{op.callsign}</span>
                      <h3 className="text-2xl font-black uppercase text-white mt-0.5">{op.name}</h3>
                      <span className="text-xs text-slate-400">{op.role}</span>
                    </div>
                  </div>

                  <div className="mt-5 p-4 rounded-xl bg-black/40 border border-white/5">
                    <div className="text-xs font-bold text-amber-400 uppercase flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      ACTIVE PERK: {op.perk}
                    </div>
                    <p className="text-xs text-slate-300 mt-1 font-sans">{op.perkDescription}</p>
                  </div>

                  <button
                    className={`mt-4 w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      selectedOperator.id === op.id
                        ? 'bg-amber-500 text-black font-extrabold'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {selectedOperator.id === op.id ? 'CURRENTLY ACTIVE' : 'EQUIP OPERATOR'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SETTINGS & CONTROLS */}
        {activeTab === 'settings' && (
          <div className="flex-1 p-6 md:p-10 max-w-4xl mx-auto w-full flex flex-col gap-6">
            <div>
              <span className="text-xs uppercase tracking-widest text-amber-500 font-bold">
                SYSTEM CONFIGURATION
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-white mt-1">
                TACTICAL SETTINGS
              </h1>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md flex flex-col gap-6">
              {/* Mouse Sensitivity */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold uppercase tracking-wider text-slate-300">
                    MOUSE LOOK SENSITIVITY
                  </span>
                  <span className="text-sm font-mono font-bold text-amber-400">{sensitivity}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="200"
                  value={sensitivity}
                  onChange={(e) => onUpdateSensitivity(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Master Volume */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold uppercase tracking-wider text-slate-300">
                    MASTER AUDIO VOLUME
                  </span>
                  <span className="text-sm font-mono font-bold text-amber-400">{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(volume * 100)}
                  onChange={(e) => onUpdateVolume(parseInt(e.target.value, 10) / 100)}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Mute toggle */}
              <div className="flex justify-between items-center pt-2 border-t border-white/10">
                <span className="text-sm font-bold uppercase tracking-wider text-slate-300">AUDIO MUTE</span>
                <button
                  onClick={onToggleMute}
                  className={`p-2 rounded-lg border flex items-center gap-2 text-xs font-bold uppercase ${
                    isMuted
                      ? 'bg-red-500/20 border-red-500 text-red-300'
                      : 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                  }`}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  {isMuted ? 'MUTED' : 'ENABLED'}
                </button>
              </div>

              {/* Control Mappings Cheatsheet */}
              <div className="pt-4 border-t border-white/10">
                <span className="text-xs uppercase tracking-widest text-slate-400 block mb-3 font-mono">
                  DEFAULT KEYBOARD & MOUSE ASSIGNMENTS
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-2.5 rounded bg-black/40 border border-white/5 flex justify-between">
                    <span className="text-slate-400">MOVE FORWARD / BACK / STRAFE</span>
                    <span className="text-white font-bold">W / A / S / D</span>
                  </div>
                  <div className="p-2.5 rounded bg-black/40 border border-white/5 flex justify-between">
                    <span className="text-slate-400">FIRE WEAPON</span>
                    <span className="text-white font-bold">LEFT CLICK</span>
                  </div>
                  <div className="p-2.5 rounded bg-black/40 border border-white/5 flex justify-between">
                    <span className="text-slate-400">AIM DOWN SIGHTS (ADS)</span>
                    <span className="text-white font-bold">RIGHT CLICK / Q</span>
                  </div>
                  <div className="p-2.5 rounded bg-black/40 border border-white/5 flex justify-between">
                    <span className="text-slate-400">TACTICAL SPRINT</span>
                    <span className="text-white font-bold">LEFT SHIFT</span>
                  </div>
                  <div className="p-2.5 rounded bg-black/40 border border-white/5 flex justify-between">
                    <span className="text-slate-400">TACTICAL SLIDE</span>
                    <span className="text-white font-bold">C / CTRL (WHILE SPRINTING)</span>
                  </div>
                  <div className="p-2.5 rounded bg-black/40 border border-white/5 flex justify-between">
                    <span className="text-slate-400">JUMP / CLIMB</span>
                    <span className="text-white font-bold">SPACE</span>
                  </div>
                  <div className="p-2.5 rounded bg-black/40 border border-white/5 flex justify-between">
                    <span className="text-slate-400">RELOAD AMMUNITION</span>
                    <span className="text-white font-bold">R</span>
                  </div>
                  <div className="p-2.5 rounded bg-black/40 border border-white/5 flex justify-between">
                    <span className="text-slate-400">WEAPON SWITCH</span>
                    <span className="text-white font-bold">1 / 2 / 3 / 4</span>
                  </div>
                  <div className="p-2.5 rounded bg-black/40 border border-white/5 flex justify-between">
                    <span className="text-slate-400">KILLSTREAK ACTIVATION</span>
                    <span className="text-white font-bold">4 (UAV) / 5 (MORTAR) / 6 (JUG)</span>
                  </div>
                  <div className="p-2.5 rounded bg-black/40 border border-white/5 flex justify-between">
                    <span className="text-slate-400">PAUSE / LOBBY MENU</span>
                    <span className="text-white font-bold">ESC</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
