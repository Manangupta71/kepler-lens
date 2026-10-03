import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, AlertCircle, ArrowRight, Sparkles, Orbit, ShieldAlert } from 'lucide-react';
import type { GuessResult } from '../types';
import { ShapChart } from './ShapChart';

interface RevealScreenProps {
  result: GuessResult;
  onNextRound: () => void;
  isLoading: boolean;
}

export const RevealScreen: React.FC<RevealScreenProps> = ({
  result,
  onNextRound,
  isLoading,
}) => {
  // Listen for space or enter key to proceed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        onNextRound();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNextRound]);

  const isUserCorrect = result.user_correct;
  const isModelCorrect = result.model_correct;
  const isCandidate = result.is_candidate;

  const userGuessedPlanet = result.user_guess === 'CONFIRMED';
  const modelPredictedPlanet = result.model_prediction === 'CONFIRMED';
  const trueIsPlanet = result.true_label === 'CONFIRMED';

  const planetConfidence = Math.round(result.model_probability.CONFIRMED * 100);
  const impostorConfidence = Math.round(result.model_probability['FALSE POSITIVE'] * 100);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Top Banner: Outcome & Comparison */}
      <div className="glass-panel p-6 border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-800 gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {result.id}
              </span>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {result.display_name}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">Ground Truth vs Predictions</p>
          </div>

          {/* Outcome Badge */}
          <div>
            {isCandidate ? (
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm font-semibold">
                <AlertCircle className="w-4 h-4" />
                <span>No Ground Truth Yet (NASA Candidate)</span>
              </div>
            ) : isUserCorrect ? (
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Your Guess Was Spot On!</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-semibold">
                <XCircle className="w-4 h-4" />
                <span>Missed This One</span>
              </div>
            )}
          </div>
        </div>

        {/* 3-Column Comparison: User vs Model vs Truth */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* User Guess */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Your Guess</span>
            <div className="mt-2 flex items-center justify-center space-x-2">
              {userGuessedPlanet ? (
                <Orbit className="w-5 h-5 text-cyan-400" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-rose-400" />
              )}
              <span className={`text-lg font-bold ${userGuessedPlanet ? 'text-cyan-400' : 'text-rose-400'}`}>
                {userGuessedPlanet ? 'Planet' : 'Impostor'}
              </span>
            </div>
            {!isCandidate && (
              <div className="mt-2 text-xs">
                {isUserCorrect ? (
                  <span className="text-emerald-400 font-medium">✓ Correct</span>
                ) : (
                  <span className="text-rose-400 font-medium">✗ Incorrect</span>
                )}
              </div>
            )}
          </div>

          {/* Model Prediction */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-cyan-500/30 text-center shadow-sm shadow-cyan-500/5">
            <div className="flex items-center justify-center space-x-1 text-xs text-cyan-400 uppercase tracking-wider font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Model Prediction</span>
            </div>
            <div className="mt-2 flex items-center justify-center space-x-2">
              {modelPredictedPlanet ? (
                <Orbit className="w-5 h-5 text-cyan-400" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-rose-400" />
              )}
              <span className={`text-lg font-bold ${modelPredictedPlanet ? 'text-cyan-400' : 'text-rose-400'}`}>
                {modelPredictedPlanet ? 'Planet' : 'Impostor'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ({modelPredictedPlanet ? planetConfidence : impostorConfidence}%)
              </span>
            </div>
            {!isCandidate && (
              <div className="mt-2 text-xs">
                {isModelCorrect ? (
                  <span className="text-emerald-400 font-medium">✓ Model Correct</span>
                ) : (
                  <span className="text-rose-400 font-medium">✗ Model Inaccurate</span>
                )}
              </div>
            )}
          </div>

          {/* NASA Truth */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">NASA Ground Truth</span>
            <div className="mt-2 flex items-center justify-center space-x-2">
              {isCandidate ? (
                <span className="text-lg font-bold text-amber-300">Unconfirmed</span>
              ) : trueIsPlanet ? (
                <span className="text-lg font-bold text-emerald-400">Confirmed Planet</span>
              ) : (
                <span className="text-lg font-bold text-rose-400">False Positive</span>
              )}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              {isCandidate ? 'Awaiting follow-up observation' : 'NASA Kepler Archives'}
            </div>
          </div>
        </div>

        {/* Model Confidence Bar */}
        <div className="w-full bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80">
          <div className="flex justify-between text-xs mb-1.5 font-medium">
            <span className="text-cyan-400">Planet Probability: {planetConfidence}%</span>
            <span className="text-rose-400">Impostor Probability: {impostorConfidence}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
            <div
              className="bg-gradient-to-r from-teal-500 to-cyan-400 h-full transition-all duration-500"
              style={{ width: `${planetConfidence}%` }}
            />
            <div
              className="bg-gradient-to-r from-amber-500 to-rose-500 h-full transition-all duration-500"
              style={{ width: `${impostorConfidence}%` }}
            />
          </div>
        </div>
      </div>

      {/* Plain-English Templated Explanation Card */}
      <div className="glass-panel p-5 border-slate-800 bg-gradient-to-r from-slate-900/90 to-slate-950/90">
        <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-2">
          <Sparkles className="w-4 h-4" />
          <span>Physical Explanation (Derived from Top SHAP Features)</span>
        </div>
        <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
          {result.explanation}
        </p>
      </div>

      {/* Interactive SHAP Waterfall/Bar Chart */}
      <ShapChart contributions={result.top_shap_contributions} />

      {/* Action: Next Round */}
      <div className="flex justify-center pt-2">
        <button
          onClick={onNextRound}
          disabled={isLoading}
          className="flex items-center space-x-3 px-8 py-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-lg shadow-lg shadow-cyan-600/30 transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <span>Next Candidate</span>
          <ArrowRight className="w-5 h-5" />
          <span className="text-xs text-cyan-200/70 font-mono hidden sm:inline ml-2">
            [Space / Enter]
          </span>
        </button>
      </div>
    </div>
  );
};
