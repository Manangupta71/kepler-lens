import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts';
import type { ShapContribution } from '../types';

interface ShapChartProps {
  contributions: ShapContribution[];
}

export const ShapChart: React.FC<ShapChartProps> = ({ contributions }) => {
  // Take top 6 influential features for clean presentation
  const displayContributions = contributions.slice(0, 6);

  const chartData = displayContributions.map((item) => {
    const unitStr = item.unit && item.unit !== 'dimensionless' ? ` ${item.unit}` : '';
    return {
      name: item.short_name || item.display_name,
      fullName: item.display_name,
      value: item.shap_value,
      measuredVal: `${item.value}${unitStr}`,
      direction: item.direction,
      fragment: item.fragment,
    };
  }).reverse(); // Reverse so top driver appears on top in vertical layout

  return (
    <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-2 border-b border-slate-800/80 gap-2">
        <div>
          <h4 className="text-sm font-semibold text-white tracking-wide">
            Feature Attribution (SHAP Contributions)
          </h4>
          <p className="text-xs text-slate-400">
            How individual candidate measurements influenced the AI decision
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block" />
            <span className="text-slate-300">Pushes Impostor (False Positive)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-sm bg-cyan-400 inline-block" />
            <span className="text-slate-300">Pushes Planet (Confirmed)</span>
          </div>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
          >
            <XAxis
              type="number"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              domain={['auto', 'auto']}
              tickFormatter={(v) => v.toFixed(1)}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#cbd5e1"
              fontSize={12}
              tickLine={false}
              width={100}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  const isPlanet = data.value > 0;
                  return (
                    <div className="bg-slate-950/95 border border-slate-700 p-3 rounded-xl shadow-xl text-xs text-left max-w-xs backdrop-blur-md">
                      <div className="font-semibold text-white mb-1">{data.fullName}</div>
                      <div className="text-slate-300 mb-1">
                        Measured Value: <span className="font-mono text-cyan-300">{data.measuredVal}</span>
                      </div>
                      <div className="text-slate-300 mb-1">
                        SHAP Value: <span className="font-mono text-white">{data.value > 0 ? `+${data.value}` : data.value}</span>
                      </div>
                      <div className={`font-medium ${isPlanet ? 'text-cyan-400' : 'text-rose-400'}`}>
                        {isPlanet ? '→ Pushed classification toward Planet' : '← Pushed classification toward Impostor'}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine x={0} stroke="#475569" strokeDasharray="3 3" />
            <Bar dataKey="value" radius={[4, 4, 4, 4]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.value >= 0 ? '#06b6d4' : '#f43f5e'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 text-center text-[11px] text-slate-400 italic">
        SHAP values quantify each feature's contribution in log-odds space relative to the baseline population average.
      </div>
    </div>
  );
};
