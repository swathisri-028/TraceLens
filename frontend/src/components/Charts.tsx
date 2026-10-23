import React from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';
import { TimeSeriesPoint, ThresholdPoint } from '../types';

interface ActivityChartProps {
  data: TimeSeriesPoint[];
}

export const ActivityTimeSeriesChart: React.FC<ActivityChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-sm border border-dashed border-slate-800 rounded-xl">
        No time-series data available for current log range
      </div>
    );
  }

  // Format timestamp for display (HH:mm:ss or window id)
  const formattedData = data.map((d, index) => {
    let label = `W-${index + 1}`;
    if (d.timestamp && d.timestamp.includes('T')) {
      const parts = d.timestamp.split('T')[1];
      label = parts ? parts.substring(0, 8) : d.timestamp;
    } else if (d.timestamp && d.timestamp.length > 8) {
      label = d.timestamp.substring(11, 19);
    }
    return {
      ...d,
      displayTime: label,
    };
  });

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey="displayTime"
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#1e293b' }}
          />
          <YAxis
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#1e293b' }}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#334155',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#f8fafc',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
            }}
            labelStyle={{ color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}
            formatter={(value: any, name: any) => {
              if (name === 'total_events') return [value, 'Total Logs'];
              if (name === 'errors') return [value, 'Errors & Critical'];
              if (name === 'anomaly_score') return [Number(value).toFixed(2), 'Anomaly Score'];
              return [value, name];
            }}
          />
          <Legend
            verticalAlign="top"
            height={36}
            formatter={(val) => {
              if (val === 'total_events') return <span className="text-xs text-slate-300">Total Throughput</span>;
              if (val === 'errors') return <span className="text-xs text-rose-400">Error Frequency</span>;
              return val;
            }}
          />
          <Area
            type="monotone"
            dataKey="total_events"
            stroke="#3b82f6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorTotal)"
          />
          <Area
            type="monotone"
            dataKey="errors"
            stroke="#f43f5e"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorErrors)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

interface LogLevelChartProps {
  levelCounts: Record<string, number>;
}

export const LogLevelDistributionChart: React.FC<LogLevelChartProps> = ({ levelCounts }) => {
  const chartData = [
    { level: 'DEBUG', count: levelCounts['DEBUG'] || 0, color: '#64748b' },
    { level: 'INFO', count: levelCounts['INFO'] || 0, color: '#38bdf8' },
    { level: 'WARN', count: levelCounts['WARN'] || 0, color: '#f59e0b' },
    { level: 'ERROR', count: levelCounts['ERROR'] || 0, color: '#f43f5e' },
    { level: 'CRITICAL', count: levelCounts['CRITICAL'] || 0, color: '#a855f7' },
  ].filter(d => d.count > 0);

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-sm border border-dashed border-slate-800 rounded-xl">
        No log levels parsed
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey="level"
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#1e293b' }}
          />
          <YAxis
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#1e293b' }}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#334155',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#f8fafc',
            }}
            formatter={(value: any) => [`${value} logs`, 'Frequency']}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

interface ThresholdCurveProps {
  data: ThresholdPoint[];
  currentThreshold: number;
}

export const ThresholdCurveChart: React.FC<ThresholdCurveProps> = ({ data, currentThreshold }) => {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey="threshold"
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#1e293b' }}
            tickFormatter={(t) => `${t.toFixed(2)}`}
          />
          <YAxis
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#1e293b' }}
            domain={[0, 1]}
            ticks={[0, 0.25, 0.5, 0.75, 1.0]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#334155',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#f8fafc',
            }}
            formatter={(val: any) => [Number(val).toFixed(3), '']}
          />
          <Legend
            verticalAlign="top"
            height={36}
            formatter={(val) => {
              if (val === 'precision') return <span className="text-xs text-sky-400">Precision</span>;
              if (val === 'recall') return <span className="text-xs text-emerald-400">Recall</span>;
              if (val === 'f1') return <span className="text-xs text-purple-400 font-bold">F1-Score</span>;
              return val;
            }}
          />
          <Line
            type="monotone"
            dataKey="precision"
            stroke="#38bdf8"
            strokeWidth={2}
            dot={{ r: 3, fill: '#38bdf8' }}
          />
          <Line
            type="monotone"
            dataKey="recall"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 3, fill: '#10b981' }}
          />
          <Line
            type="monotone"
            dataKey="f1"
            stroke="#a855f7"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#a855f7' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
