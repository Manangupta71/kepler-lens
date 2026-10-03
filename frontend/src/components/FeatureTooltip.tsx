import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';
import type { FeatureDictItem } from '../types';

interface FeatureTooltipProps {
  featureKey: string;
  meta?: FeatureDictItem;
}

export const FeatureTooltip: React.FC<FeatureTooltipProps> = ({ featureKey, meta }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!meta) return null;

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1 text-slate-400 hover:text-cyan-400 transition-colors rounded-full hover:bg-slate-800/80 cursor-pointer focus:outline-none"
        aria-label={`Learn about ${meta.name}`}
        title={`What is ${meta.name}?`}
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div 
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 sm:w-80 p-3.5 bg-slate-900/95 border border-cyan-500/40 rounded-xl shadow-2xl backdrop-blur-xl text-left text-xs text-slate-300 pointer-events-auto transition-all animate-in fade-in zoom-in-95"
          role="dialog"
          aria-labelledby={`tooltip-title-${featureKey}`}
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <div>
              <span id={`tooltip-title-${featureKey}`} className="font-semibold text-white text-sm">
                {meta.name}
              </span>
              {meta.unit && meta.unit !== 'dimensionless' && (
                <span className="ml-1.5 text-cyan-400 text-[11px] font-mono">({meta.unit})</span>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-0.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
              aria-label="Close tooltip"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-slate-300 leading-relaxed mb-2.5">
            {meta.plain_description}
          </p>

          <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80 space-y-1.5 text-[11px]">
            <div>
              <strong className="text-cyan-300">Why it matters: </strong>
              <span className="text-slate-300">{meta.detection_significance}</span>
            </div>
            {meta.typical_range && (
              <div>
                <strong className="text-slate-400">Typical range: </strong>
                <span className="text-slate-300 font-mono">{meta.typical_range}</span>
              </div>
            )}
            {meta.planet_tendency && (
              <div className="text-emerald-400/90 pt-0.5 border-t border-slate-800/60">
                <strong>Planet tendency: </strong>
                <span>{meta.planet_tendency}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
