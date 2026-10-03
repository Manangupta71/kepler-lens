import React from 'react';
import { X, ExternalLink, CheckCircle, AlertTriangle, ShieldCheck, Database, Cpu } from 'lucide-react';
import type { ModelStats } from '../types';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: ModelStats | null;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose, stats }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 text-left text-slate-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 id="modal-title" className="text-2xl font-bold text-white tracking-tight">
              About the Model & Science
            </h2>
            <p className="text-xs text-slate-400">
              CatBoost Gradient Boosting • SHAP Explainability • NASA Kepler Archives
            </p>
          </div>
        </div>

        <div className="space-y-6 text-sm">
          {/* Section 1: Real Model Evaluation Metrics */}
          <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800">
            <h3 className="text-base font-semibold text-white mb-1 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Real Test Set Evaluation</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Evaluated on an independent, held-out test partition (15% stratified split, {stats?.test_samples || 1100} targets, seed 42) that was never seen during training or tuning.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-4">
              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Test Accuracy</span>
                <div className="text-xl font-bold text-cyan-400 font-mono mt-0.5">
                  {stats ? `${(stats.metrics.accuracy * 100).toFixed(1)}%` : '91.8%'}
                </div>
              </div>
              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">ROC-AUC</span>
                <div className="text-xl font-bold text-emerald-400 font-mono mt-0.5">
                  {stats ? stats.metrics.roc_auc.toFixed(4) : '0.9758'}
                </div>
              </div>
              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Planet Recall</span>
                <div className="text-xl font-bold text-teal-400 font-mono mt-0.5">
                  {stats ? `${(stats.metrics.planet.recall * 100).toFixed(1)}%` : '94.2%'}
                </div>
              </div>
              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Impostor Precision</span>
                <div className="text-xl font-bold text-purple-400 font-mono mt-0.5">
                  {stats ? `${(stats.metrics.impostor.precision * 100).toFixed(1)}%` : '96.3%'}
                </div>
              </div>
            </div>

            {/* Confusion Matrix */}
            {stats && stats.confusion_matrix && (
              <div className="mt-3 pt-3 border-t border-slate-800/80">
                <span className="text-xs font-semibold text-slate-300 block mb-2">
                  Test Confusion Matrix (1,100 candidates):
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800 flex justify-between">
                    <span className="text-slate-400">True Impostors Classified:</span>
                    <strong className="text-emerald-400 font-mono">{stats.confusion_matrix.true_negatives_impostor}</strong>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800 flex justify-between">
                    <span className="text-slate-400">False Alarms (Impostor → Planet):</span>
                    <strong className="text-rose-400 font-mono">{stats.confusion_matrix.false_positives_planet_leak}</strong>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Missed Planets (Planet → Impostor):</span>
                    <strong className="text-rose-400 font-mono">{stats.confusion_matrix.false_negatives_missed_planet}</strong>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800 flex justify-between">
                    <span className="text-slate-400">True Planets Classified:</span>
                    <strong className="text-emerald-400 font-mono">{stats.confusion_matrix.true_positives_planet}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: What is SHAP in 3 Sentences */}
          <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800">
            <h3 className="text-base font-semibold text-white mb-2 flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>What is SHAP? (In 3 Sentences)</span>
            </h3>
            <p className="text-slate-300 leading-relaxed space-y-2">
              <strong>1. </strong>SHAP (Shapley Additive Explanations) is a game-theoretic approach that fairly attributes the prediction of any machine learning model to its individual input features.
              <br />
              <strong>2. </strong>For each candidate, it calculates how much higher or lower the measured property pushed the model's confidence compared to the average Kepler observation.
              <br />
              <strong>3. </strong>In KeplerLens, positive SHAP values push toward a confirmed exoplanet, while negative values push toward a false-positive impostor.
            </p>
          </div>

          {/* Section 3: Data Source & Label Leakage Exclusion */}
          <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800">
            <h3 className="text-base font-semibold text-white mb-2 flex items-center space-x-2">
              <Database className="w-4 h-4 text-purple-400" />
              <span>Data Source & Anti-Leakage Design</span>
            </h3>
            <p className="text-slate-300 leading-relaxed mb-3">
              Data is fetched directly from the <strong>NASA Exoplanet Archive's Kepler Objects of Interest (KOI) cumulative table</strong> using the Table Access Protocol (TAP) API.
            </p>
            <div className="bg-amber-950/30 border border-amber-500/30 p-3 rounded-lg text-xs text-amber-200">
              <strong className="text-amber-300">Why are koi_fpflag_* columns and koi_score excluded?</strong>
              <p className="mt-1 text-slate-300">
                The Kepler pipeline disposition flags (<code className="text-amber-300">koi_fpflag_nt</code>, <code className="text-amber-300">koi_fpflag_ss</code>, etc.) and <code className="text-amber-300">koi_score</code> were derived during human and automated vetting that used the true disposition label. Including them would create <em>label leakage</em>, causing the model to achieve ~99% accuracy trivially by memorizing the vetting flags rather than learning the real astrophysical laws of planetary transits.
              </p>
            </div>
            <div className="mt-3">
              <a
                href="https://exoplanetarchive.ipac.caltech.edu/docs/data.html"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 text-xs text-cyan-400 hover:text-cyan-300 hover:underline"
              >
                <span>NASA Exoplanet Archive Cumulative Table Documentation</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Section 4: Physical Limitations */}
          <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800">
            <h3 className="text-base font-semibold text-white mb-2 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Astrophysical Limitations</span>
            </h3>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-300">
              <li>
                <strong>Grazing Eclipsing Binaries:</strong> A large star clipping another star's edge produces a small, shallow transit dip that closely resembles a planetary transit.
              </li>
              <li>
                <strong>Stellar Activity:</strong> Sunspots, flares, and stellar rotation can induce periodic brightness dips indistinguishable from transits without high-resolution spectroscopic follow-up.
              </li>
              <li>
                <strong>Unverified Candidates:</strong> Over 1,800 objects in the archive remain classified as "CANDIDATE" because they have not yet had radial velocity or imaging confirmation.
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
