/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameCanvas } from './components/game3d/GameCanvas';
import { TacticalHUD } from './components/hud/TacticalHUD';
import { MainMenu } from './components/ui/MainMenu';
import { GameOverModal } from './components/ui/GameOverModal';
import { DEFAULT_WEAPONS, OPERATORS, KILLSTREAKS } from './data/weapons';
import {
  Weapon,
  WeaponSkin,
  OpticType,
  Operator,
  GameMode,
  BotDifficulty,
  KillfeedItem,
  HitEffect,
  DamageIndicator,
  Killstreak,
} from './types/game';
import { soundEffects } from './services/soundEffects';

export default function App() {
  // Game Phase State
  const [phase, setPhase] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [isPaused, setIsPaused] = useState(false);

  // Arsenal & Loadout State
  const [weapons, setWeapons] = useState<Weapon[]>(() => JSON.parse(JSON.stringify(DEFAULT_WEAPONS)));
  const [currentWeaponIndex, setCurrentWeaponIndex] = useState(0);
  const [selectedOperator, setSelectedOperator] = useState<Operator>(OPERATORS[0]);

  // Match Config
  const [gameMode, setGameMode] = useState<GameMode>('tdm');
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('regular');
  const [botCount, setBotCount] = useState(4);
  const [targetScore, setTargetScore] = useState(25);
  const [matchTimeLeft, setMatchTimeLeft] = useState(300); // 5 minutes

  // Settings
  const [sensitivity, setSensitivity] = useState(100);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  // Player Real-time HUD State
  const [health, setHealth] = useState(100);
  const [maxHealth, setMaxHealth] = useState(100);
  const [armor, setArmor] = useState(100);
  const [maxArmor, setMaxArmor] = useState(100);
  const [currentMag, setCurrentMag] = useState(DEFAULT_WEAPONS[0].currentMag);
  const [reserveAmmo, setReserveAmmo] = useState(DEFAULT_WEAPONS[0].reserveAmmo);
  const [isADS, setIsADS] = useState(false);

  // Combat Stats
  const [score, setScore] = useState(0);
  const [kills, setKills] = useState(0);
  const [deaths, setDeaths] = useState(0);
  const [headshots, setHeadshots] = useState(0);
  const [killstreakCount, setKillstreakCount] = useState(0);
  const [isMatchVictory, setIsMatchVictory] = useState(false);

  // Killstreaks
  const [killstreaks, setKillstreaks] = useState<Killstreak[]>(() =>
    JSON.parse(JSON.stringify(KILLSTREAKS))
  );

  // Effects & Feedback
  const [hitEffects, setHitEffects] = useState<HitEffect[]>([]);
  const [damageIndicators, setDamageIndicators] = useState<DamageIndicator[]>([]);
  const [killfeed, setKillfeed] = useState<KillfeedItem[]>([]);

  // Mobile / Touch controls state
  const [touchControlsActive, setTouchControlsActive] = useState(false);
  const [touchControls, setTouchControls] = useState({
    moveX: 0,
    moveY: 0,
    lookX: 0,
    lookY: 0,
    fire: false,
    ads: false,
    jump: false,
    slide: false,
    reload: false,
  });

  // Target score based on game mode
  useEffect(() => {
    if (gameMode === 'gun_game') {
      setTargetScore(12);
    } else if (gameMode === 'free_for_all') {
      setTargetScore(20);
    } else {
      setTargetScore(25);
    }
  }, [gameMode]);

  // Audio volume sync
  useEffect(() => {
    soundEffects.setVolume(volume);
  }, [volume]);

  // Match countdown timer
  useEffect(() => {
    if (phase !== 'playing' || isPaused) return;

    const timer = setInterval(() => {
      setMatchTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleMatchEnd(kills >= 10, { kills, deaths, headshots, score });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, isPaused, kills, deaths, headshots, score]);

  // Killstreak hotkey listeners (Keys 4, 5, 6)
  useEffect(() => {
    if (phase !== 'playing') return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Digit4' && killstreaks[0]?.ready) {
        handleActivateKillstreak('uav');
      } else if (e.code === 'Digit5' && killstreaks[1]?.ready) {
        handleActivateKillstreak('airstrike');
      } else if (e.code === 'Digit6' && killstreaks[2]?.ready) {
        handleActivateKillstreak('juggernaut');
      } else if (e.code === 'Escape') {
        setIsPaused((p) => !p);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, killstreaks]);

  // Start new game
  const handleStartGame = () => {
    setWeapons(JSON.parse(JSON.stringify(DEFAULT_WEAPONS)));
    setHealth(100);
    setMaxHealth(100);
    setArmor(100);
    setMaxArmor(100);
    setScore(0);
    setKills(0);
    setDeaths(0);
    setHeadshots(0);
    setKillstreakCount(0);
    setMatchTimeLeft(300);
    setKillfeed([]);
    setHitEffects([]);
    setDamageIndicators([]);
    setIsPaused(false);
    setKillstreaks(JSON.parse(JSON.stringify(KILLSTREAKS)));
    setPhase('playing');
  };

  const handleMatchEnd = (
    victory: boolean,
    finalStats: { kills: number; deaths: number; headshots: number; score: number }
  ) => {
    setIsMatchVictory(victory);
    setKills(finalStats.kills);
    setDeaths(finalStats.deaths);
    setHeadshots(finalStats.headshots);
    setScore(finalStats.score);
    setPhase('gameover');
  };

  // Weapon customization
  const handleUpdateWeaponCustomization = (idx: number, skin: WeaponSkin, optic: OpticType) => {
    setWeapons((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], skin, optic };
      return copy;
    });
  };

  // Hitmarker trigger
  const handleHitEffect = useCallback((type: 'body' | 'headshot' | 'kill') => {
    const id = `hit-${Date.now()}-${Math.random()}`;
    setHitEffects((prev) => [...prev, { id, type, timestamp: Date.now() }]);
    setTimeout(() => {
      setHitEffects((prev) => prev.filter((h) => h.id !== id));
    }, 220);
  }, []);

  // Directional damage indicator trigger
  const handleDamageTaken = useCallback((angle: number) => {
    const id = `dmg-${Date.now()}-${Math.random()}`;
    setDamageIndicators((prev) => [...prev, { id, angle, timestamp: Date.now() }]);
    setTimeout(() => {
      setDamageIndicators((prev) => prev.filter((d) => d.id !== id));
    }, 1200);
  }, []);

  // Killfeed item
  const handleKillfeed = useCallback((item: KillfeedItem) => {
    setKillfeed((prev) => [item, ...prev].slice(0, 6));
  }, []);

  // Killstreak earned
  const handleKillstreakEarned = useCallback((earned: Killstreak) => {
    setKillstreaks((prev) =>
      prev.map((k) => (k.id === earned.id ? { ...k, ready: true } : k))
    );
  }, []);

  // Killstreak activation
  const handleActivateKillstreak = (id: string) => {
    setKillstreaks((prev) =>
      prev.map((k) => (k.id === id ? { ...k, ready: false, active: true } : k))
    );
    // Reset active flag after duration
    setTimeout(() => {
      setKillstreaks((prev) =>
        prev.map((k) => (k.id === id ? { ...k, active: false } : k))
      );
    }, 3000);
  };

  // Touch controls input bridge
  const handleTouchInput = (action: string, active: boolean, valX = 0, valY = 0) => {
    setTouchControls((prev) => {
      if (action === 'move') {
        return { ...prev, moveX: valX, moveY: valY };
      }
      if (action === 'look') {
        return { ...prev, lookX: valX, lookY: valY };
      }
      return { ...prev, [action]: active };
    });
  };

  return (
    <div className="relative w-screen h-screen bg-slate-950 text-white overflow-hidden select-none">
      {/* 1. MAIN MENU */}
      {phase === 'menu' && (
        <MainMenu
          weapons={weapons}
          currentWeaponIndex={currentWeaponIndex}
          onSelectWeapon={setCurrentWeaponIndex}
          onUpdateWeaponCustomization={handleUpdateWeaponCustomization}
          selectedOperator={selectedOperator}
          onSelectOperator={setSelectedOperator}
          gameMode={gameMode}
          onSelectGameMode={setGameMode}
          botDifficulty={botDifficulty}
          onSelectBotDifficulty={setBotDifficulty}
          botCount={botCount}
          onSelectBotCount={setBotCount}
          sensitivity={sensitivity}
          onUpdateSensitivity={setSensitivity}
          volume={volume}
          onUpdateVolume={setVolume}
          isMuted={isMuted}
          onToggleMute={() => {
            const muted = soundEffects.toggleMute();
            setIsMuted(muted);
          }}
          onStartGame={handleStartGame}
        />
      )}

      {/* 2. 3D FPS COMBAT PHASE */}
      {phase === 'playing' && (
        <div className="relative w-full h-full">
          {/* Three.js FPS Canvas */}
          <GameCanvas
            weapons={weapons}
            currentWeaponIndex={currentWeaponIndex}
            onWeaponChange={setCurrentWeaponIndex}
            onAmmoChange={(mag, res) => {
              setCurrentMag(mag);
              setReserveAmmo(res);
            }}
            onHealthChange={(h, a) => {
              setHealth(h);
              setArmor(a);
            }}
            onHitEffect={handleHitEffect}
            onDamageTaken={handleDamageTaken}
            onKillfeed={handleKillfeed}
            onKillstreakEarned={handleKillstreakEarned}
            onScoreUpdate={(k, d, s, hs) => {
              setKills(k);
              setDeaths(d);
              setScore(s);
              setHeadshots(hs);
              setKillstreakCount((prev) => prev + 1);
            }}
            onMatchEnd={handleMatchEnd}
            gameMode={gameMode}
            botDifficulty={botDifficulty}
            botCount={botCount}
            sensitivity={sensitivity}
            activeKillstreaks={killstreaks}
            isADS={isADS}
            setIsADS={setIsADS}
            touchControlsActive={touchControlsActive}
            touchControls={touchControls}
          />

          {/* Tactical HUD Overlay */}
          <TacticalHUD
            weapon={weapons[currentWeaponIndex]}
            health={health}
            maxHealth={maxHealth}
            armor={armor}
            maxArmor={maxArmor}
            currentMag={currentMag}
            reserveAmmo={reserveAmmo}
            score={score}
            kills={kills}
            deaths={deaths}
            headshots={headshots}
            killstreakCount={killstreakCount}
            killstreaks={killstreaks}
            onActivateKillstreak={handleActivateKillstreak}
            isADS={isADS}
            hitEffects={hitEffects}
            damageIndicators={damageIndicators}
            killfeed={killfeed}
            gameMode={gameMode}
            targetScore={targetScore}
            matchTimeLeft={matchTimeLeft}
            isMuted={isMuted}
            onToggleMute={() => {
              const muted = soundEffects.toggleMute();
              setIsMuted(muted);
            }}
            onPause={() => setIsPaused(true)}
            touchControlsActive={touchControlsActive}
            setTouchControlsActive={setTouchControlsActive}
            onTouchInput={handleTouchInput}
          />

          {/* Pause Modal */}
          {isPaused && (
            <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 font-tactical">
              <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-white/10 p-6 flex flex-col gap-4 text-center">
                <span className="text-xs uppercase tracking-widest text-amber-500 font-bold">
                  TACTICAL PAUSE
                </span>
                <h2 className="text-2xl font-black uppercase text-white">OPERATION SUSPENDED</h2>
                <div className="flex flex-col gap-2 mt-2">
                  <button
                    onClick={() => {
                      soundEffects.playUIClick();
                      setIsPaused(false);
                    }}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs tracking-wider rounded-xl cursor-pointer"
                  >
                    RESUME COMBAT
                  </button>
                  <button
                    onClick={() => {
                      soundEffects.playUIClick();
                      setPhase('menu');
                    }}
                    className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold uppercase text-xs tracking-wider rounded-xl cursor-pointer"
                  >
                    RETURN TO LOBBY
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. GAME OVER / MATCH DEBRIEFING */}
      {phase === 'gameover' && (
        <GameOverModal
          victory={isMatchVictory}
          kills={kills}
          deaths={deaths}
          headshots={headshots}
          score={score}
          onRematch={handleStartGame}
          onReturnToLobby={() => setPhase('menu')}
        />
      )}
    </div>
  );
}
