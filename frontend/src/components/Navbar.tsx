import React from 'react';
import { Telescope, Info, Sparkles, Flame, Target } from 'lucide-react';
import type { GameScore } from '../types';

interface NavbarProps {
  score: GameScore;
  onOpenAbout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ score, onOpenAbout }) => {
  const userAcc = score.roundsPlayed > 0 
    ? Math.round((score.userCorrectCount / score.roundsPlayed) * 100) 
    : 0;
  const modelAcc = score.roundsPlayed > 0 
    ? Math.round((score.modelCorrectCount / score.roundsPlayed) * 100) 
    : 0;

  return (
    <header className="w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-sm shadow-cyan-500/20">
            <Telescope className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-white">Kepler<span className="text-cyan-400">Lens</span></span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300">
                NASA Transit Game
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Planet or Impostor? Machine Learning & SHAP Explainer</p>
          </div>
        </div>

        {/* Live Session Metrics */}
        <div className="flex items-center space-x-4 text-xs sm:text-sm">
          {score.roundsPlayed > 0 && (
            <div className="flex items-center space-x-3 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl">
              <div className="flex items-center space-x-1 text-amber-400" title="Current correct streak">
                <Flame className="w-4 h-4 fill-amber-400" />
                <span className="font-semibold">{score.streak}</span>
                <span className="text-slate-400 text-xs hidden md:inline">streak</span>
              </div>
              <div className="h-4 w-px bg-slate-800" />
              <div className="flex items-center space-x-1 text-cyan-400" title="Your accuracy">
                <Target className="w-4 h-4" />
                <span>You: <strong className="text-white">{userAcc}%</strong></span>
              </div>
              <div className="h-4 w-px bg-slate-800" />
              <div className="flex items-center space-x-1 text-purple-400" title="CatBoost model accuracy on played rounds">
                <Sparkles className="w-4 h-4" />
                <span>AI: <strong className="text-white">{modelAcc}%</strong></span>
              </div>
            </div>
          )}

          {/* About Model Button */}
          <button
            onClick={onOpenAbout}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs sm:text-sm transition-colors cursor-pointer"
            aria-label="Open information about the machine learning model"
          >
            <Info className="w-4 h-4 text-cyan-400" />
            <span className="font-medium">About Model</span>
          </button>
        </div>
      </div>
    </header>
  );
};
