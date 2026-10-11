import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { soundEffects } from '../../services/soundEffects';
import { RotateCcw, Home, Award, Target, Zap } from 'lucide-react';

interface GameOverModalProps {
  victory: boolean;
  kills: number;
  deaths: number;
  headshots: number;
  score: number;
  onRematch: () => void;
  onReturnToLobby: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  victory,
  kills,
  deaths,
  headshots,
  score,
  onRematch,
  onReturnToLobby,
}) => {
  useEffect(() => {
    if (victory) {
      soundEffects.playKillstreakEarned();
      soundEffects.playVoiceCallout('Mission accomplished! Victory is ours.');
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#ef4444', '#10b981', '#38bdf8'],
        });
      } catch {
        // Fallback
      }
    } else {
      soundEffects.playVoiceCallout('Tactical defeat. Regroup and retaliate!');
    }
  }, [victory]);

  const kdRatio = (kills / Math.max(1, deaths)).toFixed(2);
  const headshotRatio = kills > 0 ? Math.round((headshots / kills) * 100) : 0;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-6 font-tactical select-none">
      <div className="relative w-full max-w-xl rounded-2xl border border-white/15 bg-slate-950/95 p-8 shadow-2xl flex flex-col items-center text-center overflow-hidden">
        {/* Glow backdrop */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-30 ${
            victory ? 'bg-amber-500' : 'bg-red-600'
          }`}
        />

        {/* Victory / Defeat Badge */}
        <span className="text-xs uppercase tracking-widest text-slate-400 font-mono">
          MATCH DEBRIEFING REPORT
        </span>

        <h1
          className={`text-5xl md:text-6xl font-black uppercase tracking-tight mt-1 ${
            victory
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 drop-shadow-[0_0_25px_rgba(245,158,11,0.5)]'
              : 'text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-700 drop-shadow-[0_0_25px_rgba(239,68,68,0.5)]'
          }`}
        >
          {victory ? 'VICTORY' : 'DEFEAT'}
        </h1>

        <p className="text-slate-400 text-sm mt-1 max-w-sm font-sans">
          {victory
            ? 'Hostile forces eliminated. Sector successfully secured.'
            : 'Combat threshold exceeded. Regroup and re-engage sector.'}
        </p>

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 flex flex-col">
            <span className="text-[10px] uppercase text-slate-400">TOTAL KILLS</span>
            <span className="text-2xl font-black font-mono text-white mt-0.5">{kills}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 flex flex-col">
            <span className="text-[10px] uppercase text-slate-400">DEATHS</span>
            <span className="text-2xl font-black font-mono text-slate-300 mt-0.5">{deaths}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 flex flex-col">
            <span className="text-[10px] uppercase text-slate-400">K/D RATIO</span>
            <span className="text-2xl font-black font-mono text-emerald-400 mt-0.5">{kdRatio}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 flex flex-col">
            <span className="text-[10px] uppercase text-slate-400">HEADSHOT %</span>
            <span className="text-2xl font-black font-mono text-amber-400 mt-0.5">{headshotRatio}%</span>
          </div>
        </div>

        {/* Score & MVP Tag */}
        <div className="w-full mt-4 p-4 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-white uppercase">MATCH COMBAT MVP</div>
              <div className="text-[11px] text-amber-400 font-mono">OPERATOR (+{score} COMBAT XP)</div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase text-slate-400 block">FINAL SCORE</span>
            <span className="text-xl font-bold font-mono text-white">{score}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex gap-3 mt-6">
          <button
            onClick={() => {
              soundEffects.playUIClick();
              onReturnToLobby();
            }}
            className="flex-1 py-3.5 px-4 rounded-xl border border-white/15 bg-slate-900/80 hover:bg-slate-850 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            LOBBY
          </button>

          <button
            onClick={() => {
              soundEffects.playUIClick();
              onRematch();
            }}
            className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            REMATCH
          </button>
        </div>
      </div>
    </div>
  );
};
