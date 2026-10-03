import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { GameCard } from './components/GameCard';
import { RevealScreen } from './components/RevealScreen';
import { AboutModal } from './components/AboutModal';
import { fetchFeatures, fetchRound, fetchStats, submitGuess } from './services/api';
import type { FeatureDictItem, GameScore, GuessResult, ModelStats, RoundData } from './types';
import { Loader2, AlertCircle } from 'lucide-react';

const SCORE_STORAGE_KEY = 'keplerlens_score_v1';

export const App: React.FC = () => {
  const [round, setRound] = useState<RoundData | null>(null);
  const [guessResult, setGuessResult] = useState<GuessResult | null>(null);
  const [featuresDict, setFeaturesDict] = useState<Record<string, FeatureDictItem>>({});
  const [modelStats, setModelStats] = useState<ModelStats | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);

  // Persistent score
  const [score, setScore] = useState<GameScore>(() => {
    try {
      const saved = localStorage.getItem(SCORE_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load score from storage', e);
    }
    return {
      streak: 0,
      bestStreak: 0,
      roundsPlayed: 0,
      userCorrectCount: 0,
      modelCorrectCount: 0,
    };
  });

  // Save score on change
  useEffect(() => {
    try {
      localStorage.setItem(SCORE_STORAGE_KEY, JSON.stringify(score));
    } catch (e) {
      console.error('Failed to persist score', e);
    }
  }, [score]);

  // Load metadata on initial mount
  useEffect(() => {
    async function initMetadata() {
      try {
        const [dict, stats] = await Promise.all([fetchFeatures(), fetchStats()]);
        setFeaturesDict(dict);
        setModelStats(stats);
      } catch (err: any) {
        console.warn('Metadata fetch warning:', err);
      }
    }
    initMetadata();
  }, []);

  // Load a round
  const loadNewRound = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setGuessResult(null);
    try {
      const data = await fetchRound();
      setRound(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load round. Is the backend server running?');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNewRound();
  }, [loadNewRound]);

  // Handle user guess
  const handleGuess = async (guess: 'CONFIRMED' | 'FALSE POSITIVE') => {
    if (!round || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await submitGuess(round.id, guess);
      setGuessResult(result);

      // Update session metrics if not an unconfirmed candidate
      if (!result.is_candidate && result.user_correct !== null) {
        setScore((prev) => {
          const userCorrect = result.user_correct!;
          const modelCorrect = !!result.model_correct;
          const newStreak = userCorrect ? prev.streak + 1 : 0;
          const newBest = Math.max(prev.bestStreak, newStreak);

          return {
            streak: newStreak,
            bestStreak: newBest,
            roundsPlayed: prev.roundsPlayed + 1,
            userCorrectCount: prev.userCorrectCount + (userCorrect ? 1 : 0),
            modelCorrectCount: prev.modelCorrectCount + (modelCorrect ? 1 : 0),
          };
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to evaluate guess.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard navigation for GameCard screen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If modal or reveal screen is open, don't trigger game guess
      if (isAboutOpen || guessResult || isLoading || isSubmitting) return;

      if (e.key === 'p' || e.key === 'P' || e.key === '1') {
        e.preventDefault();
        handleGuess('CONFIRMED');
      } else if (e.key === 'i' || e.key === 'I' || e.key === '2') {
        e.preventDefault();
        handleGuess('FALSE POSITIVE');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAboutOpen, guessResult, isLoading, isSubmitting, round]);

  return (
    <div className="min-h-screen flex flex-col bg-[#060913] text-slate-100 selection:bg-cyan-500/30">
      <Navbar score={score} onOpenAbout={() => setIsAboutOpen(true)} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 sm:py-10 flex flex-col justify-center">
        {/* Error Notification */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={loadNewRound}
              className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !round && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin text-cyan-400 mb-3" />
            <p className="text-sm font-medium">Scanning Kepler light-curves...</p>
          </div>
        )}

        {/* Active Round: Game Card or Reveal Screen */}
        {round && !isLoading && (
          <>
            {guessResult ? (
              <RevealScreen
                result={guessResult}
                onNextRound={loadNewRound}
                isLoading={isLoading}
              />
            ) : (
              <GameCard
                round={round}
                featuresDict={featuresDict}
                onGuess={handleGuess}
                isLoading={isSubmitting}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 py-4 text-center text-xs text-slate-500">
        <p>
          KeplerLens • Trained with CatBoost on NASA Exoplanet Archive cumulative catalog • Explained via SHAP
        </p>
      </footer>

      {/* About the Model Modal */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        stats={modelStats}
      />
    </div>
  );
};

export default App;
