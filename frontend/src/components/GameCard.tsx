import React from 'react';
import { Orbit, ShieldAlert } from 'lucide-react';
import type { FeatureDictItem, RoundData } from '../types';
import { FeatureTooltip } from './FeatureTooltip';

interface GameCardProps {
  round: RoundData;
  featuresDict: Record<string, FeatureDictItem>;
  onGuess: (guess: 'CONFIRMED' | 'FALSE POSITIVE') => void;
  isLoading: boolean;
}

export const GameCard: React.FC<GameCardProps> = ({
  round,
  featuresDict,
  onGuess,
  isLoading,
}) => {
  const featEntries = Object.entries(round.features);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
      {/* Candidate Header Card */}
      <div className="glass-panel p-6 border-slate-800 relative overflow-hidden">
        {/* Subtle accent glow */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-5">
          <div>
            <div className="flex items-center space-x-2.5 mb-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {round.display_name}
              </h2>
              {round.is_candidate && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                  NASA Candidate Holdout
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400">
              Kepler Object of Interest • Light-curve transit detection
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
            <span>ID: <strong className="text-cyan-300 font-mono">{round.id}</strong></span>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {featEntries.map(([key, item]) => {
            const meta = featuresDict[key];
            const isHighlight = key === 'koi_prad' || key === 'koi_depth' || key === 'koi_model_snr';

            return (
              <div
                key={key}
                className={`p-3.5 rounded-xl border transition-all ${
                  isHighlight
                    ? 'bg-slate-900/90 border-cyan-500/30 shadow-sm shadow-cyan-500/5'
                    : 'bg-slate-950/60 border-slate-800/90 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-slate-400 truncate" title={item.display_name}>
                    {item.short_name || item.display_name}
                  </span>
                  <FeatureTooltip featureKey={key} meta={meta} />
                </div>

                <div className="flex items-baseline space-x-1.5">
                  <span className="text-lg sm:text-xl font-bold font-mono text-white tracking-tight">
                    {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                  </span>
                  {item.unit && item.unit !== 'dimensionless' && (
                    <span className="text-[11px] text-cyan-400/90 font-medium truncate max-w-[80px]">
                      {item.unit}
                    </span>
                  )}
                </div>

                <div className="mt-1 text-[11px] text-slate-500 truncate">
                  {meta?.typical_range ? `Norm: ${meta.typical_range}` : item.display_name}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Decision Arena: Planet vs Impostor */}
      <div className="glass-panel p-5 border-slate-800 flex flex-col items-center">
        <h3 className="text-sm font-semibold text-slate-300 mb-3 tracking-wide uppercase text-center">
          What is your verdict?
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
          {/* Planet Button */}
          <button
            onClick={() => onGuess('CONFIRMED')}
            disabled={isLoading}
            className="group relative flex items-center justify-center space-x-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-lg shadow-lg shadow-cyan-600/25 transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
            aria-label="Guess Confirmed Exoplanet"
          >
            <Orbit className="w-6 h-6 group-hover:rotate-45 transition-transform" />
            <div className="text-left">
              <div>Planet</div>
              <div className="text-xs font-normal text-cyan-100 opacity-90">Confirmed World</div>
            </div>
            <span className="absolute bottom-1 right-2 text-[10px] text-cyan-200/60 font-mono hidden sm:inline">
              [P] or [1]
            </span>
          </button>

          {/* Impostor Button */}
          <button
            onClick={() => onGuess('FALSE POSITIVE')}
            disabled={isLoading}
            className="group relative flex items-center justify-center space-x-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-lg shadow-lg shadow-rose-600/25 transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
            aria-label="Guess False Positive Impostor"
          >
            <ShieldAlert className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <div>Impostor</div>
              <div className="text-xs font-normal text-rose-100 opacity-90">False Positive</div>
            </div>
            <span className="absolute bottom-1 right-2 text-[10px] text-rose-200/60 font-mono hidden sm:inline">
              [I] or [2]
            </span>
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-500 text-center">
          Hotkeys enabled: Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">1</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">P</kbd> for Planet, <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">2</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">I</kbd> for Impostor.
        </p>
      </div>
    </div>
  );
};
