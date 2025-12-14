import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  ComposedChart,
  Line,
  Legend
} from 'recharts';
import { DailyStats } from '../types';

interface StatsModuleProps {
  statsHistory: DailyStats[];
}

export const StatsModule: React.FC<StatsModuleProps> = ({ statsHistory }) => {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const getData = () => {
    // Sort by date just in case
    const sorted = [...statsHistory].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (period === 'daily') return sorted.slice(-7); // Last 7 days
    if (period === 'weekly') return sorted.slice(-4 * 7); // Last 4 weeks (simplified)
    if (period === 'monthly') return sorted.slice(-12 * 7); // Last few months (simplified)
    
    return sorted;
  };

  const data = getData().map(d => ({
    ...d,
    shortDate: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
    totalOutput: d.burned + d.bmr
  }));

  return (
    <div className="p-6 pb-32 space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Trends</h1>
        <div className="bg-gray-100 p-1 rounded-xl flex">
            {['daily', 'weekly', 'monthly'].map(p => (
                <button 
                    key={p}
                    onClick={() => setPeriod(p as any)}
                    className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wide rounded-lg transition-all ${
                        period === p ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'
                    }`}
                >
                    {p}
                </button>
            ))}
        </div>
      </header>

      {/* Calories Chart */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">Calorie Balance</h3>
        <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="shortDate" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                    <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        cursor={{fill: '#f3f4f6'}}
                    />
                    <Bar dataKey="intake" name="Intake" fill="#4ade80" radius={[4, 4, 0, 0]} stackId="a" />
                    <Bar dataKey="totalOutput" name="Output" fill="#fb923c" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Exercise Overview (Time & Calories) */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">Exercise Activity</h3>
        <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="shortDate" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                    
                    {/* Left Axis: Minutes */}
                    <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#60a5fa'}} />
                    
                    {/* Right Axis: Calories */}
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#fb923c'}} />
                    
                    <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        cursor={{fill: '#f3f4f6'}}
                    />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    
                    <Bar yAxisId="left" dataKey="exerciseMinutes" name="Time (min)" fill="#60a5fa" radius={[4, 4, 0, 0]} barSize={20} />
                    <Line yAxisId="right" type="monotone" dataKey="burned" name="Burned (kcal)" stroke="#fb923c" strokeWidth={2} dot={{r: 3}} />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};